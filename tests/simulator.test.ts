import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { emptyProfile, parseMoney, profilePayload, simulatorSteps, stepError, type BuyerProfile } from "../src/lib/leads/simulator";
import { propertyMessage, simulatorMessage, type PropertyContact } from "../src/lib/leads/whatsapp";
import { leadSchema, profileDisclaimer } from "../src/lib/leads/domain";
import { whatsappUrl, site } from "../src/lib/site";

const profile:BuyerProfile={...emptyProfile,income:"6.000,00",has_fgts:true,fgts_amount:"25.000",down_payment:"20.000",purchase_mode:"joint",bedrooms:"2",region:"Santo Amaro",name:"João Teste",phone:"11987654321",consent:true};
const property:PropertyContact={name:"Imóvel de teste",code:"TEST-1",slug:"imovel-teste",price:300000,bedrooms_min:2,bedrooms_max:2,property_type:"apartment"};
test("campos monetários brasileiros, zero e formatos inválidos",()=>{
  assert.equal(parseMoney("R$ 6.000,50"),6000.5);assert.equal(parseMoney("6000.50"),6000.5);assert.equal(parseMoney("25.000"),25000);assert.equal(parseMoney("0"),0);
  for(const value of ["","-1","abc","1e6","1.23.45","1,123","100000001"])assert.equal(parseMoney(value),undefined);
});
test("simulador pula FGTS, preserva volta e exige dados reais da região",()=>{
  assert.equal(simulatorSteps(profile).length,8);assert.equal(simulatorSteps({...profile,has_fgts:false}).length,7);
  assert.ok(!simulatorSteps({...profile,has_fgts:false}).includes("fgts_amount"));
  for(const step of simulatorSteps(profile))assert.equal(stepError(step,profile,["Santo Amaro"]),null);
  assert.ok(stepError("region",profile,["Campo Limpo"]));assert.ok(stepError("income",{...profile,income:"0"},[]));
  assert.ok(stepError("contact",{...profile,consent:false},[]));
});
test("perfil estruturado passa pela mesma validação da API; FGTS não deixa saldo antigo",()=>{
  const payload={...profilePayload(profile),request_id:randomUUID(),simulator_id:randomUUID()};
  assert.equal(leadSchema.parse(payload).income_amount,6000);
  assert.equal(profilePayload({...profile,has_fgts:false}).fgts_amount,0);
  assert.equal(payload.email,undefined);assert.equal(payload.purchase_mode,"joint");
});
test("WhatsApp reutiliza telefone/link e resumo não promete crédito",()=>{
  const text=simulatorMessage(profile,property,"/imoveis/imovel-teste");
  for(const fragment of ["João Teste","6.000,00","25.000,00","20.000,00","composição de renda","2 dormitórios","Santo Amaro","TEST-1"])assert.ok(text.includes(fragment));
  assert.ok(!text.includes("undefined"));assert.ok(!text.includes("crédito aprovado"));
  const url=new URL(whatsappUrl(text));assert.equal(url.pathname,`/${site.whatsapp}`);assert.equal(url.searchParams.get("text"),text);
  assert.ok(profileDisclaimer.includes("dependem das regras vigentes"));
});
test("WhatsApp por imóvel inclui código/URL e omite dados ausentes",()=>{
  assert.ok(propertyMessage(property).includes("300.000,00"));assert.ok(propertyMessage(property).includes(`${site.url}/imoveis/imovel-teste`));
  const missing=propertyMessage({...property,price:null,bedrooms_min:null,bedrooms_max:null});
  assert.ok(!missing.includes("Preço anunciado"));assert.ok(!missing.includes("Tipologia"));assert.ok(!missing.includes("null"));
  const noFgts=simulatorMessage({...profile,has_fgts:false});assert.ok(noFgts.includes("FGTS: Não"));assert.ok(!noFgts.includes("FGTS aproximado"));
});
