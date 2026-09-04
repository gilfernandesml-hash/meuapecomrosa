import test from "node:test";
import assert from "node:assert/strict";
import { analyticsIds, externalPayload } from "../src/lib/tracking/integrations";

test("integrações ficam desativadas sem IDs e rejeitam valores inválidos",()=>{
  assert.deepEqual(analyticsIds(),{ga4:"",meta:"",clarity:""});
  assert.deepEqual(analyticsIds('<script>','abc','../tag'),{ga4:"",meta:"",clarity:""});
  assert.deepEqual(analyticsIds('G-TEST12345','123456789012345','testclarity123'),{ga4:'G-TEST12345',meta:'123456789012345',clarity:'testclarity123'});
});
test("payload externo é uma allowlist sem respostas, campanha livre ou query",()=>{
  const payload=externalPayload({name:"simulator_completed",page_path:"/simular?email=private@example.test#personal",property_id:"property-id"},"https://example.test");
  assert.deepEqual(payload,{page_location:"https://example.test/simular",page_referrer:"",item_id:"property-id"});
  assert.equal(externalPayload({name:"page_view",page_path:"https://evil.test"},"https://example.test").page_location,"https://example.test/");
});
