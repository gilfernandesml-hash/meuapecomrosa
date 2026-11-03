import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  ClipboardCheck,
  FileCheck2,
  Gift,
  HandCoins,
  HeartHandshake,
  KeyRound,
  MapPin,
  Search,
  UsersRound,
} from "lucide-react";

import { Cormorant_Garamond, Montserrat } from "next/font/google";

import { BuyerProfileSimulator } from "@/components/buyer-profile-simulator";
import { PublicShell } from "@/components/public-shell";
import { PropertyCard } from "@/components/property-card";
import { getPublicProperties } from "@/lib/property-catalog";
import { housingClassifications } from "@/lib/properties";
import { site, whatsappUrl } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { NeighborhoodLinks } from "@/components/neighborhood-links";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = pageMetadata({
  title: "Apartamentos na Zona Sul de São Paulo",
  description:
    "Encontre apartamentos e lançamentos na Zona Sul de São Paulo com orientação de Rosa Oliveira para seu primeiro imóvel.",
  path: "/",
});

const possibilities = [
  [
    "FGTS",
    "Entenda quando seu saldo pode fazer parte da compra.",
    HandCoins,
  ],
  [
    "Entrada",
    "Organize os recursos disponíveis com mais clareza.",
    KeyRound,
  ],
  [
    "Financiamento",
    "Conheça as etapas sem linguagem complicada.",
    Banknote,
  ],
  [
    "Subsídio",
    "Veja se existe possibilidade de benefício, conforme as regras e a análise aplicáveis.",
    Gift,
  ],
  [
    "Documentação",
    "Saiba o que preparar para avançar com tranquilidade.",
    FileCheck2,
  ],
];

const steps = [
  [
    "1",
    "Entendemos seu perfil",
    "Renda, FGTS, entrada, necessidades e região desejada.",
    UsersRound,
  ],
  [
    "2",
    "Selecionamos os imóveis",
    "Opções compatíveis com seu momento e suas prioridades.",
    Building2,
  ],
  [
    "3",
    "Acompanhamos cada etapa",
    "Financiamento, contratos e documentação até as chaves.",
    ClipboardCheck,
  ],
];

export default async function Home() {
  const properties = await getPublicProperties();

  return (
    <PublicShell>

      {/* ===================================================== */}
      {/* HERO PRINCIPAL */}
      {/* ===================================================== */}

      <section className="relative min-h-[760px] overflow-hidden bg-[#0d1913] text-white">

        {/* Condomínio com perfil Minha Casa Minha Vida, sem pessoas */}
        <div className="absolute inset-0">
          <Image
            src="/hero-condominio-mcmv-v2.webp"
            alt="Condomínio residencial com prédios de apartamentos e área de lazer"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_center] sm:object-[64%_center] lg:object-center"
          />

          {/* Contraste para o texto sem esconder o empreendimento */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,24,17,0.78)_0%,rgba(9,24,17,0.65)_55%,rgba(9,24,17,0.28)_100%)] lg:bg-[linear-gradient(90deg,rgba(9,24,17,0.84)_0%,rgba(9,24,17,0.72)_36%,rgba(9,24,17,0.24)_64%,rgba(9,24,17,0.02)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1913]/30 via-transparent to-[#0d1913]/5" />
        </div>

        {/* Detalhe suave no fundo */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            background:
              "linear-gradient(120deg, transparent 0%, transparent 32%, rgba(255,255,255,.16) 32.2%, transparent 32.5%)",
          }}
          aria-hidden="true"
        />

        {/* ================================================= */}
        {/* CONTEÚDO DO HERO */}
        {/* ================================================= */}

        <div className="container-site relative z-10 grid min-h-[760px] items-center gap-10 py-16 lg:grid-cols-[58%_42%]">

          <div className="max-w-[800px] lg:pr-8">

            {/* Texto superior */}
            <div
              className={`${montserrat.className} mb-8 flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#e6b650] sm:mb-10 sm:text-xs`}
            >
              <span className="h-px w-14 bg-[#e6b650] sm:w-20" />

              Seu caminho para a casa própria
            </div>

            {/* TÍTULO PRINCIPAL */}
            <h1
              className={`${cormorant.className} text-[55px] font-medium leading-[0.92] tracking-[-0.03em] sm:text-[70px] lg:text-[76px] xl:text-[88px]`}
            >
              <span className="block text-white">
                Seu primeiro apê
              </span>

              <span className="block text-white">
                pode estar mais perto
              </span>

              <span className="block italic text-[#e8ba59]">
                do que você imagina.
              </span>
            </h1>

            {/* SUBTÍTULO */}
            <p
              className={`${montserrat.className} mt-8 max-w-[720px] text-base leading-8 text-white/80 sm:mt-10 sm:text-lg`}
            >
              Encontre o imóvel ideal para você, com orientação da Rosa em cada
              etapa — da simulação do financiamento à entrega das chaves.
            </p>

            {/* AUTORIDADE */}
            <p
              className={`${montserrat.className} mt-5 max-w-[730px] border-l border-[#e8ba59] pl-4 text-sm font-semibold leading-6 text-white/80`}
            >
              Corretora desde 2015 • Especialista em Minha Casa Minha Vida,
              FGTS e financiamento imobiliário.
            </p>

            {/* BOTÕES */}
            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">

              <Link
                href="/imoveis"
                className={`${montserrat.className} inline-flex min-h-[90px] items-center justify-center bg-[#d5c3a4] px-9 text-xs font-bold uppercase tracking-[0.22em] text-[#102018] transition duration-300 hover:bg-[#e3d2b8] sm:min-w-[270px]`}
              >
                Explorar imóveis
              </Link>

              <Link
                href="#perfil-de-compra"
                className={`${montserrat.className} group inline-flex min-h-[58px] min-w-0 items-center justify-between gap-8 border-b border-[#d7ac4c]/60 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#e7b84f] sm:min-w-[370px]`}
              >
                Descubra o que você pode comprar

                <ArrowRight
                  size={20}
                  className="shrink-0 transition-transform duration-300 group-hover:translate-x-2"
                />
              </Link>

            </div>

            {/* CRECI E LOCALIZAÇÃO */}
            <div
              className={`${montserrat.className} mt-9 flex flex-wrap gap-5 text-xs font-semibold text-white/65`}
            >
              <span className="flex items-center gap-2">
                <BadgeCheck
                  className="text-[#e8ba59]"
                  size={18}
                />

                Rosa Oliveira · {site.creci}
              </span>

              <span className="flex items-center gap-2">
                <MapPin
                  className="text-[#e8ba59]"
                  size={18}
                />

                Zona Sul de São Paulo
              </span>
            </div>

          </div>

          {/* Mantém o texto na área de maior contraste */}
          <div className="hidden lg:block" />

        </div>

      </section>

      {/* ===================================================== */}
      {/* FILTRO DE IMÓVEIS */}
      {/* ===================================================== */}

      <section className="relative z-10 -mt-3 pb-6">

        <form
          action="/imoveis"
          className="container-site card grid gap-3 p-5 md:grid-cols-2 md:p-7 lg:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))_auto]"
          aria-label="Buscar imóveis"
        >

          <label className="label">
            Onde quer morar?

            <span className="relative">

              <MapPin
                className="absolute left-3 top-3.5 text-rose"
                size={18}
              />

              <input
                className="field pl-10"
                name="local"
                placeholder="Bairro ou região"
              />

            </span>
          </label>

          <label className="label">
            Faixa de preço

            <select
              className="field"
              name="preco"
            >
              <option value="">
                Qualquer valor
              </option>

              <option value="300000">
                Até R$ 300 mil
              </option>

              <option value="400000">
                Até R$ 400 mil
              </option>
            </select>

          </label>

          <label className="label">
            Dormitórios

            <select
              className="field"
              name="dormitorios"
            >
              <option value="">
                Todos
              </option>

              <option value="2">
                2 dormitórios
              </option>

              <option value="3">
                3 dormitórios
              </option>

            </select>
          </label>

          <label className="label">
            Fase

            <select
              className="field"
              name="fase"
            >
              <option value="">
                Todas
              </option>

              <option>
                Lançamento
              </option>

              <option>
                Em construção
              </option>

              <option>
                Pronto
              </option>
            </select>
          </label>

          <label className="label">
            Classificação

            <select
              className="field"
              name="classificacao"
            >

              <option value="">
                Todas
              </option>

              {housingClassifications.map(
                ({ value, label }) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}

            </select>
          </label>

          <button
            className="btn btn-primary self-end md:col-span-2 lg:col-span-1"
            aria-label="Buscar imóveis"
          >

            <Search size={19} />

            <span className="lg:hidden">
              Buscar
            </span>

          </button>

        </form>

      </section>

      {/* ===================================================== */}
      {/* PRIMEIROS IMÓVEIS */}
      {/* ===================================================== */}

      <section className="bg-white pb-16 pt-6 sm:pb-20">

        <div className="container-site">

          <div className="flex flex-wrap items-end justify-between gap-5">

            <div>

              <p className="eyebrow">
                Oportunidades selecionadas
              </p>

              <h2 className="subtitle mt-3 text-4xl text-petroleo sm:text-5xl">
                Encontre um imóvel para o seu momento.
              </h2>

            </div>

            <Link
              href="/imoveis"
              className="font-bold text-rose"
            >
              Ver todos os imóveis →
            </Link>

          </div>

          <div className="property-grid mt-10">

            {properties
              .slice(0, 12)
              .map((property) => (

                <PropertyCard
                  key={property.slug}
                  property={property}
                />

              ))}

          </div>

          <p className="fine-print mt-7">
            Dados provenientes do catálogo público da Órulo. Disponibilidade,
            valores, status e enquadramento devem ser confirmados antes de
            qualquer proposta.
          </p>

        </div>

      </section>

      {/* ===================================================== */}
      {/* COMO A ROSA AJUDA */}
      {/* ===================================================== */}

      <section className="section bg-white">

        <div className="container-site">

          <div className="mx-auto max-w-3xl text-center">

            <p className="eyebrow">
              Você não precisa entender tudo sozinho
            </p>

            <h2 className="subtitle mt-3 text-4xl text-petroleo sm:text-5xl">
              Como a Rosa ajuda você
            </h2>

            <p className="mt-5 leading-7 text-grafite/65">
              Muito mais do que enviar links: orientação próxima para
              transformar dúvidas em um caminho claro até o seu imóvel.
            </p>

          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">

            {steps.map(
              ([number, title, text, Icon]) => {

                const C =
                  Icon as typeof UsersRound;

                return (

                  <article
                    key={String(number)}
                    className="card relative overflow-hidden p-7"
                  >

                    <span className="absolute right-5 top-2 font-serif text-7xl font-bold text-rose/10">
                      {String(number)}
                    </span>

                    <C
                      className="text-rose"
                      size={30}
                    />

                    <h3 className="subtitle mt-5 text-2xl text-petroleo">
                      {String(title)}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-grafite/65">
                      {String(text)}
                    </p>

                  </article>

                );
              }
            )}

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* MAIS IMÓVEIS */}
      {/* ===================================================== */}

      <section className="section bg-creme">

        <div className="container-site">

          <div className="flex flex-wrap items-end justify-between gap-5">

            <div>

              <p className="eyebrow">
                Mais opções para você
              </p>

              <h2 className="subtitle mt-3 text-4xl text-petroleo sm:text-5xl">
                Continue explorando as oportunidades.
              </h2>

            </div>

            <Link
              href="/imoveis"
              className="font-bold text-rose"
            >
              Ver catálogo completo →
            </Link>

          </div>

          <div className="property-grid mt-10">

            {properties
              .slice(12, 24)
              .map((property) => (

                <PropertyCard
                  key={property.slug}
                  property={property}
                />

              ))}

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* BAIRROS */}
      {/* ===================================================== */}

      <NeighborhoodLinks />

      {/* ===================================================== */}
      {/* FORMULÁRIO */}
      {/* ===================================================== */}

      <section
        id="perfil-de-compra"
        className="section scroll-mt-32 bg-petroleo/5"
      >

        <div className="container-site">
          <BuyerProfileSimulator regions={[...new Set(properties.map(item => item.neighborhood).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"))} />
        </div>

      </section>

      {/* ===================================================== */}
      {/* POSSIBILIDADES */}
      {/* ===================================================== */}

      <section className="section">

        <div className="container-site grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">

          <div>

            <p className="eyebrow">
              Saia do aluguel
            </p>

            <h2 className="subtitle mt-3 text-5xl leading-none text-petroleo">
              Talvez você esteja mais perto do seu apê do que imagina.
            </h2>

            <p className="mt-6 leading-8 text-grafite/70">
              Cada família tem uma realidade diferente. Rosa ajuda você a
              organizar as informações, entender possibilidades e buscar
              imóveis compatíveis com seu momento.
            </p>

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary mt-7"
            >
              Quero entender minhas possibilidades
            </a>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {possibilities.map(
              ([title, text, Icon]) => {

                const C =
                  Icon as typeof HandCoins;

                return (

                  <div
                    key={String(title)}
                    className="card p-6"
                  >

                    <C className="text-rose" />

                    <h3 className="subtitle mt-5 text-2xl text-petroleo">
                      {String(title)}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-grafite/65">
                      {String(text)}
                    </p>

                  </div>

                );
              }
            )}

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* CTA FINAL */}
      {/* ===================================================== */}

      <section className="section bg-petroleo text-white">

        <div className="container-site grid gap-10 md:grid-cols-[1fr_.8fr] md:items-center">

          <div>

            <HeartHandshake
              className="text-champagne"
              size={36}
            />

            <h2 className="subtitle mt-5 text-5xl">
              Você não precisa entender tudo sozinho.
            </h2>

            <p className="mt-5 max-w-2xl leading-8 text-white/70">
              Do primeiro atendimento à documentação e ao financiamento,
              conte com uma orientação próxima, transparente e sem promessas
              irreais.
            </p>

          </div>

          <div className="rounded-3xl border border-white/15 bg-white/5 p-7">

            <p className="subtitle text-3xl">
              Converse com a Rosa
            </p>

            <p className="mt-3 text-sm leading-7 text-white/70">
              Conte onde deseja morar e em que fase está.
              O primeiro passo é uma conversa simples.
            </p>

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="btn mt-6 bg-rose text-white"
            >
              Iniciar conversa
            </a>

          </div>

        </div>

      </section>

    </PublicShell>
  );
}
