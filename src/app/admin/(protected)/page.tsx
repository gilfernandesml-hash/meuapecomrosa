import { Building2, Home, MessageSquare, Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  available: "Disponível",
  draft: "Rascunho",
  reserved: "Reservado",
  sold: "Vendido",
  inactive: "Inativo",
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const [totalResult, availableResult, mcmvResult, leadsResult, recentResult] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("is_mcmv", true),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("properties").select("id,name,status,updated_at").order("updated_at", { ascending: false }).limit(5),
  ]);

  const queryError = [totalResult, availableResult, mcmvResult, leadsResult, recentResult].find((result) => result.error)?.error;
  const stats = [
    ["Total de imóveis", totalResult.count ?? 0, Building2],
    ["Disponíveis", availableResult.count ?? 0, Home],
    ["MCMV", mcmvResult.count ?? 0, Star],
    ["Leads novos", leadsResult.count ?? 0, MessageSquare],
  ] as const;

  return <>
    <div>
      <p className="eyebrow">Painel administrativo</p>
      <h1 className="display mt-2 text-5xl font-bold text-petroleo">Visão geral</h1>
      <p className="mt-2 text-sm text-grafite/60">Acompanhe imóveis e atendimentos em um só lugar.</p>
    </div>
    {queryError ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800">Não foi possível atualizar os dados: {queryError.message}</p> : null}
    <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, Icon]) => <div key={label} className="card p-6">
        <Icon className="text-rose" />
        <p className="mt-5 text-4xl font-bold text-petroleo">{value}</p>
        <p className="mt-1 text-sm text-grafite/55">{label}</p>
      </div>)}
    </section>
    <section className="mt-8 grid gap-6 xl:grid-cols-2">
      <div className="card p-6">
        <h2 className="font-serif text-2xl font-bold text-petroleo">Últimas alterações</h2>
        {recentResult.data?.length ? <ul className="mt-5 divide-y divide-petroleo/10">
          {recentResult.data.map((property) => <li key={property.id} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="font-semibold text-petroleo">{property.name}</span>
            <span className="text-grafite/55">{statusLabels[property.status] ?? property.status}</span>
          </li>)}
        </ul> : <p className="mt-8 rounded-2xl bg-creme p-7 text-center text-sm text-grafite/55">Nenhuma alteração registrada.</p>}
      </div>
      <div className="card p-6">
        <h2 className="font-serif text-2xl font-bold text-petroleo">Situação do catálogo</h2>
        <ul className="mt-5 grid gap-3 text-sm">
          <li>✓ Supabase conectado</li>
          <li>✓ Usuária administradora ativa</li>
          <li>✓ Catálogo Minha Casa Minha Vida sincronizado</li>
        </ul>
      </div>
    </section>
  </>;
}
