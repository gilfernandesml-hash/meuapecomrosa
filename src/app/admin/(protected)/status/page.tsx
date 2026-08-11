import { Power } from "lucide-react";
import { toggleMaintenanceMode } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const feedback = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_settings").select("maintenance_mode,maintenance_message").eq("id", 1).maybeSingle();
  const maintenance = Boolean(data?.maintenance_mode);

  return <>
    <p className="eyebrow">Disponibilidade</p>
    <h1 className="display mt-2 text-5xl font-bold text-petroleo">Status do site</h1>
    {feedback.salvo ? <p className="mt-6 max-w-2xl rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Status atualizado com sucesso.</p> : null}
    {feedback.erro ? <p role="alert" className="mt-6 max-w-2xl rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível alterar o status do site.</p> : null}
    <form action={toggleMaintenanceMode} className="card mt-8 max-w-2xl p-8">
      <input type="hidden" name="enabled" value={maintenance ? "false" : "true"} />
      <div className="flex items-center gap-3"><span className={`size-3 rounded-full ${maintenance ? "bg-amber-500" : "bg-green-500"}`} /><strong className="text-xl text-petroleo">{maintenance ? "Modo de manutenção ativo" : "Site operacional"}</strong></div>
      <p className="mt-4 text-sm leading-7 text-grafite/65">{maintenance ? "Visitantes estão vendo a página de manutenção." : "O conteúdo público está disponível para visitantes e mecanismos de busca."}</p>
      <label className="label mt-6">Mensagem de manutenção<textarea className="field min-h-24" name="maintenance_message" defaultValue={data?.maintenance_message ?? "Estamos preparando novidades. Volte em breve."} /></label>
      <button type="submit" className={`btn mt-7 ${maintenance ? "bg-green-600 text-white" : "border border-rose bg-rose/10 text-petroleo"}`}><Power size={18} /> {maintenance ? "Desativar modo de manutenção" : "Ativar modo de manutenção"}</button>
      <p className="fine-print mt-5">A alteração é persistida no Supabase e não exige novo deploy.</p>
    </form>
  </>;
}
