import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Building2, ClipboardCheck, FileCheck2, Gift, HandCoins, HeartHandshake, KeyRound, MapPin, Search, UsersRound } from "lucide-react";
import { LeadForm } from "@/components/lead-form";
import { PublicShell } from "@/components/public-shell";
import { PropertyCard } from "@/components/property-card";
import { getPublicProperties } from "@/lib/property-catalog";
import { housingClassifications } from "@/lib/properties";
import { site, whatsappUrl } from "@/lib/site";

const possibilities = [
  ["FGTS", "Entenda quando seu saldo pode fazer parte da compra.", HandCoins],
  ["Entrada", "Organize os recursos disponíveis com mais clareza.", KeyRound],
  ["Financiamento", "Conheça as etapas sem linguagem complicada.", Banknote],
  ["Subsídio", "Veja se existe possibilidade de benefício, conforme as regras e a análise aplicáveis.", Gift],
  ["Documentação", "Saiba o que preparar para avançar com tranquilidade.", FileCheck2],
];

const steps = [
  ["1", "Entendemos seu perfil", "Renda, FGTS, entrada, necessidades e região desejada.", UsersRound],
  ["2", "Selecionamos os imóveis", "Opções compatíveis com seu momento e suas prioridades.", Building2],
  ["3", "Acompanhamos cada etapa", "Financiamento, contratos e documentação até as chaves.", ClipboardCheck],
];

function RosaBadge({ className }: { className: string }) {
  return <div className={`absolute z-10 rounded-[1.6rem] bg-petroleo/95 px-6 py-5 text-white shadow-2xl backdrop-blur-sm ${className}`}><p className="brand-signature text-4xl">Rosa Oliveira</p><p className="mt-1 text-xs leading-5 text-white/70 sm:text-sm">{site.creci} · Corretora desde 2015 | Especialista Minha Casa Minha Vida</p></div>;
}

export default async function Home() {
  const properties = await getPublicProperties();
  return (
    <PublicShell>
      <section className="hero-home relative overflow-hidden bg-petroleo">
        <div className="hero-home-art" aria-hidden="true" />
        <div className="absolute inset-y-0 right-0 hidden w-[49%] lg:block">
          <Image src="/hero-rosa-imovel-v2.png" alt="Rosa Oliveira em frente a um empreendimento residencial" fill preload sizes="49vw" className="object-cover object-center" />
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-petroleo to-transparent" />
          <RosaBadge className="bottom-10 left-1/2 w-[min(88%,560px)] -translate-x-1/2" />
        </div>
        <div className="container-site grid min-h-[720px] items-center gap-10 py-16 lg:grid-cols-2">
          <div className="relative z-10 lg:pr-8">
            <p className="eyebrow text-champagne">Seu caminho para a casa própria</p>
            <h1 className="hero-title mt-5 text-white" aria-label="Seu próximo endereço para melhor investimento.">
              <span className="block" aria-hidden="true">Seu próximo{" "}</span>
              <span className="block" aria-hidden="true">endereço para{" "}</span>
              <span className="hero-title-accent block" aria-hidden="true">melhor{" "}</span>
              <span className="hero-title-accent block" aria-hidden="true">investimento.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">Encontre seu primeiro imóvel com orientação em cada etapa — da escolha do apartamento ao financiamento, documentação e entrega das chaves.</p>
            <p className="mt-5 max-w-2xl border-l-4 border-champagne pl-4 text-sm font-bold leading-6 text-white/90">Corretora desde 2015 • Especialista em Minha Casa Minha Vida, FGTS e financiamento imobiliário.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="#perfil-de-compra" className="btn bg-champagne text-petroleo shadow-xl">Quero saber o que posso comprar <ArrowRight size={18}/></Link><Link href="/imoveis" className="btn border border-white/30 bg-white/10 text-white">Ver imóveis</Link></div>
            <div className="mt-9 flex flex-wrap gap-5 text-xs font-bold text-white/75"><span className="flex items-center gap-2"><BadgeCheck className="text-champagne" size={19}/> Rosa Oliveira · {site.creci}</span><span className="flex items-center gap-2"><MapPin className="text-champagne" size={19}/> Zona Sul de São Paulo</span></div>
          </div>
          <div className="relative -mx-4 h-[520px] sm:-mx-8 lg:hidden">
            <Image src="/hero-rosa-imovel-v2.png" alt="Rosa Oliveira em frente a um empreendimento residencial" fill preload sizes="100vw" className="object-cover object-center" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-petroleo to-transparent" />
            <RosaBadge className="inset-x-5 bottom-0" />
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-3 pb-6">
        <form action="/imoveis" className="container-site card grid gap-3 p-5 md:grid-cols-2 md:p-7 lg:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))_auto]" aria-label="Buscar imóveis">
          <label className="label">Onde quer morar?<span className="relative"><MapPin className="absolute left-3 top-3.5 text-rose" size={18}/><input className="field pl-10" name="local" placeholder="Bairro ou região"/></span></label>
          <label className="label">Faixa de preço<select className="field" name="preco"><option value="">Qualquer valor</option><option value="300000">Até R$ 300 mil</option><option value="400000">Até R$ 400 mil</option></select></label>
          <label className="label">Dormitórios<select className="field" name="dormitorios"><option value="">Todos</option><option value="2">2 dormitórios</option><option value="3">3 dormitórios</option></select></label>
          <label className="label">Fase<select className="field" name="fase"><option value="">Todas</option><option>Lançamento</option><option>Em construção</option><option>Pronto</option></select></label>
          <label className="label">Classificação<select className="field" name="classificacao"><option value="">Todas</option>{housingClassifications.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button className="btn btn-primary self-end md:col-span-2 lg:col-span-1" aria-label="Buscar imóveis"><Search size={19}/><span className="lg:hidden">Buscar</span></button>
        </form>
      </section>

      <section className="bg-white pb-16 pt-6 sm:pb-20">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Oportunidades selecionadas</p><h2 className="subtitle mt-3 text-4xl text-petroleo sm:text-5xl">Encontre um imóvel para o seu momento.</h2></div><Link href="/imoveis" className="font-bold text-rose">Ver todos os imóveis →</Link></div>
          <div className="property-grid mt-10">{properties.slice(0, 12).map((property) => <PropertyCard key={property.slug} property={property}/>)}</div>
          <p className="fine-print mt-7">Dados provenientes do catálogo público da Órulo. Disponibilidade, valores, status e enquadramento devem ser confirmados antes de qualquer proposta.</p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-site">
          <div className="mx-auto max-w-3xl text-center"><p className="eyebrow">Você não precisa entender tudo sozinho</p><h2 className="subtitle mt-3 text-4xl text-petroleo sm:text-5xl">Como a Rosa ajuda você</h2><p className="mt-5 leading-7 text-grafite/65">Muito mais do que enviar links: orientação próxima para transformar dúvidas em um caminho claro até o seu imóvel.</p></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{steps.map(([number, title, text, Icon]) => { const C = Icon as typeof UsersRound; return <article key={String(number)} className="card relative overflow-hidden p-7"><span className="absolute right-5 top-2 font-serif text-7xl font-bold text-rose/10">{String(number)}</span><C className="text-rose" size={30}/><h3 className="subtitle mt-5 text-2xl text-petroleo">{String(title)}</h3><p className="mt-3 text-sm leading-6 text-grafite/65">{String(text)}</p></article>; })}</div>
        </div>
      </section>

      <section className="section bg-creme">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Mais opções para você</p><h2 className="subtitle mt-3 text-4xl text-petroleo sm:text-5xl">Continue explorando as oportunidades.</h2></div><Link href="/imoveis" className="font-bold text-rose">Ver catálogo completo →</Link></div>
          <div className="property-grid mt-10">{properties.slice(12, 24).map((property) => <PropertyCard key={property.slug} property={property}/>)}</div>
        </div>
      </section>

      <section id="perfil-de-compra" className="section scroll-mt-32 bg-petroleo/5">
        <div className="container-site"><LeadForm home /></div>
      </section>

      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><p className="eyebrow">Saia do aluguel</p><h2 className="subtitle mt-3 text-5xl leading-none text-petroleo">Talvez você esteja mais perto do seu apê do que imagina.</h2><p className="mt-6 leading-8 text-grafite/70">Cada família tem uma realidade diferente. Rosa ajuda você a organizar as informações, entender possibilidades e buscar imóveis compatíveis com seu momento.</p><a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn btn-primary mt-7">Quero entender minhas possibilidades</a></div>
          <div className="grid gap-4 sm:grid-cols-2">{possibilities.map(([title, text, Icon]) => { const C = Icon as typeof HandCoins; return <div key={String(title)} className="card p-6"><C className="text-rose"/><h3 className="subtitle mt-5 text-2xl text-petroleo">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-grafite/65">{String(text)}</p></div>; })}</div>
        </div>
      </section>

      <section className="section bg-petroleo text-white">
        <div className="container-site grid gap-10 md:grid-cols-[1fr_.8fr] md:items-center">
          <div><HeartHandshake className="text-champagne" size={36}/><h2 className="subtitle mt-5 text-5xl">Você não precisa entender tudo sozinho.</h2><p className="mt-5 max-w-2xl leading-8 text-white/70">Do primeiro atendimento à documentação e ao financiamento, conte com uma orientação próxima, transparente e sem promessas irreais.</p></div>
          <div className="rounded-3xl border border-white/15 bg-white/5 p-7"><p className="subtitle text-3xl">Converse com a Rosa</p><p className="mt-3 text-sm leading-7 text-white/70">Conte onde deseja morar e em que fase está. O primeiro passo é uma conversa simples.</p><a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn mt-6 bg-rose text-white">Iniciar conversa</a></div>
        </div>
      </section>
    </PublicShell>
  );
}
