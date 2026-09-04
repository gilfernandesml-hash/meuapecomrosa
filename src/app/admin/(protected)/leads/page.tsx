import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bedroomLabels } from "@/lib/leads/domain";

const statuses: Record<string, string> = { new: "Novo", contacted: "Contatado", qualified: "Qualificado", visit: "Visita", proposal: "Proposta", financing: "Financiamento", sale: "Venda", lost: "Perdido" };
const money = (v: number | null) => v == null ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const yesNo = (v: boolean | null) => v == null ? "—" : v ? "Sim" : "Não";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await client.from("profiles").select("role,active").eq("id", user.id).maybeSingle();
  if (!profile?.active || !["admin", "editor"].includes(profile.role)) redirect("/admin/login");
  const params = await searchParams;
  const page = Math.max(1, Math.min(100_000, Math.floor(Number(params.pagina) || 1)));
  const { data, error, count } = await client.from("leads")
    .select("id,name,phone,email,created_at,income_range,income_amount,has_fgts,fgts_amount,has_down_payment,down_payment_amount,down_payment_range,region,bedrooms,purchase_mode,source,status,notes,origin_page,utm_source,utm_medium,utm_campaign,properties(name,code)", { count: "exact" })
    .order("created_at", { ascending: false }).order("id").range((page - 1) * 25, page * 25 - 1);
  return <>
    <p className="eyebrow">Atendimento</p><h1 className="display mt-2 text-5xl font-bold text-petroleo">Leads</h1>
    <p className="mt-3 text-sm text-grafite/65">Perfis recebidos para o atendimento da Rosa. Campos não informados aparecem como —.</p>
    {error ? <p role="alert" className="mt-8 rounded-2xl bg-red-50 p-5 text-red-800">Não foi possível carregar os leads. Confira a conexão e as migrations da fundação de leads.</p> : <p className="mt-6 text-sm font-bold text-petroleo">{count ?? 0} contatos cadastrados</p>}
    <div className="mt-6 grid gap-5">
      {(data ?? []).map((lead) => {
        const property = Array.isArray(lead.properties) ? lead.properties[0] : lead.properties;
        const fields = [
          ["Telefone", lead.phone], ["E-mail", lead.email], ["Data", new Date(lead.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })],
          ["Renda", lead.income_amount != null ? money(lead.income_amount) : lead.income_range],
          ["Possui FGTS", yesNo(lead.has_fgts)], ["Valor do FGTS", money(lead.fgts_amount)],
          ["Possui entrada", yesNo(lead.has_down_payment)], ["Entrada", lead.down_payment_amount != null ? money(lead.down_payment_amount) : lead.down_payment_range],
          ["Compra", lead.purchase_mode === "joint" ? "Composição de renda" : lead.purchase_mode === "alone" ? "Sozinho" : null],
          ["Região", lead.region], ["Dormitórios", bedroomLabels[lead.bedrooms]],
          ["Imóvel de interesse", property ? `${property.name} · ${property.code}` : null],
          ["Origem", lead.source], ["Página de origem", lead.origin_page],
          ["Campanha", lead.utm_campaign], ["Canal / mídia", [lead.utm_source, lead.utm_medium].filter(Boolean).join(" / ")],
        ];
        return <article key={lead.id} className="card min-w-0 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="subtitle break-words text-2xl text-petroleo">{lead.name || "—"}</h2><span className="rounded-full bg-creme px-4 py-2 text-xs font-bold text-petroleo">{statuses[lead.status] ?? lead.status ?? "—"}</span></div>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-bold text-grafite/60">{label}</dt><dd className="mt-1 break-words text-sm text-petroleo">{value || "—"}</dd></div>)}</dl>
          {lead.notes && <p className="mt-5 border-t border-petroleo/10 pt-4 text-sm text-grafite/70"><strong>Observações anteriores: </strong>{lead.notes}</p>}
        </article>;
      })}
      {!error && !data?.length && <p className="card p-10 text-center text-grafite/60">Nenhum lead nesta página.</p>}
    </div>
    <nav aria-label="Páginas de leads" className="mt-6 flex items-center gap-5 text-sm font-bold text-petroleo">
      {page > 1 && <Link href={`/admin/leads?pagina=${page - 1}`}>← Anterior</Link>}<span>Página {page}</span>
      {(count ?? 0) > page * 25 && <Link href={`/admin/leads?pagina=${page + 1}`}>Próxima →</Link>}
    </nav>
  </>;
}
