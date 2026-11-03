export const decode = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map((match) => [match[1].toLowerCase(), decode(match[3])]));
}

export function sitemapUrls(xml) {
  return [...xml.matchAll(/<url>\s*<loc>(.*?)<\/loc>/gs)].map((match) => decode(match[1].trim()));
}

function comparableUrl(value) {
  try {
    const url = new URL(value);
    return url.pathname === "/" && !url.search && !url.hash ? url.origin : url.href;
  } catch { return value; }
}

export function auditHtml(html, expectedCanonical) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const canonical = links.filter((item) => item.rel === "canonical");
  const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || "");
  const description = metas.find((item) => item.name === "description")?.content || "";
  const robots = metas.filter((item) => ["robots", "googlebot"].includes(item.name)).map((item) => item.content).join(", ");
  const h1s = [...html.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)];
  const schemas = [];
  const issues = [];
  for (const script of html.matchAll(/<script\b([^>]*)>(.*?)<\/script>/gs)) {
    if (attributes(script[1]).type !== "application/ld+json") continue;
    try { schemas.push(JSON.parse(script[2])); } catch { issues.push("JSON-LD inválido"); }
  }
  if (!title) issues.push("Título ausente");
  if (!description) issues.push("Descrição ausente");
  if (canonical.length !== 1 || comparableUrl(canonical[0].href) !== comparableUrl(expectedCanonical)) issues.push("Canonical incorreta ou duplicada");
  if (/\bnoindex\b/i.test(robots)) issues.push("Página do sitemap com noindex");
  if (h1s.length !== 1) issues.push(`Quantidade de H1: ${h1s.length}`);
  if (!schemas.length) issues.push("Dados estruturados ausentes");
  if (images.some((image) => image.src?.includes("/_next/image"))) issues.push("Dependência do otimizador de imagens bloqueado");
  if (images.some((image) => image.alt === undefined)) issues.push("Imagem sem atributo alt");
  return { title, description, canonical: canonical[0]?.href, robots, h1s: h1s.length, schemas: schemas.length, images: images.length, issues };
}
