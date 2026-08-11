import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePropertyClassifications } from "./actions";

const statusLabels: Record<string, string> = {
  available: "Disponível",
  draft: "Rascunho",
  reserved: "Reservado",
  sold: "Vendido",
  inactive: "Inativo",
};

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  const feedback = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [propertiesResult, coversResult] = await Promise.all([
    supabase.from("properties").select("id,code,name,slug,neighborhood,phase,price,price_label,status,is_his2,is_hmp,is_r2v,is_nr").order("name"),
    supabase.from("property_images").select("property_id,public_url").eq("is_cover", true),
  ]);
  const error = propertiesResult.error ?? coversResult.error;
  const coverByProperty = new Map((coversResult.data ?? []).map((image) => [image.property_id, image.public_url]));
  const properties = propertiesResult.data ?? [];

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">Catálogo</p>
        <h1 className="display mt-2 text-5xl font-bold text-petroleo">Imóveis</h1>
        <p className="mt-2 text-sm text-grafite/60">{properties.length} imóveis cadastrados</p>
      </div>
      <Link className="btn btn-primary" href="/admin/imoveis/novo"><Plus size={18} /> Novo imóvel</Link>
    </div>
    <div className="card mt-8 p-5">
      {feedback.salvo === "classificacao" ? <p className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Classificação atualizada com sucesso.</p> : null}
      {feedback.erro ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível salvar a classificação. Tente novamente.</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar o catálogo: {error.message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-petroleo/10 text-xs uppercase text-grafite/45">
            <tr>{["Foto", "Código", "Nome", "Bairro", "Classificação", "Fase", "Valor", "Status", "Ações"].map((heading) => <th key={heading} className="px-3 py-4">{heading}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-petroleo/10">
            {properties.map((property) => {
              const cover = coverByProperty.get(property.id);
              const classifications = [[property.is_r2v, "R2V"], [property.is_his2, "HIS 2"], [property.is_hmp, "HMP"], [property.is_nr, "NR"]].filter(([enabled]) => enabled).map(([, label]) => label);
              return <tr key={property.id}>
                <td className="px-3 py-3">{cover ? <Image className="h-14 w-20 rounded-lg object-cover" src={cover} alt={`Foto de ${property.name}`} width={80} height={56} /> : <div className="h-14 w-20 rounded-lg bg-creme" />}</td>
                <td className="px-3 py-3 text-xs font-semibold text-grafite/60">{property.code}</td>
                <td className="px-3 py-3 font-semibold text-petroleo">{property.name}</td>
                <td className="px-3 py-3">{property.neighborhood ?? "—"}</td>
                <td className="min-w-64 px-3 py-3 text-xs font-semibold text-petroleo">
                  <form action={updatePropertyClassifications} className="grid gap-2">
                    <input type="hidden" name="property_id" value={property.id} />
                    <div className="flex flex-wrap gap-x-3 gap-y-2">
                      {[["is_r2v", "R2V", property.is_r2v], ["is_his2", "HIS 2", property.is_his2], ["is_hmp", "HMP", property.is_hmp], ["is_nr", "NR", property.is_nr]].map(([name, label, checked]) => (
                        <label key={String(name)} className="flex items-center gap-1.5 whitespace-nowrap">
                          <input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="accent-petroleo" />
                          {String(label)}
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" className="rounded-lg bg-petroleo px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose">Salvar</button>
                      {!classifications.length ? <span className="text-[11px] text-grafite/50">A confirmar</span> : null}
                    </div>
                  </form>
                </td>
                <td className="px-3 py-3">{property.phase ?? "—"}</td>
                <td className="px-3 py-3">{property.price_label ?? (property.price ? Number(property.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Consulte")}</td>
                <td className="px-3 py-3"><span className="rounded-full bg-creme px-3 py-1 text-xs font-semibold text-petroleo">{statusLabels[property.status] ?? property.status}</span></td>
                <td className="px-3 py-3"><div className="flex flex-col items-start gap-2"><Link className="inline-flex items-center gap-1 rounded-lg bg-petroleo px-3 py-2 text-xs font-bold text-white hover:bg-rose" href={`/admin/imoveis/${property.id}/editar`}><Pencil size={14} /> Editar</Link><Link className="inline-flex items-center gap-1 px-2 text-xs font-semibold text-petroleo hover:text-rose" href={`/imoveis/${property.slug}`} target="_blank">Ver no site <ExternalLink size={14} /></Link></div></td>
              </tr>;
            })}
            {!properties.length && !error ? <tr><td colSpan={9} className="py-16 text-center text-grafite/50">Nenhum imóvel cadastrado no banco ainda.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}
