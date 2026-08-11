import { FileText, Save } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createBlogPost, toggleBlogPost } from "../actions";

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const feedback = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("blog_posts").select("id,title,slug,status,created_at").order("created_at", { ascending: false });
  const posts = data ?? [];

  return <>
    <p className="eyebrow">Conteúdo</p>
    <h1 className="display mt-2 text-5xl font-bold text-petroleo">Blog</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-grafite/60">Publique orientações úteis para quem está planejando a compra do primeiro imóvel.</p>
    {feedback.salvo ? <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Publicação atualizada com sucesso.</p> : null}
    {feedback.erro ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível salvar a publicação. Confira os dados e tente novamente.</p> : null}

    <form action={createBlogPost} className="card mt-8 grid gap-5 p-7 sm:grid-cols-2">
      <div className="flex items-center gap-3 text-petroleo sm:col-span-2"><FileText size={21} /><h2 className="text-xl font-bold">Nova publicação</h2></div>
      <label className="label">Título<input className="field" name="title" required /></label>
      <label className="label">Endereço da página<input className="field" name="slug" placeholder="Gerado automaticamente" /></label>
      <label className="label sm:col-span-2">Resumo<textarea className="field min-h-24" name="excerpt" /></label>
      <label className="label sm:col-span-2">Conteúdo<textarea className="field min-h-64" name="content" required /></label>
      <label className="label">Título para o Google<input className="field" name="meta_title" /></label>
      <label className="label">Descrição para o Google<textarea className="field min-h-24" name="meta_description" /></label>
      <label className="label">Publicação<select className="field" name="status" defaultValue="draft"><option value="draft">Salvar como rascunho</option><option value="published">Publicar agora</option></select></label>
      <button type="submit" className="btn btn-primary self-end sm:justify-self-end"><Save size={18} /> Salvar publicação</button>
    </form>

    <section className="card mt-8 p-7">
      <h2 className="text-xl font-bold text-petroleo">Publicações cadastradas</h2>
      {error ? <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar o blog: {error.message}</p> : null}
      <div className="mt-5 divide-y divide-petroleo/10">
        {posts.map((post) => {
          const published = post.status === "published";
          return <div key={post.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div><p className="font-bold text-petroleo">{post.title}</p><p className="mt-1 text-xs text-grafite/55">/blog/{post.slug} · {new Date(post.created_at).toLocaleDateString("pt-BR")}</p></div>
            <form action={toggleBlogPost}><input type="hidden" name="id" value={post.id} /><input type="hidden" name="published" value={published ? "false" : "true"} /><button type="submit" className={published ? "rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800" : "rounded-xl bg-grafite/10 px-4 py-2 text-xs font-bold text-grafite"}>{published ? "Publicado — voltar a rascunho" : "Rascunho — publicar"}</button></form>
          </div>;
        })}
        {!posts.length && !error ? <p className="py-10 text-center text-sm text-grafite/50">Nenhuma publicação cadastrada.</p> : null}
      </div>
    </section>
  </>;
}
