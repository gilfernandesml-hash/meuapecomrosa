import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  available: "Disponível",
  draft: "Rascunho",
  reserved: "Reservado",
  sold: "Vendido",
  inactive: "Inativo",
};

export default async function AdminPropertiesPage() {
  const supabase = await createSupabaseServerClient();
  const [propertiesResult, coversResult] = await Promise.all([
    supabase.from("properties").select("id,code,name,slug,neighborhood,phase,price,price_label,status").order("name"),
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
      {error ? <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar o catálogo: {error.message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-petroleo/10 text-xs uppercase text-grafite/45">
            <tr>{["Foto", "Código", "Nome", "Bairro", "Fase", "Valor", "Status", "Ações"].map((heading) => <th key={heading} className="px-3 py-4">{heading}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-petroleo/10">
            {properties.map((property) => {
              const cover = coverByProperty.get(property.id);
              return <tr key={property.id}>
                <td className="px-3 py-3">{cover ? <Image className="h-14 w-20 rounded-lg object-cover" src={cover} alt={`Foto de ${property.name}`} width={80} height={56} /> : <div className="h-14 w-20 rounded-lg bg-creme" />}</td>
                <td className="px-3 py-3 text-xs font-semibold text-grafite/60">{property.code}</td>
                <td className="px-3 py-3 font-semibold text-petroleo">{property.name}</td>
                <td className="px-3 py-3">{property.neighborhood ?? "—"}</td>
                <td className="px-3 py-3">{property.phase ?? "—"}</td>
                <td className="px-3 py-3">{property.price_label ?? (property.price ? Number(property.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Consulte")}</td>
                <td className="px-3 py-3"><span className="rounded-full bg-creme px-3 py-1 text-xs font-semibold text-petroleo">{statusLabels[property.status] ?? property.status}</span></td>
                <td className="px-3 py-3"><Link className="inline-flex items-center gap-1 font-semibold text-petroleo hover:text-rose" href={`/imoveis/${property.slug}`} target="_blank">Ver <ExternalLink size={14} /></Link></td>
              </tr>;
            })}
            {!properties.length && !error ? <tr><td colSpan={8} className="py-16 text-center text-grafite/50">Nenhum imóvel cadastrado no banco ainda.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}
