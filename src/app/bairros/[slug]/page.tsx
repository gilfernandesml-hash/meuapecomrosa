import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { PropertyCard } from "@/components/property-card";
import { StructuredData } from "@/components/structured-data";
import { neighborhoods, propertiesInNeighborhood } from "@/lib/neighborhoods";
import { getPublicProperties } from "@/lib/property-catalog";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";
import { whatsappUrl } from "@/lib/site";

export function generateStaticParams() { return neighborhoods.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: PageProps<"/bairros/[slug]">) {
  const { slug } = await params;
  const neighborhood = neighborhoods.find((item) => item.slug === slug);
  if (!neighborhood) notFound();
  return pageMetadata({ title: `Imóveis à venda em ${neighborhood.name}, São Paulo`, description: neighborhood.summary, path: `/bairros/${slug}` });
}

export default async function NeighborhoodPage({ params }: PageProps<"/bairros/[slug]">) {
  const { slug } = await params;
  const neighborhood = neighborhoods.find((item) => item.slug === slug);
  if (!neighborhood) notFound();
  const all = await getPublicProperties();
  const properties = propertiesInNeighborhood(all, neighborhood.name);
  const commercial = properties.filter((item) => item.property_type === "commercial");
  const apartments = properties.filter((item) => item.property_type !== "commercial");
  const message = `Olá, Rosa! Estou pesquisando imóveis em ${neighborhood.name} pelo Meu Apê com Rosa e gostaria de comparar as opções.`;
  return <PublicShell>
    <StructuredData data={collectionSchema(`Imóveis em ${neighborhood.name}`, `/bairros/${slug}`, properties.map((item) => ({ name: item.name, path: `/imoveis/${item.slug}` })))} />
    <StructuredData data={breadcrumbSchema([{ name: "Início", path: "/" }, { name: "Bairros", path: "/bairros" }, { name: neighborhood.name, path: `/bairros/${slug}` }])} />
    <section className="section bg-petroleo text-white"><div className="container-site">
      <nav aria-label="Navegação estrutural" className="mb-8 text-sm text-white/70"><Link href="/">Início</Link> / <Link href="/bairros">Bairros</Link> / {neighborhood.name}</nav>
      <p className="eyebrow">Zona Sul de São Paulo</p>
      <h1 className="display mt-4 max-w-4xl text-5xl font-bold sm:text-6xl">Imóveis à venda em {neighborhood.name}</h1>
      <p className="mt-6 max-w-3xl leading-8 text-white/75">{neighborhood.summary}</p>
      <a className="btn btn-primary mt-7" href={whatsappUrl(message)} target="_blank" rel="noreferrer">Receber orientação da Rosa</a>
    </div></section>
    <section className="section"><div className="container-site grid gap-8 lg:grid-cols-2">
      <article><h2 className="subtitle text-3xl text-petroleo">O que observar nesta seleção</h2><p className="mt-5 leading-8 text-grafite/75">{neighborhood.focus}</p></article>
      <article className="card p-7"><h2 className="subtitle text-3xl text-petroleo">Antes de escolher a unidade</h2><p className="mt-5 leading-8 text-grafite/75">{neighborhood.checklist}</p></article>
    </div></section>
    <section className="pb-16"><div className="container-site">
      <h2 className="subtitle text-4xl text-petroleo">Apartamentos em {neighborhood.name}</h2>
      <p className="mt-3 text-sm leading-7 text-grafite/65">As finalidades residencial e NR são identificadas nos cadastros. Preços a partir de dependem da unidade e da disponibilidade; confirme a condição atual com a Rosa.</p>
      {apartments.length ? <div className="property-grid mt-8">{apartments.map((item) => <PropertyCard key={item.slug} property={item} />)}</div> : <p className="card mt-7 p-7">No momento, não há apartamentos ativos neste bairro no catálogo. Fale com a Rosa para avaliar opções de acordo com sua região de interesse.</p>}
      {commercial.length > 0 && <><h2 className="subtitle mt-12 text-3xl text-petroleo">Lojas e imóveis comerciais</h2><p className="mt-3 text-sm text-grafite/65">Estas ofertas têm finalidade comercial e não são apresentadas como moradia.</p><div className="property-grid mt-7">{commercial.map((item) => <PropertyCard key={item.slug} property={item} />)}</div></>}
    </div></section>
    <section className="section bg-creme"><div className="container-site max-w-4xl">
      <h2 className="subtitle text-3xl text-petroleo">Perguntas para organizar sua compra</h2>
      <h3 className="mt-7 text-lg font-bold text-petroleo">Como saber qual planta atende à minha família?</h3><p className="mt-3 leading-7 text-grafite/75">Abra as plantas dos empreendimentos e compare área privativa, dormitórios e banheiros. Informe à Rosa quais ambientes são indispensáveis para que ela confirme as unidades compatíveis.</p>
      <h3 className="mt-7 text-lg font-bold text-petroleo">Todo imóvel desta região aceita Minha Casa Minha Vida?</h3><p className="mt-3 leading-7 text-grafite/75">Não. O bairro não define o enquadramento. É necessário verificar a unidade, o empreendimento, o perfil do comprador e as regras da instituição financeira. Consulte o <Link className="font-bold text-rose underline" href="/minha-casa-minha-vida">guia Minha Casa Minha Vida</Link>.</p>
      <h3 className="mt-7 text-lg font-bold text-petroleo">Como agendar uma visita?</h3><p className="mt-3 leading-7 text-grafite/75">Escolha os empreendimentos de interesse e entre em contato com a Rosa. Ela confirma disponibilidade e endereço completo e combina uma visita acompanhada.</p>
      <nav aria-label="Continue sua pesquisa" className="mt-8 flex flex-wrap gap-5 font-bold text-rose"><Link href="/bairros">Comparar outros bairros</Link><Link href="/primeiro-imovel">Planejar o primeiro imóvel</Link><Link href="/imoveis">Ver todo o catálogo</Link></nav>
    </div></section>
  </PublicShell>;
}
