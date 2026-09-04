import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { testDatabase } from "./database";

// Test-only HTTP adapter over real, isolated PostgreSQL. Never reads .env.local.
async function main() {
const db=await testDatabase();
// IDs are local fixtures; browser tests intercept the SDKs and send no vendor traffic.
await db.exec("update site_settings set google_analytics_id='G-TEST12345',meta_pixel_id='123456789012345' where id=1");
const adminId=randomUUID();
const user={id:adminId,aud:"authenticated",role:"authenticated",email:"admin@example.test",email_confirmed_at:new Date().toISOString(),app_metadata:{provider:"email"},user_metadata:{},created_at:new Date().toISOString()};
const encoded=(v:unknown)=>Buffer.from(JSON.stringify(v)).toString("base64url");
const tokenBody=`${encoded({alg:"HS256",typ:"JWT"})}.${encoded({sub:adminId,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+86400})}`;
const accessToken=`${tokenBody}.${createHmac("sha256","local-auth-fixture").update(tokenBody).digest("base64url")}`;
await db.query("insert into auth.users(id) values($1)",[adminId]);
await db.query("insert into profiles(id,full_name,email,role) values($1,'Admin de teste','admin@example.test','admin')",[adminId]);
const catalog=JSON.parse(await readFile("src/data/orulo-plano-plano-zona-sul.json","utf8"));
for(const item of catalog.properties){
  const id=randomUUID();
  await db.query(`insert into properties(id,code,name,slug,description,neighborhood,city,state,source_id,source,status,price,price_label,bedrooms_min,bedrooms_max,area_min,area_max,phase,is_mcmv,property_type,developer)
    values($1,$2,$3,$4,$5,$6,'São Paulo','SP',$7,'orulo','available',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [id,item.code,item.name,item.slug,item.description,item.neighborhood,item.external_id,item.price,item.price_label,item.bedrooms_min,item.bedrooms_max,item.area_min,item.area_max,item.phase,item.mcmv,item.property_type,item.developer]);
  for(const [index,url] of item.photos.slice(0,5).entries())await db.query("insert into property_images(property_id,storage_path,public_url,alt_text,is_cover,sort_order) values($1,$2,$2,'Foto', $3,$4)",[id,url,index===0,index]);
  for(const [index,url] of item.floorplans.slice(0,2).entries())await db.query("insert into property_floorplans(property_id,storage_path,public_url,alt_text,sort_order) values($1,$2,$2,'Planta',$3)",[id,url,index]);
}
const tableNames=new Set(["properties","property_images","property_floorplans","property_features","site_settings","profiles","leads","visitor_sessions"]);
const rpcNames=new Set(["register_visitor_session","consume_public_rate_limit","capture_lead","record_behavior_event"]);
const server=createServer(async(req,res)=>{
  const url=new URL(req.url??"/","http://127.0.0.1:54329");
  const reply=(status:number,data:unknown)=>{res.statusCode=status;res.setHeader("content-type","application/json");res.end(req.method==="HEAD"?undefined:JSON.stringify(data));};
  try{
    if(url.pathname==="/__test/state"){
      const leads=(await db.query("select * from leads order by created_at desc")).rows;
      const events=(await db.query("select * from analytics_events order by created_at")).rows;
      const sessions=(await db.query("select * from visitor_sessions")).rows;
      return reply(200,{leads,events,sessions});
    }
    if(url.pathname==="/__test/reset-limits"){
      await db.exec("update request_rate_limits set expires_at=now()-interval '1 second'");return reply(200,{ok:true});
    }
    const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));
    const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
    if(url.pathname==="/auth/v1/token"){
      if(body.email!=="admin@example.test"||body.password!=="local-admin-fixture")return reply(400,{error:"invalid_credentials"});
      return reply(200,{access_token:accessToken,refresh_token:"local-refresh-fixture",token_type:"bearer",expires_in:86400,expires_at:Math.floor(Date.now()/1000)+86400,user});
    }
    if(url.pathname==="/auth/v1/user")return req.headers.authorization===`Bearer ${accessToken}`?reply(200,user):reply(401,{message:"unauthorized"});
    if(url.pathname==="/auth/v1/logout")return reply(200,{});
    const role=req.headers.authorization==="Bearer local-service-fixture"?"service_role":req.headers.authorization===`Bearer ${accessToken}`?"authenticated":"anon";
    if(url.pathname.startsWith("/rest/v1/rpc/")){
      const name=url.pathname.split("/").pop()!;
      if(!rpcNames.has(name))return reply(404,{});
      const entries=Object.entries(body);if(entries.some(([key])=>!/^p_[a-z_]+$/.test(key)))return reply(400,{});
      const result=await db.transaction(async tx=>{
        await tx.exec(`set local role ${role}`);
        return tx.query<{data:unknown}>(`select public.${name}(${entries.map(([key],i)=>`${key} => $${i+1}`).join(",")}) as data`,entries.map(([,value])=>value!==null && typeof value==="object"?JSON.stringify(value):value));
      });return reply(200,result.rows[0].data);
    }
    const table=url.pathname.split("/").pop()!;if(!tableNames.has(table)||!["GET","HEAD"].includes(req.method??""))return reply(404,{});
    const values:unknown[]=[];const filters:string[]=[];
    for(const [key,value] of url.searchParams){
      if(!/^[a-z_]+$/.test(key)||!value.startsWith("eq."))continue;
      values.push(value.slice(3));filters.push(`"${key}"=$${values.length}`);
    }
    const where=filters.length?` where ${filters.join(" and ")}`:"";
    const ordering=(url.searchParams.get("order")??"").split(",").filter(x=>/^[a-z_]+\.(asc|desc)$/.test(x)).map(x=>x.replace("."," ")).join(",");
    const offset=Math.max(0,Number(url.searchParams.get("offset"))||0),limit=Math.min(1000,Number(url.searchParams.get("limit"))||1000);
    const result=await db.transaction(async tx=>{
      if(role==="authenticated")await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[adminId]);
      await tx.exec(`set local role ${role}`);
      const count=(await tx.query<{count:number}>(`select count(*)::int as count from public.${table}${where}`,values)).rows[0].count;
      const rows=(await tx.query<Record<string,unknown>>(`select * from public.${table}${where}${ordering?` order by ${ordering}`:""} offset ${offset} limit ${limit}`,values)).rows;
      for(const row of rows){
        if(table==="properties")for(const related of ["property_images","property_floorplans","property_features"])row[related]=(await tx.query(`select * from public.${related} where property_id=$1`,[row.id])).rows;
        if(table==="leads")row.properties=row.property_id?(await tx.query("select name,code from public.properties where id=$1",[row.property_id])).rows[0]:null;
      }return {rows,count};
    });
    res.setHeader("content-range",`${offset}-${offset+result.rows.length-1}/${result.count}`);
    return reply(200,req.headers.accept?.includes("vnd.pgrst.object")?(result.rows[0]??null):result.rows);
  }catch(error){reply(400,{message:error instanceof Error?error.message:"test error",code:"TEST_ERROR"});}
});
await new Promise<void>(resolve=>server.listen(54329,"127.0.0.1",resolve));
const child=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--port","3100","--hostname","127.0.0.1"],{stdio:"inherit",env:{...process.env,
  NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:54329",NEXT_PUBLIC_SUPABASE_ANON_KEY:"local-anon-fixture",SUPABASE_SERVICE_ROLE_KEY:"local-service-fixture",
  NEXT_PUBLIC_MICROSOFT_CLARITY_ID:"testclarity123",VERCEL:"",VERCEL_ENV:"development",NEXT_TELEMETRY_DISABLED:"1",ROSA_E2E:"1"}});
for(const signal of ["SIGINT","SIGTERM"] as const)process.on(signal,()=>{child.kill();server.close();void db.close();});
child.on("exit",()=>{server.close();void db.close();});
}

void main().catch(error => { console.error(error); process.exitCode=1; });
