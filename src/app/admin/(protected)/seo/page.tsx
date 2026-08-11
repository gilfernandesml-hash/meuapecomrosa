import { Save } from "lucide-react";
import { updateSeoSettings } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SeoPage({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const feedback = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("google_analytics_id,search_console_code,meta_pixel_id,google_maps_key").eq("id", 1).maybeSingle();

  return <>
    <p className="eyebrow">Visibilidade e integrações</p>
    <h1 className="display mt-2 text-5xl font-bold text-petroleo">SEO</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-grafite/60">Gerencie os identificadores de mensuração e validação utilizados pelo site.</p>
    {feedback.salvo ? <p className="mt-6 max-w-3xl rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Configurações de SEO salvas.</p> : null}
    {feedback.erro ? <p role="alert" className="mt-6 max-w-3xl rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível salvar os dados de SEO.</p> : null}
    <form action={updateSeoSettings} className="card mt-8 grid max-w-3xl gap-5 p-7 sm:grid-cols-2">
      <label className="label">Google Analytics<input className="field" name="google_analytics_id" defaultValue={data?.google_analytics_id ?? ""} placeholder="G-XXXXXXXXXX" /></label>
      <label className="label">Meta Pixel<input className="field" name="meta_pixel_id" defaultValue={data?.meta_pixel_id ?? ""} /></label>
      <label className="label sm:col-span-2">Código do Search Console<input className="field" name="search_console_code" defaultValue={data?.search_console_code ?? ""} /></label>
      <label className="label sm:col-span-2">Chave do Google Maps<input className="field" name="google_maps_key" defaultValue={data?.google_maps_key ?? ""} /></label>
      <button type="submit" className="btn btn-primary sm:col-span-2 sm:justify-self-end"><Save size={18} /> Salvar SEO</button>
    </form>
  </>;
}
