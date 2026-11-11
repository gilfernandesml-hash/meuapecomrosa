import test from "node:test";
import assert from "node:assert/strict";
import { buildLeadNotification } from "../src/lib/leads/notification-content";

test("notificação de lead inclui dados úteis e link direto para WhatsApp", () => {
  const result = buildLeadNotification({
    name: "Cliente Teste",
    phone: "+55 (11) 91234-5678",
    email: "cliente@example.com",
    source: "simulator",
    pagePath: "/contato",
    propertyName: "Residencial Exemplo",
    propertyCode: "REF-123",
    incomeAmount: 5_000,
    hasFgts: true,
    bedrooms: "2",
    purchaseMode: "joint",
  });

  assert.equal(result.whatsappUrl, "https://wa.me/5511912345678");
  assert.match(result.subject, /Residencial Exemplo/);
  assert.match(result.html, /Simulador de perfil/);
  assert.match(result.html, /R\$\s*5\.000,00/);
  assert.match(result.html, /Composição de renda/);
});

test("notificação escapa conteúdo informado pelo visitante", () => {
  const result = buildLeadNotification({
    name: "<script>alert('x')</script>",
    phone: "11912345678",
    region: "<b>Centro</b>",
  });

  assert.doesNotMatch(result.html, /<script>/);
  assert.doesNotMatch(result.html, /<b>Centro<\/b>/);
  assert.match(result.html, /&lt;script&gt;/);
  assert.match(result.html, /&lt;b&gt;Centro&lt;\/b&gt;/);
});
