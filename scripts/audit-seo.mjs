import { writeFile } from "node:fs/promises";
import { auditHtml, sitemapUrls } from "./seo-audit-utils.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const base = new URL(option("--base-url", "https://meuapecomrosa.com.br"));
const canonicalOrigin = "https://meuapecomrosa.com.br";
const report = option("--report", null);
async function get(path) {
  return fetch(new URL(path, base), { signal: AbortSignal.timeout(30000), headers: { "User-Agent": "MeuApeComRosa-SEO-Audit/1.0" } });
}

const sitemap = await get("/sitemap.xml");
if (!sitemap.ok) throw new Error(`Sitemap HTTP ${sitemap.status}`);
const urls = sitemapUrls(await sitemap.text());
if (!urls.length) throw new Error("Sitemap vazio");
if (urls.some((url) => new URL(url).origin !== canonicalOrigin)) throw new Error("Sitemap contém domínio inesperado");
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const canonical = urls[cursor++];
    try {
      const path = new URL(canonical).pathname;
      const response = await get(path);
      const parsed = auditHtml(await response.text(), new URL(path, canonicalOrigin).href);
      if (response.status !== 200) parsed.issues.push(`HTTP ${response.status}`);
      if (response.redirected) parsed.issues.push("Redirecionamento dentro do sitemap");
      if (/noindex/i.test(response.headers.get("x-robots-tag") || "")) parsed.issues.push("Cabeçalho HTTP noindex");
      results.push({ url: canonical, status: response.status, ...parsed });
    } catch (error) { results.push({ url: canonical, issues: [error.message] }); }
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
const failures = results.filter((result) => result.issues.length);
const titles = results.map((result) => result.title).filter(Boolean);
const duplicateTitles = [...new Set(titles.filter((title, index) => titles.indexOf(title) !== index))];
const robots = await (await get("/robots.txt")).text();
const robotsAllowsPublic = !/^Disallow:\s*\/\s*$/m.test(robots) && robots.includes(`${canonicalOrigin}/sitemap.xml`);
const output = { checkedAt: new Date().toISOString(), base: base.origin, pages: urls.length, uniqueUrls: new Set(urls).size, robotsAllowsPublic, duplicateTitles, failures, results: results.sort((a, b) => a.url.localeCompare(b.url)) };
if (report) await writeFile(report, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ pages: output.pages, uniqueUrls: output.uniqueUrls, robotsAllowsPublic, duplicateTitles, failures }, null, 2));
if (failures.length || duplicateTitles.length || !robotsAllowsPublic || output.uniqueUrls !== output.pages) process.exitCode = 1;
