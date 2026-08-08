"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Building2, FilePlus2, Flag, Home, LogOut, Map, Megaphone, MessageSquare, Settings, Tags } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const items = [["Visão geral", "/admin", Home], ["Imóveis", "/admin/imoveis", Building2], ["Novo imóvel", "/admin/imoveis/novo", FilePlus2], ["Banners", "/admin/banners", Megaphone], ["Leads", "/admin/leads", MessageSquare], ["Bairros", "/admin/bairros", Map], ["Blog", "/admin/blog", Tags], ["SEO", "/admin/seo", BarChart3], ["Configurações", "/admin/configuracoes", Settings], ["Status do site", "/admin/status", Flag]] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/admin/login"); router.refresh();
  }
  return <aside className="flex bg-[#0d172b] p-4 text-white md:min-h-screen md:w-60 md:flex-col"><Link href="/admin" className="flex items-center gap-3 border-white/10 px-2 py-3 font-bold md:border-b md:pb-5"><span className="grid size-10 place-items-center rounded-xl bg-[#17539b] font-serif text-xl font-bold">R</span><span>Admin</span></Link><nav className="ml-4 flex gap-1 overflow-x-auto md:ml-0 md:mt-4 md:grid md:flex-1 md:content-start">{items.map(([label, href, Icon]) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-[#17539b] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon size={18}/>{label}</Link>; })}</nav><button onClick={logout} className="ml-auto flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 hover:bg-white/10 hover:text-white md:ml-0 md:mt-4"><LogOut size={18}/> Sair</button></aside>;
}
