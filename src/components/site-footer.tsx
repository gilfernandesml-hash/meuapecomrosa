import Link from "next/link";
import { Logo } from "@/components/logo";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-petroleo py-14 text-white/75">
      <div className="container-site grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div><Logo inverse /><p className="mt-5 max-w-md text-sm leading-7">Orientação clara e atendimento humano para quem busca o primeiro imóvel na Zona Sul de São Paulo.</p><p className="mt-4 text-xs text-white/55">{site.professionalName} · {site.creci}</p></div>
        <div className="grid content-start gap-3 text-sm"><strong className="text-white">Explore</strong><Link href="/imoveis">Imóveis</Link><Link href="/minha-casa-minha-vida">Guia MCMV</Link><Link href="/primeiro-imovel">Primeiro imóvel</Link><Link href="/sobre-a-rosa">Sobre a Rosa</Link></div>
        <div className="grid content-start gap-3 text-sm"><strong className="text-white">Transparência</strong><Link href="/politica-de-privacidade">Política de privacidade</Link><Link href="/termos-de-uso">Termos de uso</Link><Link href="/admin/login">Acesso administrativo</Link></div>
      </div>
      <div className="container-site mt-10 border-t border-white/10 pt-6 text-xs text-white/45">© {new Date().getFullYear()} Meu Apê com Rosa. Condições sujeitas à análise e às regras vigentes das instituições responsáveis.</div>
    </footer>
  );
}
