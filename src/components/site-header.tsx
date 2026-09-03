import Link from "next/link";
import { LockKeyhole, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { whatsappUrl } from "@/lib/site";

const nav = [["Imóveis", "/imoveis"], ["Bairros", "/bairros"], ["Minha Casa Minha Vida", "/minha-casa-minha-vida"], ["Primeiro imóvel", "/primeiro-imovel"], ["Sobre a Rosa", "/sobre-a-rosa"], ["Contato", "/contato"]];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-petroleo/10 bg-white">
      <div className="container-site flex min-h-24 items-center justify-between gap-5">
        <Logo compact />
        <nav className="hidden items-center gap-5 text-[.78rem] font-bold text-petroleo xl:flex" aria-label="Navegação principal">
          {nav.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-rose">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 sm:flex"><Link href="/admin/login" className="inline-flex items-center gap-2 text-xs font-extrabold text-petroleo transition hover:text-rose"><LockKeyhole size={15}/> Login (ADM)</Link><a className="btn btn-primary text-xs" href={whatsappUrl()} target="_blank" rel="noreferrer">Falar com a Rosa</a></div>
        <details className="relative xl:hidden">
          <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-petroleo/20" aria-label="Abrir menu"><Menu size={20} /></summary>
          <nav className="absolute right-0 top-14 grid w-72 gap-1 rounded-2xl border border-petroleo/10 bg-white p-3 shadow-2xl">
            {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-4 py-3 font-bold text-petroleo hover:bg-creme">{label}</Link>)}
            <Link href="/admin/login" className="flex items-center gap-2 rounded-xl px-4 py-3 font-bold text-petroleo hover:bg-creme"><LockKeyhole size={17}/> Login (ADM)</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
