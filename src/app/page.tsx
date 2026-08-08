import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, FileCheck2, HandCoins, HeartHandshake, KeyRound, MapPin, Search } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { PropertyCard } from "@/components/property-card";
import { properties } from "@/lib/properties";
import { site, whatsappUrl } from "@/lib/site";

const possibilities = [
  ["FGTS", "Entenda quando seu saldo pode fazer parte da compra.", HandCoins],
  ["Entrada", "Organize os recursos disponíveis com mais clareza.", KeyRound],
  ["Financiamento", "Conheça as etapas sem linguagem complicada.", Banknote],
  ["Documentação", "Saiba o que preparar para avançar com tranquilidade.", FileCheck2],
];

export default function Home() {
  return (
    <PublicShell>
      <section className="overflow-hidden bg-creme">
        <div className="container-site grid min-h-[680px] items-center gap-12 py-16 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="eyebrow">Seu caminho para a casa própria</p>
            <h1 className="display mt-5 max-w-3xl text-5xl font-bold leading-[.95] text-petroleo sm:text-6xl lg:text-7xl">Seu primeiro apê pode estar <span className="text-rose">mais perto</span> do que você imagina.</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-grafite/75 sm:text-lg">Encontre imóveis Minha Casa Minha Vida e oportunidades selecionadas para transformar o aluguel em patrimônio, com orientação humana em cada etapa.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/imoveis" className="btn btn-primary">Quero encontrar meu apê <ArrowRight size={18}/></Link><Link href="/contato#pre-analise" className="btn btn-secondary">Fazer pré-análise</Link></div>
            <div className="mt-9 flex flex-wrap gap-5 text-xs font-bold text-petroleo/75"><span className="flex items-center gap-2"><BadgeCheck className="text-champagne" size={19}/> Atendimento próximo</span><span className="flex items-center gap-2"><MapPin className="text-champagne" size={19}/> Zona Sul de São Paulo</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg pt-10">
            <div className="absolute inset-0 translate-x-7 rounded-[45%_45%_18%_18%] bg-rose/20"/>
            <div className="relative overflow-hidden rounded-[12rem_12rem_2rem_2rem] border-[10px] border-white bg-white shadow-2xl">
              <Image src="/rosa-oliveira-imovel.png" alt="Rosa Oliveira, corretora de imóveis, em frente a um empreendimento residencial" width={1600} height={1600} priority className="aspect-[4/5] w-full object-cover object-top" />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-petroleo/95 p-5 text-white backdrop-blur"><p className="font-serif text-2xl font-bold">Rosa Oliveira</p><p className="mt-1 text-xs text-white/70">{site.creci} · Corretora desde 2015</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-3 pb-16">
        <form action="/imoveis" className="container-site card grid gap-3 p-5 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:p-7" aria-label="Buscar imóveis">
          <label className="label">Onde quer morar?<span className="relative"><MapPin className="absolute left-3 top-3.5 text-rose" size={18}/><input className="field pl-10" name="local" placeholder="Bairro ou região"/></span></label>
          <label className="label">Faixa de preço<select className="field" name="preco"><option value="">Qualquer valor</option><option value="300000">Até R$ 300 mil</option><option value="400000">Até R$ 400 mil</option></select></label>
          <label className="label">Dormitórios<select className="field" name="dormitorios"><option value="">Todos</option><option value="2">2 dormitórios</option><option value="3">3 dormitórios</option></select></label>
          <label className="label">Fase<select className="field" name="fase"><option value="">Todas</option><option>Lançamento</option><option>Em construção</option><option>Pronto</option></select></label>
          <button className="btn btn-primary self-end" aria-label="Buscar imóveis"><Search size={19}/><span className="md:hidden">Buscar</span></button>
        </form>
      </section>

      <section className="section bg-white">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Oportunidades selecionadas</p><h2 className="display mt-3 text-4xl font-bold text-petroleo sm:text-5xl">Encontre um imóvel para o seu momento.</h2></div><Link href="/imoveis" className="font-bold text-rose">Ver todos os imóveis →</Link></div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{properties.map((property) => <PropertyCard key={property.slug} property={property}/>)}</div>
          <p className="fine-print mt-7">Imóveis e valores ilustrativos nesta primeira versão. Disponibilidade, valores e condições devem ser confirmados antes de qualquer proposta.</p>
        </div>
      </section>

      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><p className="eyebrow">Saia do aluguel</p><h2 className="display mt-3 text-5xl font-bold leading-none text-petroleo">Talvez você esteja mais perto do seu apê do que imagina.</h2><p className="mt-6 leading-8 text-grafite/70">Cada família tem uma realidade diferente. Rosa ajuda você a organizar as informações, entender possibilidades e buscar imóveis compatíveis com seu momento.</p><a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn btn-primary mt-7">Quero entender minhas possibilidades</a></div>
          <div className="grid gap-4 sm:grid-cols-2">{possibilities.map(([title, text, Icon]) => { const C = Icon as typeof HandCoins; return <div key={String(title)} className="card p-6"><C className="text-rose"/><h3 className="mt-5 font-serif text-2xl font-bold text-petroleo">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-grafite/65">{String(text)}</p></div>; })}</div>
        </div>
      </section>

      <section className="section bg-petroleo text-white">
        <div className="container-site grid gap-10 md:grid-cols-[1fr_.8fr] md:items-center">
          <div><HeartHandshake className="text-champagne" size={36}/><h2 className="display mt-5 text-5xl font-bold">Você não precisa entender tudo sozinho.</h2><p className="mt-5 max-w-2xl leading-8 text-white/70">Do primeiro atendimento à documentação e ao financiamento, conte com uma orientação próxima, transparente e sem promessas irreais.</p></div>
          <div className="rounded-3xl border border-white/15 bg-white/5 p-7"><p className="font-serif text-3xl font-bold">Converse com a Rosa</p><p className="mt-3 text-sm leading-7 text-white/70">Conte onde deseja morar e em que fase está. O primeiro passo é uma conversa simples.</p><a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn mt-6 bg-rose text-white">Iniciar conversa</a></div>
        </div>
      </section>
    </PublicShell>
  );
}
