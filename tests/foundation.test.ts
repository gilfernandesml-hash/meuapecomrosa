import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { testDatabase } from "./database";
import { leadSchema, normalizePhone, safePath } from "../src/lib/leads/domain";
import { attributionFromUrl, nextIdentity, SESSION_IDLE_MS, eventSchema, eventDedupeKey } from "../src/lib/tracking/domain";
import { readPublicJson, signContext, verifyContext } from "../src/lib/leads/http";

let db: PGlite;
before(async () => { db = await testDatabase(); });
after(async () => { await db?.close(); });
async function session(analytics = true) {
  const visitor = randomUUID(), id = randomUUID();
  await db.query("select register_visitor_session($1,$2,$3,'mobile',$4,false)", [id,visitor,JSON.stringify({ landing_page: "/", utm_source: "instagram" }),analytics]);
  return { visitor, id };
}
async function capture(phone: string, s: Awaited<ReturnType<typeof session>>, extra = {}, request = randomUUID()) {
  const input = leadSchema.parse({ request_id: request, name: "Pessoa de teste", phone, consent: true, ...extra });
  const result = await db.query<{ result: { id: string; created: boolean; replayed: boolean } }>("select capture_lead($1,$2,$3,$4) as result", [JSON.stringify(input),request,s.visitor,s.id]);
  return result.rows[0].result;
}
test("normaliza telefone brasileiro e rejeita telefones inválidos", () => {
  for (const input of ["(11) 98765-4321", "+55 11 98765-4321", "005511987654321"]) assert.equal(normalizePhone(input),"5511987654321");
  assert.equal(normalizePhone("11 3456-7890"),"551134567890");
  for (const input of ["123", "11 11111-1111", "00 98765-4321", "11 87654-3210", "+1 415 1234567"]) assert.equal(normalizePhone(input),null);
});
test("e-mail é opcional, consentimento e perfil completo são obrigatórios", () => {
  const base = { request_id: randomUUID(), name: "Maria", phone: "11987654321", consent: true };
  assert.equal(leadSchema.parse({ ...base,email:"" }).email,undefined);
  assert.equal(leadSchema.safeParse({ ...base, consent:false }).success,false);
  assert.equal(leadSchema.safeParse({ ...base, source:"simulator" }).success,false);
  assert.equal(leadSchema.safeParse({ ...base,website:"spam" }).success,false);
});
test("UTM preserva primeira atribuição da sessão e remove query/referrer sensível", () => {
  const first = attributionFromUrl("https://example.test/imoveis?utm_source=instagram&utm_campaign=primeiro&email=secret", "https://social.test/feed?token=private");
  assert.equal(first.landing_page,"/imoveis"); assert.equal(first.referrer,"https://social.test");
  const ids = nextIdentity(null,null,"https://example.test/?utm_source=instagram","",1000,randomUUID);
  const next = nextIdentity(ids.visitor,ids.session,"https://example.test/contato?utm_source=other","",2000,randomUUID);
  assert.equal(next.session.attribution.utm_source,"instagram"); assert.equal(safePath("//evil.test/"),"/");
});
test("visitor permanece, sessão expira após 30 minutos sem atividade", () => {
  const first = nextIdentity(null,null,"https://example.test/","",1000,randomUUID);
  const next = nextIdentity(first.visitor,first.session,"https://example.test/contato?utm_source=new","",1000+SESSION_IDLE_MS,randomUUID);
  assert.equal(first.visitor.id,next.visitor.id); assert.notEqual(first.session.session_id,next.session.session_id);
  assert.equal(next.session.attribution.utm_source,"new");
});
test("contextos assinados rejeitam adulteração e expiração", () => {
  const token = signContext(randomUUID(),randomUUID(),"local-test-secret",1000);
  assert.ok(verifyContext(token,"local-test-secret",2000));
  assert.equal(verifyContext(token+"x","local-test-secret",2000),null);
  assert.equal(verifyContext(token,"wrong",2000),null);
  assert.equal(verifyContext(token,"local-test-secret",86_401_001),null);
});
test("API rejeita origem externa, payload excessivo e JSON inválido", async () => {
  const req = (body: string, origin = "https://example.test") => new Request("https://example.test/api/leads", { method:"POST",headers:{origin,"content-type":"application/json"},body });
  await assert.rejects(readPublicJson(req("{}","https://evil.test")), /Origem/);
  await assert.rejects(readPublicJson(req('"'+"x".repeat(500)+'"'),100), /grande/);
  await assert.rejects(readPublicJson(req("{")), /inválidos/);
  assert.deepEqual(await readPublicJson(new Request("http://localhost:3100/api/leads",{method:"POST",headers:{host:"127.0.0.1:3100",origin:"http://127.0.0.1:3100","content-type":"application/json"},body:"{}"})),{});
});
test("criação transacional gera lead e conversões uma vez; retry é idempotente", async () => {
  const s = await session(); const request = randomUUID();
  const first = await capture("11987654321",s,{},request);
  const retry = await capture("11987654321",s,{},request);
  assert.equal(first.created,true); assert.equal(retry.id,first.id); assert.equal(retry.replayed,true);
  const events = await db.query<{ event_name:string }>("select event_name from analytics_events where lead_id=$1",[first.id]);
  assert.deepEqual(events.rows.map(x=>x.event_name).sort(),["contact_form_completed","lead_created"]);
});
test("mesmo telefone enriquece, preserva contato/status/notas e guarda histórico", async () => {
  const s = await session();
  const first = await capture("11976543210",s,{ income_amount:4000,email:"first@example.test",attribution:{utm_source:"first"} });
  await db.query("update leads set status='qualified',notes='Preservar observação' where id=$1",[first.id]);
  const second = await capture("+55 (11) 97654-3210",s,{ income_amount:6000,email:"new@example.test",region:"Santo Amaro",attribution:{utm_source:"new"} });
  assert.equal(second.id,first.id); assert.equal(second.created,false);
  const {rows:[lead]} = await db.query<Record<string,unknown>>("select * from leads where id=$1",[first.id]);
  assert.equal(Number(lead.income_amount),6000); assert.equal(lead.email,"first@example.test");
  assert.equal(lead.status,"qualified"); assert.equal(lead.notes,"Preservar observação"); assert.equal(lead.utm_source,"first");
  const {rows:[interaction]} = await db.query<{previous_values:{income_amount:number}}>("select previous_values from lead_interactions where lead_id=$1 and not is_new",[first.id]);
  assert.equal(Number(interaction.previous_values.income_amount),4000);
  await capture("11976543210",s,{region:""});
  assert.equal((await db.query<{region:string}>("select region from leads where id=$1",[first.id])).rows[0].region,"Santo Amaro");
});
test("email não mescla telefones válidos distintos; reusa legado sem telefone válido", async () => {
  const s=await session();
  const a=await capture("21987654321",s,{email:"shared@example.test"});
  const b=await capture("31987654321",s,{email:"shared@example.test"}); assert.notEqual(a.id,b.id);
  const {rows:[legacy]}=await db.query<{id:string}>("insert into leads(name,phone,email,consent_at) values('Legado','sem telefone','legacy@example.test',now()) returning id");
  const c=await capture("41987654321",s,{email:"LEGACY@example.test"}); assert.equal(c.id,legacy.id);
});
test("fora da janela de 30 dias cria novo atendimento sem apagar o anterior", async () => {
  const s=await session(); const a=await capture("51987654321",s);
  await db.query("update leads set last_interaction_at=now()-interval '31 days' where id=$1",[a.id]);
  const b=await capture("51987654321",s); assert.notEqual(a.id,b.id);
});
test("limite é persistido no PostgreSQL, inclusive em chamadas concorrentes", async () => {
  const key=randomUUID();
  const attempts=await Promise.all(Array.from({length:6},()=>db.query<{allowed:boolean}>("select consume_public_rate_limit($1,3,600) as allowed",[key])));
  assert.equal(attempts.filter(x=>x.rows[0].allowed).length,3);
  await db.query("update request_rate_limits set expires_at=now()-interval '1 second' where key=$1",[key]);
  assert.equal((await db.query<{allowed:boolean}>("select consume_public_rate_limit($1,3,600) as allowed",[key])).rows[0].allowed,true);
});
test("RLS/grants bloqueiam anon e RPCs públicos, preservando leitura administrativa", async () => {
  for (const sql of ["select * from leads", "insert into leads(name,phone,consent_at) values('Spam','11987654321',now())", "select consume_public_rate_limit('attack',1,1)","select * from lead_interactions","select * from analytics_events"]) {
    await assert.rejects(db.transaction(async tx=>{await tx.exec("set local role anon");await tx.exec(sql);}), /permission denied/);
  }
  const user=randomUUID();
  await db.query("insert into auth.users(id) values($1)",[user]);
  await db.query("insert into profiles(id,full_name,email,role) values($1,'Admin teste','admin@example.test','admin')",[user]);
  await db.transaction(async tx=>{
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);await tx.exec("set local role authenticated");
    assert.ok((await tx.query("select id from leads")).rows.length>0);
  });
});
test("schema de eventos bloqueia dados pessoais e conversões forjadas", () => {
  const event={ event_id:randomUUID(),event_name:"page_view",tracking_token:"test",page_path:"/",metadata:{view_id:randomUUID()} };
  assert.equal(eventSchema.safeParse(event).success,true);
  assert.equal(eventSchema.safeParse({...event,metadata:{...event.metadata,email:"secret"}}).success,false);
  assert.equal(eventSchema.safeParse({...event,event_name:"lead_created"}).success,false);
  assert.equal(eventSchema.safeParse({...event,event_name:"property_view_30s",property_slug:"test"}).success,false);
});
test("deduplicação no banco e consentimento também protegem eventos", async () => {
  const s=await session(); const view=randomUUID(); const metadata={view_id:view};
  const args=()=>[randomUUID(),s.visitor,s.id,"page_view",null,"/",JSON.stringify(metadata),eventDedupeKey("page_view",metadata)];
  const sql="select record_behavior_event($1,$2,$3,$4,$5,$6,$7,$8) as recorded";
  assert.equal((await db.query<{recorded:boolean}>(sql,args())).rows[0].recorded,true);
  assert.equal((await db.query<{recorded:boolean}>(sql,args())).rows[0].recorded,false);
  await db.query("update visitor_sessions set analytics_consent=false where session_id=$1",[s.id]);
  const denied=args();denied[7]="another";
  assert.equal((await db.query<{recorded:boolean}>(sql,denied)).rows[0].recorded,false);
});

test("revisita exige navegação diferente e propriedade conta uma vez por sessão", async()=>{
  const s=await session(),property=randomUUID(),view=randomUUID();
  await db.query("insert into properties(id,code,name,slug) values($1,'TEST','Teste isolado',$2)",[property,property]);
  const record=async(name:"property_view"|"property_view_repeat",viewId:string)=>{
    const metadata={view_id:viewId};
    return (await db.query<{recorded:boolean}>("select record_behavior_event($1,$2,$3,$4,$5,'/imoveis/teste',$6,$7) as recorded",[randomUUID(),s.visitor,s.id,name,property,JSON.stringify(metadata),eventDedupeKey(name,metadata,property)])).rows[0].recorded;
  };
  assert.equal(await record("property_view_repeat",view),false);
  assert.equal(await record("property_view",view),true);
  assert.equal(await record("property_view_repeat",view),false);
  const revisited=randomUUID();
  assert.equal(await record("property_view",revisited),false);
  assert.equal(await record("property_view_repeat",revisited),true);
  assert.equal(await record("property_view_repeat",randomUUID()),false);
});

test("falha de sessão reverte lead e interação; usuário comum não lê contatos",async()=>{
  const invalid={visitor:randomUUID(),id:randomUUID()};
  await assert.rejects(capture("61987654321",invalid),/missing conversion session/);
  assert.equal((await db.query("select id from leads where phone_normalized='5561987654321'")).rows.length,0);
  const user=randomUUID();await db.query("insert into auth.users(id) values($1)",[user]);
  await db.transaction(async tx=>{
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);await tx.exec("set local role authenticated");
    assert.equal((await tx.query("select * from leads")).rows.length,0);
    assert.equal((await tx.query("select * from analytics_events")).rows.length,0);
  });
});
