import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { StructuredData } from "@/components/structured-data";
import { neighborhoods, propertiesInNeighborhood } from "@/lib/neighborhoods";
import { getPublicProperties } from "@/lib/property-catalog";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Imóveis por bairro na Zona Sul de São Paulo", description: "Compare apartamentos e lançamentos por bairro: Horto do Ipê, Campo Limpo, Santo Amaro, Campo Belo e outras regiões. Atendimento com Rosa Oliveira.", path: "/bairros" });

export default async function NeighborhoodsPage() {
  const properties = await getPublicProperties();
  return <PublicShell>
    <StructuredData data={collectionSchema("Imóveis por bairro na Zona Sul", "/bairros", neighborhoods.map((item) => ({ name: item.name, path: `/bairros/${item.slug}` })))} />
    <StructuredData data={breadcrumbSchema([{ name: "Início", path: "/" }, { name: "Bairros", path: "/bairros" }])} />
    <section className="section bg-petroleo text-white"><div className="container-site">
      <p className="eyebrow">Uma escolha que começa pela sua rotina</p>
      <h1 className="display mt-4 max-w-4xl text-5xl font-bold sm:text-6xl">Imóveis por bairro na Zona Sul de São Paulo</h1>
      <p className="mt-6 max-w-3xl leading-8 text-white/75">O bairro faz parte da decisão, mas a escolha também depende do endereço, da planta e do momento da compra. Explore os cadastros por região e compare as opções com orientação de Rosa Oliveira.</p>
    </div></section>
    <section className="section"><div className="container-site grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {neighborhoods.map((item) => {
        const count = propertiesInNeighborhood(properties, item.name).length;
        return <article key={item.slug} className="card p-7"><p className="text-xs font-bold text-rose">{count ? `${count} cadastros no catálogo` : "Orientação sobre a região"}</p><h2 className="subtitle mt-3 text-3xl text-petroleo"><Link href={`/bairros/${item.slug}`}>{item.name}</Link></h2><p className="mt-4 text-sm leading-7 text-grafite/70">{item.summary}</p><Link href={`/bairros/${item.slug}`} className="mt-5 inline-block font-bold text-rose">Conhecer as opções →</Link></article>;
      })}
    </div></section>
  </PublicShell>;
}
