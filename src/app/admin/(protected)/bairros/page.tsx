import { MapPin, Save } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNeighborhood, toggleNeighborhood } from "../actions";

export default async function NeighborhoodsPage({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const feedback = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("neighborhoods").select("id,name,slug,city,state,published").order("name");
  const neighborhoods = data ?? [];

  return <>
    <p className="eyebrow">Conteúdo local</p>
    <h1 className="display mt-2 text-5xl font-bold text-petroleo">Bairros</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-grafite/60">Crie páginas locais para apresentar os bairros atendidos e melhorar a busca dos imóveis.</p>
    {feedback.salvo ? <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Bairro atualizado com sucesso.</p> : null}
    {feedback.erro ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível salvar o bairro. Confira os dados e tente novamente.</p> : null}

    <form action={createNeighborhood} className="card mt-8 grid gap-5 p-7 sm:grid-cols-2">
      <div className="flex items-center gap-3 text-petroleo sm:col-span-2"><MapPin size={21} /><h2 className="text-xl font-bold">Novo bairro</h2></div>
      <label className="label">Nome<input className="field" name="name" required /></label>
      <label className="label">Endereço da página<input className="field" name="slug" placeholder="Gerado automaticamente" /></label>
      <label className="label">Cidade<input className="field" name="city" defaultValue="São Paulo" required /></label>
      <label className="label">Estado<input className="field" name="state" defaultValue="SP" maxLength={2} required /></label>
      <label className="label sm:col-span-2">Texto sobre o bairro<textarea className="field min-h-36" name="seo_text" /></label>
      <label className="label">Título para o Google<input className="field" name="meta_title" /></label>
      <label className="label">Descrição para o Google<textarea className="field min-h-24" name="meta_description" /></label>
      <label className="flex items-center gap-3 text-sm font-semibold text-petroleo sm:col-span-2"><input className="h-4 w-4 accent-petroleo" type="checkbox" name="published" defaultChecked /> Publicar assim que salvar</label>
      <button type="submit" className="btn btn-primary sm:col-span-2 sm:justify-self-end"><Save size={18} /> Salvar bairro</button>
    </form>

    <section className="card mt-8 p-7">
      <h2 className="text-xl font-bold text-petroleo">Bairros cadastrados</h2>
      {error ? <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar os bairros: {error.message}</p> : null}
      <div className="mt-5 divide-y divide-petroleo/10">
        {neighborhoods.map((neighborhood) => <div key={neighborhood.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div><p className="font-bold text-petroleo">{neighborhood.name}</p><p className="mt-1 text-xs text-grafite/55">{neighborhood.city} - {neighborhood.state} · /bairros/{neighborhood.slug}</p></div>
          <form action={toggleNeighborhood}><input type="hidden" name="id" value={neighborhood.id} /><input type="hidden" name="published" value={neighborhood.published ? "false" : "true"} /><button type="submit" className={neighborhood.published ? "rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800" : "rounded-xl bg-grafite/10 px-4 py-2 text-xs font-bold text-grafite"}>{neighborhood.published ? "Publicado — ocultar" : "Oculto — publicar"}</button></form>
        </div>)}
        {!neighborhoods.length && !error ? <p className="py-10 text-center text-sm text-grafite/50">Nenhum bairro cadastrado.</p> : null}
      </div>
    </section>
  </>;
}
