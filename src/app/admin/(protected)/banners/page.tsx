import Image from "next/image";
import { ImageIcon, Megaphone } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminBannerUpload, BannerSubmitButton } from "@/components/admin-banner-upload";
import { createBanner, toggleBanner } from "../actions";

export default async function BannersPage({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const feedback = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("promo_banners").select("id,title,subtitle,image_path,position,active,sort_order").order("sort_order").order("created_at", { ascending: false });
  const banners = data ?? [];

  return <>
    <p className="eyebrow">Comunicação</p>
    <h1 className="display mt-2 text-5xl font-bold text-petroleo">Banners</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-grafite/60">Cadastre campanhas e escolha onde cada faixa promocional deve aparecer.</p>
    {feedback.salvo ? <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Banner atualizado com sucesso.</p> : null}
    {feedback.erro ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">{feedback.erro === "imagem-obrigatoria" ? "Escolha e aguarde o envio do arquivo do banner antes de salvar." : "Não foi possível salvar o banner. Confira os dados e tente novamente."}</p> : null}

    <form action={createBanner} className="card mt-8 grid gap-5 p-7 sm:grid-cols-2">
      <div className="flex items-center gap-3 text-petroleo sm:col-span-2"><Megaphone size={21} /><h2 className="text-xl font-bold">Novo banner</h2></div>
      <label className="label">Título<input className="field" name="title" required /></label>
      <label className="label">Subtítulo<input className="field" name="subtitle" /></label>
      <label className="label">Texto do botão<input className="field" name="cta_label" placeholder="Conheça os imóveis" /></label>
      <label className="label">Destino do botão<input className="field" name="target_url" placeholder="/imoveis" /></label>
      <AdminBannerUpload />
      <label className="label">Posição<select className="field" name="position" defaultValue="home"><option value="home">Página inicial</option><option value="properties">Lista de imóveis</option><option value="detail">Detalhe do imóvel</option><option value="blog">Blog</option></select></label>
      <label className="label">Ordem<input className="field" type="number" name="sort_order" min="0" defaultValue="0" /></label>
      <label className="flex items-center gap-3 text-sm font-semibold text-petroleo sm:col-span-2"><input className="h-4 w-4 accent-petroleo" type="checkbox" name="active" defaultChecked /> Publicar assim que salvar</label>
      <BannerSubmitButton />
    </form>

    <section className="card mt-8 p-7">
      <div className="flex items-center gap-3 text-petroleo"><ImageIcon size={21} /><h2 className="text-xl font-bold">Banners cadastrados</h2></div>
      {error ? <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar os banners: {error.message}</p> : null}
      <div className="mt-5 divide-y divide-petroleo/10">
        {banners.map((banner) => <div key={banner.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">{banner.image_path ? <Image src={banner.image_path} alt={`Banner ${banner.title}`} width={144} height={54} className="h-14 w-36 rounded-lg object-cover" /> : <div className="h-14 w-36 rounded-lg bg-creme" />}<div><p className="font-bold text-petroleo">{banner.title}</p><p className="mt-1 text-xs text-grafite/55">{banner.subtitle || "Sem subtítulo"} · {banner.position} · ordem {banner.sort_order}</p></div></div>
          <form action={toggleBanner}><input type="hidden" name="id" value={banner.id} /><input type="hidden" name="active" value={banner.active ? "false" : "true"} /><button type="submit" className={banner.active ? "rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800" : "rounded-xl bg-grafite/10 px-4 py-2 text-xs font-bold text-grafite"}>{banner.active ? "Ativo — desativar" : "Inativo — ativar"}</button></form>
        </div>)}
        {!banners.length && !error ? <p className="py-10 text-center text-sm text-grafite/50">Nenhum banner cadastrado.</p> : null}
      </div>
    </section>
  </>;
}
