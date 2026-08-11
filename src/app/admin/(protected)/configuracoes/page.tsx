import { Save } from "lucide-react";
import { updateSiteSettings } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const feedback = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const regions = Array.isArray(data?.service_regions) ? data.service_regions.join(", ") : site.serviceArea;

  return <>
    <p className="eyebrow">Identidade e contato</p>
    <h1 className="display mt-2 text-5xl font-bold text-petroleo">Configurações</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-grafite/60">Atualize os dados institucionais usados pelo painel e pelas integrações do site.</p>
    {feedback.salvo ? <p className="mt-6 max-w-4xl rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Configurações salvas com sucesso.</p> : null}
    {feedback.erro ? <p role="alert" className="mt-6 max-w-4xl rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível salvar as configurações.</p> : null}
    <form action={updateSiteSettings} className="card mt-8 grid max-w-4xl gap-5 p-7 sm:grid-cols-2">
      <label className="label">Nome do site<input className="field" name="site_name" defaultValue={data?.site_name ?? site.name} required /></label>
      <label className="label">Slogan<input className="field" name="slogan" defaultValue={data?.slogan ?? site.slogan} /></label>
      <label className="label">CRECI<input className="field" name="creci" defaultValue={data?.creci ?? site.creci} /></label>
      <label className="label">WhatsApp (somente números)<input className="field" name="whatsapp" defaultValue={data?.whatsapp ?? site.whatsapp} /></label>
      <label className="label">Telefone exibido<input className="field" name="phone" defaultValue={data?.phone ?? site.phoneDisplay} /></label>
      <label className="label">E-mail<input className="field" type="email" name="email" defaultValue={data?.email ?? site.email} required /></label>
      <label className="label">Instagram<input className="field" name="instagram" defaultValue={data?.instagram ?? site.instagram} /></label>
      <label className="label">Facebook<input className="field" name="facebook" defaultValue={data?.facebook ?? ""} /></label>
      <label className="label sm:col-span-2">Regiões de atendimento<input className="field" name="service_regions" defaultValue={regions} placeholder="Separe por vírgulas" /></label>
      <label className="label">Endereço de atendimento<input className="field" name="address" defaultValue={data?.address ?? site.location} /></label>
      <label className="label">Horário de atendimento<input className="field" name="business_hours" defaultValue={data?.business_hours ?? site.serviceHours} /></label>
      <label className="label sm:col-span-2">Biografia<textarea className="field min-h-32" name="biography" defaultValue={data?.biography ?? ""} /></label>
      <button type="submit" className="btn btn-primary sm:col-span-2 sm:justify-self-end"><Save size={18} /> Salvar configurações</button>
    </form>
  </>;
}
