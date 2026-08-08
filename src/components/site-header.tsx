import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { whatsappUrl } from "@/lib/site";

const nav = [["Imóveis", "/imoveis"], ["Minha Casa Minha Vida", "/minha-casa-minha-vida"], ["Primeiro imóvel", "/primeiro-imovel"], ["Sobre a Rosa", "/sobre-a-rosa"], ["Contato", "/contato"]];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-petroleo/10 bg-creme/95 backdrop-blur">
      <div className="container-site flex min-h-20 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-5 text-[.78rem] font-bold text-petroleo xl:flex" aria-label="Navegação principal">
          {nav.map(([label, href]) => <Link key={href} href={href} className="transition hover:text-rose">{label}</Link>)}
        </nav>
        <a className="btn btn-primary hidden text-xs sm:inline-flex" href={whatsappUrl()} target="_blank" rel="noreferrer">Falar com a Rosa</a>
        <details className="relative xl:hidden">
          <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-petroleo/20" aria-label="Abrir menu"><Menu size={20} /></summary>
          <nav className="absolute right-0 top-14 grid w-72 gap-1 rounded-2xl border border-petroleo/10 bg-white p-3 shadow-2xl">
            {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-4 py-3 font-bold text-petroleo hover:bg-creme">{label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
