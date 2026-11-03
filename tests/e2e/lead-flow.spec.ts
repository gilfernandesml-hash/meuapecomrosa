import { test, expect, type Page } from "@playwright/test";

async function dismissCookies(page:Page){const button=page.getByRole("button",{name:"Só essenciais"});if(await button.isVisible())await button.click();}
async function finishProfile(page:Page,name:string,phone:string,fgts:boolean){
  await page.getByRole("button",{name:"Simular meu primeiro apê"}).click();
  await page.getByRole("textbox",{name:"Qual é sua renda familiar mensal aproximada?"}).fill("6.000");await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await page.getByRole("radio",{name:fgts?"Sim":"Não",exact:true}).check();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  if(fgts){await page.getByRole("textbox",{name:"Quanto você possui aproximadamente de FGTS?"}).fill("25.000");await page.getByRole("button",{name:"Continuar",exact:true}).click();}
  await page.getByRole("textbox",{name:"Quanto você tem disponível para entrada?"}).fill("20.000");await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await page.getByRole("radio",{name:"Compondo renda"}).check();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await page.getByRole("radio",{name:"2 dormitórios",exact:true}).check();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await page.getByRole("combobox",{name:"Região desejada",exact:true}).selectOption({label:"Santo Amaro"});await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await page.getByRole("textbox",{name:"Nome",exact:true}).fill(name);await page.getByRole("textbox",{name:"WhatsApp com DDD"}).fill(phone);
  await page.locator('[data-clarity-mask="true"]').screenshot({path:`test-results/simulator-contact-${page.viewportSize()!.width}.png`});
  await page.getByRole("checkbox",{name:/Autorizo a Rosa/}).check();await page.getByRole("button",{name:"Concluir meu perfil"}).click();
  await expect(page.getByRole("heading",{name:"Seu perfil foi recebido."})).toBeVisible({timeout:25_000});
}
for(const width of [360,390,430,1366]){
  test(`perfil completo, UTM, WhatsApp e admin em ${width}px`,async({page,request})=>{
    await request.get("http://127.0.0.1:54329/__test/reset-limits");
    await page.setViewportSize({width,height:900});
    const forbidden:string[]=[];page.on("request",r=>{if(/google-analytics|googletagmanager|connect.facebook|clarity\.ms/.test(r.url()))forbidden.push(r.url());});
    await page.goto(`/?utm_source=instagram&utm_campaign=mobile-${width}`);await dismissCookies(page);
    await expect(page.getByRole("heading",{level:1})).toBeVisible();
    await page.screenshot({path:`test-results/home-${width}.png`});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    const detail=page.locator('a[aria-label^="Ver detalhes de"]').first();const path=await detail.getAttribute("href");
    await page.goto(path!);await expect(page.getByRole("heading",{level:1})).toBeVisible();
    await page.screenshot({path:`test-results/property-${width}.png`});
    const propertyWhatsApp=page.getByRole("link",{name:"Falar com Rosa",exact:true});
    expect(new URL((await propertyWhatsApp.getAttribute("href"))!).searchParams.get("text")).toContain("Código:");
    await page.getByRole("link",{name:"Descubra o que você pode comprar"}).click();
    await finishProfile(page,`Perfil ${width}`,`1198765${String(width).padStart(4,"0")}`,width!==390);
    await page.locator('[data-clarity-mask="true"]').screenshot({path:`test-results/simulator-success-${width}.png`});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    const popupUrl=await page.evaluate(()=>{let url="";window.open=((value?:string|URL)=>{url=String(value);(window as unknown as {testWhatsApp:string}).testWhatsApp=url;return null;}) as typeof window.open;return url;});
    expect(popupUrl).toBe("");await page.getByRole("button",{name:"Receber minhas opções no WhatsApp"}).click();
    const opened=await page.evaluate(()=>(window as unknown as {testWhatsApp:string}).testWhatsApp);
    expect(new URL(opened).hostname).toBe("wa.me");expect(new URL(opened).searchParams.get("text")).toContain(`Perfil ${width}`);
    await expect.poll(async()=>{const s=await(await request.get("http://127.0.0.1:54329/__test/state")).json();return s.events.some((e:{event_name:string;lead_id:string})=>e.event_name==="whatsapp_click"&&e.lead_id===s.leads.find((l:{name:string})=>l.name===`Perfil ${width}`).id);}).toBeTruthy();
    const state=await(await request.get("http://127.0.0.1:54329/__test/state")).json();const lead=state.leads.find((l:{name:string})=>l.name===`Perfil ${width}`);
    expect(lead.utm_campaign).toBe(`mobile-${width}`);expect(Number(lead.income_amount)).toBe(6000);expect(lead.bedrooms).toBe("2");expect(lead.email).toBeNull();
    expect(state.events.some((e:{event_name:string;lead_id:string})=>e.event_name==="simulator_completed"&&e.lead_id===lead.id)).toBeTruthy();
    expect(forbidden).toEqual([]);
    await page.goto("/admin/login");await page.getByLabel("E-mail",{exact:true}).fill("admin@example.test");await page.getByLabel("Senha",{exact:true}).fill("local-admin-fixture");await page.getByRole("button",{name:"Entrar",exact:true}).click();
    await page.waitForURL("**/admin");await page.goto("/admin/leads");await expect(page.getByRole("heading",{name:`Perfil ${width}`,exact:true})).toBeVisible();
    await page.screenshot({path:`test-results/admin-${width}.png`,fullPage:true});
  });
}
test("formulário aceita email vazio, evita duplicação e mantém sucesso honesto",async({page,request})=>{
  await request.get("http://127.0.0.1:54329/__test/reset-limits");
  await page.goto("/contato?utm_source=contact-test");await dismissCookies(page);
  for(let i=0;i<2;i++){
    await page.getByLabel("Nome completo").fill("Contato repetido");await page.getByLabel("WhatsApp",{exact:true}).fill("21987654321");
    await page.getByRole("checkbox",{name:/Autorizo o contato/}).check();
    const saved=page.waitForResponse(r=>r.url().endsWith("/api/leads")&&r.request().method()==="POST");
    await page.getByRole("button",{name:"Quero receber minhas opções"}).click();expect((await saved).status()).toBe(200);
    await expect(page.getByRole("status")).toContainText("Recebemos seus dados");
  }
  const state=await(await request.get("http://127.0.0.1:54329/__test/state")).json();expect(state.leads.filter((l:{phone:string})=>l.phone==="5521987654321")).toHaveLength(1);
  await page.route("**/api/leads",route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"Indisponível para teste"})}));
  await page.getByLabel("Nome completo").fill("Falha de teste");await page.getByLabel("WhatsApp",{exact:true}).fill("31987654321");await page.getByRole("checkbox",{name:/Autorizo o contato/}).check();await page.getByRole("button",{name:"Quero receber minhas opções"}).click();
  await expect(page.getByRole("alert").filter({hasText:"Indisponível para teste"})).toContainText("Indisponível para teste");expect(await page.getByLabel("Nome completo").inputValue()).toBe("Falha de teste");
});
