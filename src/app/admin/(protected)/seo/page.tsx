import { Save } from "lucide-react";
import { updateSeoSettings } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicProperties } from "@/lib/property-catalog";
import { neighborhoods } from "@/lib/neighborhoods";
import { site } from "@/lib/site";

export default async function SeoPage({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const feedback = await searchParams;
  const properties = await getPublicProperties();
  const checks = [
    { label: "Imóveis disponíveis", value: properties.length },
    { label: "Imóveis permitidos no sitemap", value: properties.filter((item) => item.indexable !== false).length },
    { label: "Guias de bairro", value: neighborhoods.length },
    { label: "Sem fotos", value: properties.filter((item) => !item.photos.length).length },
    { label: "Sem título de SEO próprio", value: properties.filter((item) => !item.seo_title).length },
    { label: "Sem descrição de SEO própria", value: properties.filter((item) => !item.seo_description).length },
  ];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("google_analytics_id,search_console_code,meta_pixel_id,google_maps_key").eq("id", 1).maybeSingle();

  return <>
    <p className="eyebrow">Visibilidade e integrações</p>
    <h1 className="display mt-2 text-5xl font-bold text-petroleo">SEO</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-grafite/60">Gerencie os identificadores de mensuração e validação utilizados pelo site.</p>
    {feedback.salvo ? <p className="mt-6 max-w-3xl rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Configurações de SEO salvas.</p> : null}
    {feedback.erro ? <p role="alert" className="mt-6 max-w-3xl rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível salvar os dados de SEO.</p> : null}
    <section className="mt-8 max-w-4xl"><h2 className="subtitle text-3xl text-petroleo">Saúde técnica do catálogo</h2><p className="mt-3 text-sm leading-7 text-grafite/65">Esta verificação mostra a preparação das páginas. Não representa posição no Google nem confirmação de indexação. O catálogo público é atualizado em até alguns minutos; alterações feitas no painel renovam seu cache.</p><div className="mt-5 grid gap-4 sm:grid-cols-3">{checks.map((check) => <div key={check.label} className="card p-5"><strong className="text-3xl text-petroleo">{check.value}</strong><p className="mt-2 text-sm text-grafite/65">{check.label}</p></div>)}</div><div className="mt-5 flex flex-wrap gap-5 text-sm font-bold text-rose"><a href="/sitemap.xml" target="_blank" rel="noreferrer">Abrir sitemap atualizado</a><a href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(`${site.url}/`)}`} target="_blank" rel="noreferrer">Ver resultados reais no Google</a></div></section>
    <form action={updateSeoSettings} className="card mt-8 grid max-w-3xl gap-5 p-7 sm:grid-cols-2">
      <label className="label">Google Analytics<input className="field" name="google_analytics_id" defaultValue={data?.google_analytics_id ?? ""} placeholder="G-XXXXXXXXXX" /></label>
      <label className="label">Meta Pixel<input className="field" name="meta_pixel_id" defaultValue={data?.meta_pixel_id ?? ""} /></label>
      <label className="label sm:col-span-2">Código do Search Console<input className="field" name="search_console_code" defaultValue={data?.search_console_code ?? ""} /></label>
      <label className="label sm:col-span-2">Chave do Google Maps<input className="field" name="google_maps_key" defaultValue={data?.google_maps_key ?? ""} /></label>
      <button type="submit" className="btn btn-primary sm:col-span-2 sm:justify-self-end"><Save size={18} /> Salvar SEO</button>
    </form>
  </>;
}
