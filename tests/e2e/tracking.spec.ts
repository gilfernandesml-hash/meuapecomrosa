import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("consentimento controla SDKs, eventos e revogação sem transmitir perfil",async({page,request})=>{
  await request.get("http://127.0.0.1:54329/__test/reset-limits");
  const scripts:string[]=[];
  await page.route(/https:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|www\.clarity\.ms)\//,async route=>{
    scripts.push(route.request().url());await route.fulfill({contentType:"application/javascript",body:"/* Isolated SDK fixture: no vendor request. */"});
  });
  await page.goto("/?utm_source=test&email=private@example.test");
  await expect(page.getByRole("button",{name:"Salvar escolhas"})).toBeVisible();
  expect(scripts).toEqual([]);
  await page.getByRole("checkbox",{name:"Estatísticas de navegação e melhoria do site"}).check();
  await page.getByRole("checkbox",{name:"Medição de anúncios"}).check();
  await page.getByRole("button",{name:"Salvar escolhas"}).click();
  await expect.poll(()=>scripts.length).toBe(3);
  await expect.poll(()=>page.evaluate(()=>window.dataLayer?.some(command=>Array.from(command as ArrayLike<unknown>)[0]==="event"))).toBeTruthy();
  const queues=await page.evaluate(()=>({ga:window.dataLayer,meta:window.fbq?.queue,clarity:window.clarity?.q}));
  expect(JSON.stringify(queues)).not.toContain("private@example.test");
  expect(JSON.stringify(queues)).toContain('"send_page_view":false');
  await page.getByRole("button",{name:"Preferências de privacidade",exact:true}).click();
  await page.getByRole("button",{name:"Só essenciais"}).click();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as Record<string,unknown>)["ga-disable-G-TEST12345"])).toBe(true);
  const stopped=await page.evaluate(()=>({meta:window.fbq?.queue,clarity:window.clarity?.q}));
  expect(stopped.meta?.at(-1)).toEqual(["consent","revoke"]);
  expect(stopped.clarity?.at(-1)).toEqual(["stop"]);
});

test("tempo ativo ignora aba oculta e revisita não duplica visualização",async({page,request})=>{
  await request.get("http://127.0.0.1:54329/__test/reset-limits");
  await page.route(/https:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|www\.clarity\.ms)\//,route=>route.fulfill({contentType:"application/javascript",body:"/* isolated */"}));
  await page.clock.install();
  await page.goto("/");
  const path=await page.locator('a[aria-label^="Ver detalhes de"]').first().getAttribute("href");
  await page.getByRole("checkbox",{name:"Estatísticas de navegação e melhoria do site"}).check();
  await page.getByRole("button",{name:"Salvar escolhas"}).click();
  await page.goto(path!);
  const session=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("rosa.session.v1")!).session_id as string);
  const events=async()=>((await(await request.get("http://127.0.0.1:54329/__test/state")).json()).events as {session_id:string;event_name:string}[]).filter(e=>e.session_id===session);
  await expect.poll(async()=>(await events()).filter(e=>e.event_name==="property_view").length).toBe(1);
  await page.evaluate(()=>{Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"hidden"});});
  await page.clock.runFor(32_000);
  expect((await events()).filter(e=>e.event_name==="property_view_30s")).toHaveLength(0);
  await page.evaluate(()=>{Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"visible"});});
  await page.bringToFront();await page.clock.runFor(31_000);
  await expect.poll(async()=>(await events()).filter(e=>e.event_name==="property_view_30s").length).toBe(1);
  await page.goto("/contato");await page.goto(path!);
  await expect.poll(async()=>(await events()).filter(e=>e.event_name==="property_view_repeat").length).toBe(1);
  expect((await events()).filter(e=>e.event_name==="property_view")).toHaveLength(1);
});

test("APIs aplicam origem, payload, token assinado e limite persistente",async({request})=>{
  await request.get("http://127.0.0.1:54329/__test/reset-limits");
  expect((await request.post("/api/leads",{headers:{origin:"https://other.test"},data:{}})).status()).toBe(403);
  const headers={origin:"http://127.0.0.1:3100"};
  expect((await request.post("/api/tracking/events",{headers,data:{event_id:randomUUID(),event_name:"page_view",tracking_token:"forged",page_path:"/",metadata:{view_id:randomUUID()}}})).status()).toBe(403);
  for(let i=0;i<10;i++)expect((await request.post("/api/leads",{headers,data:{name:""}})).status()).toBe(400);
  const limited=await request.post("/api/leads",{headers,data:{}});
  expect(limited.status()).toBe(429);expect(limited.headers()["retry-after"]).toBe("600");
});
