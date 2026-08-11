import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProperty } from "../../actions";

const phases = ["Lançamento", "Em construção", "Pronto"];
const statuses = [
  ["available", "Disponível"],
  ["draft", "Rascunho"],
  ["reserved", "Reservado"],
  ["sold", "Vendido"],
  ["inactive", "Inativo"],
];

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  const [{ id }, feedback] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const { data: property, error } = await supabase
    .from("properties")
    .select("id,code,name,slug,neighborhood,phase,price,price_label,status,is_mcmv,is_his2,is_hmp,is_r2v,is_nr")
    .eq("id", id)
    .maybeSingle();

  if (error || !property) notFound();

  return <>
    <Link href="/admin/imoveis" className="inline-flex items-center gap-2 text-sm font-bold text-petroleo hover:text-rose"><ArrowLeft size={17} /> Voltar para imóveis</Link>
    <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">Edição do imóvel</p>
        <h1 className="display mt-2 text-4xl font-bold text-petroleo sm:text-5xl">{property.name}</h1>
        <p className="mt-2 text-sm text-grafite/60">{property.code}</p>
      </div>
      <Link href={`/imoveis/${property.slug}`} target="_blank" className="btn btn-secondary"><ExternalLink size={17} /> Ver no site</Link>
    </div>

    {feedback.salvo ? <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Alterações salvas e atualizadas no site.</p> : null}
    {feedback.erro ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível salvar. Confira os dados e tente novamente.</p> : null}

    <form action={updateProperty} className="card mt-6 grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
      <input type="hidden" name="property_id" value={property.id} />
      <label className="label sm:col-span-2">Nome do empreendimento<input className="field" name="name" defaultValue={property.name} required /></label>
      <label className="label">Bairro<input className="field" name="neighborhood" defaultValue={property.neighborhood ?? ""} /></label>
      <label className="label">Fase<select className="field" name="phase" defaultValue={property.phase ?? ""}><option value="">Não informado</option>{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></label>
      <label className="label">Valor numérico<input className="field" name="price" type="number" min="0" step="1" defaultValue={property.price ?? ""} placeholder="Ex.: 320000" /></label>
      <label className="label">Texto do valor<input className="field" name="price_label" defaultValue={property.price_label ?? ""} placeholder="Ex.: A partir de R$ 320.000" /></label>
      <label className="label">Status<select className="field" name="status" defaultValue={property.status}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="flex items-center gap-2 self-end rounded-2xl border border-petroleo/10 bg-creme/60 px-4 py-3 text-sm font-bold text-petroleo"><input type="checkbox" name="is_mcmv" defaultChecked={property.is_mcmv} className="size-4 accent-petroleo" /> Minha Casa Minha Vida</label>

      <fieldset className="sm:col-span-2">
        <legend className="label">Classificação habitacional</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {[["is_r2v", "R2V", property.is_r2v], ["is_his2", "HIS 2", property.is_his2], ["is_hmp", "HMP", property.is_hmp], ["is_nr", "NR", property.is_nr]].map(([name, label, checked]) => <label key={String(name)} className="flex items-center gap-2 rounded-2xl border border-petroleo/10 bg-white px-4 py-3 text-sm font-bold text-petroleo"><input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="size-4 accent-petroleo" /> {String(label)}</label>)}
        </div>
        <p className="mt-3 text-xs leading-5 text-grafite/55">As classificações marcadas aparecerão ao lado da fase do imóvel nos cards e na página de detalhes.</p>
      </fieldset>

      <div className="flex justify-end sm:col-span-2">
        <button type="submit" className="btn btn-primary"><Save size={18} /> Salvar alterações</button>
      </div>
    </form>
  </>;
}
