import "server-only";
import { createClient } from "@supabase/supabase-js";
import { analyticsIds } from "@/lib/tracking/integrations";
import { AnalyticsScripts } from "@/components/analytics-scripts";

export async function PublicAnalytics() {
  let ga4:string|null=null,meta:string|null=null;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(url && key) {
    try {
      const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,next:{revalidate:300,tags:["public-analytics-settings"]},signal:AbortSignal.timeout(3000)})}});
      const {data}=await client.from("site_settings").select("google_analytics_id,meta_pixel_id").eq("id",1).maybeSingle();
      ga4=data?.google_analytics_id??null;meta=data?.meta_pixel_id??null;
    }catch{ /* Optional integration must never block a page. */ }
  }
  return <AnalyticsScripts ids={analyticsIds(ga4,meta,process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID)}/>;
}
