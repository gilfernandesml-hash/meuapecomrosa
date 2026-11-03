import test from "node:test";
import assert from "node:assert/strict";
import { auditHtml, sitemapUrls } from "./seo-audit-utils.mjs";

const canonical = "https://meuapecomrosa.com.br/bairros/campo-belo";
const valid = `<title>Imóveis em Campo Belo</title><meta name="description" content="Compare imóveis"><link rel="canonical" href="${canonical}"><meta name="robots" content="index, follow"><h1>Campo Belo</h1><script type="application/ld+json">{"@type":"CollectionPage","name":"\\u003cconteúdo"}</script><img src="https://static.orulo.com.br/foto.jpg" alt="Foto do imóvel">`;

test("aceita página canônica com imagem direta e JSON-LD escapado", () => assert.deepEqual(auditHtml(valid, canonical).issues, []));
test("aceita a URL raiz canônica com ou sem barra final", () => {
  const root = valid.replaceAll(canonical, "https://meuapecomrosa.com.br");
  assert.deepEqual(auditHtml(root, "https://meuapecomrosa.com.br/").issues, []);
});
test("detecta canonical incorreta, noindex e otimizador bloqueado", () => {
  const issues = auditHtml(valid.replace(canonical, "https://meuapecomrosa.com.br/").replace("index, follow", "noindex, follow").replace("https://static.orulo.com.br/foto.jpg", "/_next/image?url=foto"), canonical).issues;
  assert.equal(issues.length, 3);
});
test("detecta dados estruturados inválidos e H1 duplicado", () => {
  const result = auditHtml(valid.replace('"@type":"CollectionPage"', '"@type":INVALID') + "<h1>Outro</h1>", canonical);
  assert.ok(result.issues.includes("JSON-LD inválido"));
  assert.ok(result.issues.includes("Quantidade de H1: 2"));
});
test("lê somente URLs de páginas, não imagens do sitemap", () => assert.deepEqual(sitemapUrls('<urlset><url><loc>https://meuapecomrosa.com.br/</loc><image:image><image:loc>https://static.orulo.com.br/foto.jpg</image:loc></image:image></url></urlset>'), ["https://meuapecomrosa.com.br/"]));
