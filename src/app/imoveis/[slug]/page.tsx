import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, Building2, Check, MapPin, Maximize2, MessageCircle } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { properties } from "@/lib/properties";
import { whatsappUrl } from "@/lib/site";

export function generateStaticParams() { return properties.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: PageProps<"/imoveis/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = properties.find((property) => property.slug === slug);
  if (!item) return {};
  return { title: `${item.name} em ${item.neighborhood}`, description: item.description, alternates: { canonical: `/imoveis/${slug}` }, openGraph: { images: item.photos[0] ? [item.photos[0]] : [] } };
}

export default async function PropertyPage({ params }: PageProps<"/imoveis/[slug]">) {
  const { slug } = await params;
  const item = properties.find((property) => property.slug === slug);
  if (!item) notFound();
  const message = `Olá, Rosa! Vi o empreendimento ${item.name} (${item.code}) no site Meu Apê com Rosa e gostaria de mais informações.`;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Apartment", name: item.name, description: item.description,
    image: item.photos.slice(0, 5),
    address: { "@type": "PostalAddress", streetAddress: item.address, addressLocality: "São Paulo", addressRegion: "SP", postalCode: item.zipcode, addressCountry: "BR" },
    ...(item.price ? { offers: { "@type": "Offer", priceCurrency: "BRL", price: item.price, availability: "https://schema.org/InStock" } } : {}),
  };
  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>
      <section className="container-site py-8">
        <nav className="text-xs text-grafite/55"><Link href="/">Início</Link> / <Link href="/imoveis">Imóveis</Link> / {item.name}</nav>
        <div className="mt-6 grid gap-3 overflow-hidden rounded-[2rem] md:grid-cols-4 md:grid-rows-2">
          {item.photos.slice(0, 5).map((photo, index) => <div key={photo} className={`relative min-h-52 overflow-hidden bg-petroleo ${index === 0 ? "md:col-span-2 md:row-span-2 md:min-h-[470px]" : ""}`}><Image src={photo} alt={`${item.name} — imagem ${index + 1}`} fill priority={index === 0} sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "25vw"} className="object-cover"/></div>)}
        </div>
      </section>
      <section className="pb-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_360px]">
          <article>
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-rose px-4 py-2 text-xs font-bold text-white">Minha Casa Minha Vida</span><span className="rounded-full bg-champagne/20 px-4 py-2 text-xs font-bold text-petroleo">{item.phase}</span></div>
            <h1 className="display mt-5 text-5xl font-bold text-petroleo">{item.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-grafite/65"><MapPin size={17}/>{item.public_address}</p>
            <div className="my-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="card p-4"><Maximize2 className="text-rose"/><strong className="mt-2 block text-petroleo">{item.area}</strong><span className="text-xs">Área</span></div>
              <div className="card p-4"><BedDouble className="text-rose"/><strong className="mt-2 block text-petroleo">{item.bedrooms_min ?? "Sob consulta"}</strong><span className="text-xs">Dormitórios</span></div>
              <div className="card p-4"><Building2 className="text-rose"/><strong className="mt-2 block text-petroleo">{item.source_status}</strong><span className="text-xs">Status Órulo</span></div>
              <div className="card p-4"><MapPin className="text-rose"/><strong className="mt-2 block text-petroleo">Zona Sul</strong><span className="text-xs">Região</span></div>
            </div>
            <h2 className="display text-3xl font-bold text-petroleo">Sobre o empreendimento</h2><p className="mt-4 leading-8 text-grafite/75">{item.description}</p>
            <h2 className="display mt-10 text-3xl font-bold text-petroleo">Diferenciais</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{item.features.map((feature) => <li key={feature} className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-rose/15 text-rose"><Check size={15}/></span>{feature}</li>)}</ul>
            <div className="mt-10 rounded-3xl border border-rose/25 bg-rose/8 p-7"><h2 className="font-serif text-3xl font-bold text-petroleo">Este imóvel foi identificado pela fonte como participante de programa habitacional.</h2><p className="mt-3 text-sm leading-7">O enquadramento no Minha Casa Minha Vida e o possível uso de FGTS precisam ser confirmados. Crédito, subsídios, valores e demais condições estão sujeitos à análise e às regras vigentes das instituições responsáveis.</p></div>
          </article>
          <aside className="lg:pt-5"><div className="card sticky top-28 p-6"><p className="text-xs font-bold uppercase tracking-wider text-rose">Valor indicativo</p><p className="mt-2 font-serif text-3xl font-bold text-petroleo">{item.price_label}</p><p className="fine-print mt-2">Consulte disponibilidade e condições atualizadas.</p><a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="btn mt-6 w-full bg-whatsapp text-white"><MessageCircle size={19}/> Falar com Rosa</a><p className="mt-5 text-center text-xs text-grafite/55">Informe o código {item.code} no atendimento.</p></div></aside>
        </div>
      </section>
    </PublicShell>
  );
}
