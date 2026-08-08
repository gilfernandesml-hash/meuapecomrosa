import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { site } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let maintenance = false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase.from("site_settings").select("maintenance_mode").eq("id", 1).maybeSingle();
    maintenance = Boolean(data?.maintenance_mode);
  }
  return { rules: maintenance ? [{ userAgent: "*", disallow: "/" }] : [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }], sitemap: `${site.url}/sitemap.xml`, host: site.url };
}
