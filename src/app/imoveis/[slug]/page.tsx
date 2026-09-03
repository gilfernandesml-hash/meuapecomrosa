import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, Building2, CalendarDays, Check, MapPin, Maximize2, MessageCircle, Warehouse } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { PropertyGallery } from "@/components/property-gallery";
import { PropertyRichMedia } from "@/components/property-rich-media";
import { PropertyCard } from "@/components/property-card";
import { getPublicProperties } from "@/lib/property-catalog";
import { getHousingClassifications, properties, startingPriceLabel, type Property } from "@/lib/properties";
import { site, whatsappUrl } from "@/lib/site";

export function generateStaticParams() {
  return properties.map(({ slug }) => ({ slug }));
}

function similarityScore(candidate: Property, reference: Property) {
  let score = 0;
  if (candidate.neighborhood === reference.neighborhood) score += 8;
  if (candidate.bedrooms_min === reference.bedrooms_min) score += 4;
  if (candidate.phase === reference.phase) score += 2;
  if (candidate.property_type === reference.property_type) score += 1;
  if (candidate.mcmv === reference.mcmv) score += 1;

  if (candidate.price && reference.price) {
    const difference = Math.abs(candidate.price - reference.price) / reference.price;
    if (difference <= 0.15) score += 5;
    else if (difference <= 0.3) score += 3;
    else if (difference <= 0.5) score += 1;
  }

  return score;
}

function valueRange(minimum: number | null, maximum: number | null, suffix: string) {
  if (minimum !== null && maximum !== null && minimum !== maximum) return `${minimum} a ${maximum} ${suffix}`;
  if (minimum !== null) return `${minimum} ${suffix}`;
  if (maximum !== null) return `Até ${maximum} ${suffix}`;
  return "Sob consulta";
}

function sourceDate(value: string | null | undefined) {
  if (!value) return undefined;
  const brazilian = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brazilian) return `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function generateMetadata({ params }: PageProps<"/imoveis/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const publicProperties = await getPublicProperties();
  const item = publicProperties.find((property) => property.slug === slug);
  if (!item) return {};
  const title = item.seo_title ?? `${item.name} em ${item.neighborhood}: preços e plantas`;
  const description = item.seo_description ?? item.short_description ?? item.description.slice(0, 158);
  const canonical = `/imoveis/${slug}`;
  const images = item.photos.slice(0, 4).map((url, index) => ({
    url,
    alt: `${item.name} — ${item.photo_media?.[index]?.description || `imagem ${index + 1}`}`,
  }));
  return {
    title,
    description,
    keywords: item.keywords,
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: canonical,
      siteName: site.name,
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images: item.photos[0] ? [item.photos[0]] : [] },
  };
}

export default async function PropertyPage({ params }: PageProps<"/imoveis/[slug]">) {
  const { slug } = await params;
  const publicProperties = await getPublicProperties();
  const item = publicProperties.find((property) => property.slug === slug);
  if (!item) notFound();
  const classifications = getHousingClassifications(item);
  const similarProperties = publicProperties
    .filter((property) => property.slug !== item.slug)
    .sort((first, second) => {
      const scoreDifference = similarityScore(second, item) - similarityScore(first, item);
      if (scoreDifference !== 0) return scoreDifference;
      return first.name.localeCompare(second.name, "pt-BR");
    })
    .slice(0, 3);
  const message = `Olá, Rosa! Vi o empreendimento ${item.name} (${item.code}) no site Meu Apê com Rosa e gostaria de mais informações.`;
  const canonicalUrl = `${site.url}/imoveis/${item.slug}`;
  const residenceId = `${canonicalUrl}#empreendimento`;
  const hasCoordinates = Number.isFinite(item.latitude) && Number.isFinite(item.longitude);
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}&z=15&output=embed`
    : null;
  const videos = item.videos ?? [];
  const virtualTours = item.virtual_tours ?? [];
  const updatedAt = sourceDate(item.source_updated_at);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": `${canonicalUrl}#anuncio`,
        url: canonicalUrl,
        name: item.name,
        headline: item.seo_title ?? `${item.name} em ${item.neighborhood}`,
        description: item.description,
        image: item.photos,
        mainEntity: { "@id": residenceId },
        about: { "@id": residenceId },
        ...(updatedAt ? { dateModified: updatedAt } : {}),
        ...(item.price ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: item.price,
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
            itemOffered: { "@id": residenceId },
            description: "Valor a partir de. Disponibilidade e condições sujeitas a confirmação.",
          },
        } : {}),
        provider: {
          "@type": "RealEstateAgent",
          name: site.professionalName,
          url: site.url,
          telephone: site.phoneDisplay,
          email: site.email,
        },
      },
      {
        "@type": item.property_type === "commercial" ? "Place" : "ApartmentComplex",
        "@id": residenceId,
        name: item.name,
        description: item.short_description ?? item.description,
        address: {
          "@type": "PostalAddress",
          streetAddress: item.address,
          addressLocality: item.city,
          addressRegion: item.state,
          postalCode: item.zipcode,
          addressCountry: "BR",
        },
        ...(hasCoordinates ? { geo: { "@type": "GeoCoordinates", latitude: item.latitude, longitude: item.longitude } } : {}),
        amenityFeature: item.features.map((feature) => ({ "@type": "LocationFeatureSpecification", name: feature, value: true })),
        numberOfBedrooms: item.bedrooms_min ?? undefined,
        floorSize: item.area_min ? { "@type": "QuantitativeValue", minValue: item.area_min, maxValue: item.area_max ?? item.area_min, unitCode: "MTK" } : undefined,
      },
      ...videos.map((video, index) => ({
        "@type": "VideoObject",
        "@id": `${canonicalUrl}#video-${index + 1}`,
        name: video.description || `Vídeo de ${item.name}`,
        description: video.description || `Vídeo do empreendimento ${item.name}`,
        contentUrl: video.url,
        embedUrl: video.url,
        thumbnailUrl: item.photos[0],
      })),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: site.url },
          { "@type": "ListItem", position: 2, name: "Imóveis", item: `${site.url}/imoveis` },
          { "@type": "ListItem", position: 3, name: item.name, item: canonicalUrl },
        ],
      },
    ],
  };

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="container-site py-8">
        <nav className="text-xs text-grafite/55" aria-label="Navegação estrutural"><Link href="/">Início</Link> / <Link href="/imoveis">Imóveis</Link> / {item.name}</nav>
        <div className="mt-6">
          <PropertyGallery name={item.name} photos={item.photos} floorplans={item.floorplans} photoMedia={item.photo_media} floorplanMedia={item.floorplan_media} />
        </div>
      </section>
      <section className="pb-20">
        <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <article>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-rose px-4 py-2 text-xs font-bold text-white">Plano & Plano</span>
              {item.mcmv ? <span className="rounded-full bg-rose/15 px-4 py-2 text-xs font-bold text-rose">Minha Casa Minha Vida</span> : null}
              <span className="rounded-full bg-champagne/20 px-4 py-2 text-xs font-bold text-petroleo">{item.phase}</span>
              {classifications.map((classification) => <span key={classification} className="rounded-full bg-petroleo px-4 py-2 text-xs font-bold text-white">{classification}</span>)}
            </div>
            <h1 className="display mt-5 text-5xl font-bold text-petroleo">{item.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-grafite/65"><MapPin size={17} />{item.public_address}</p>
            <div className="my-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="card p-4"><Maximize2 className="text-rose" /><strong className="mt-2 block text-petroleo">{item.area}</strong><span className="text-xs">Área privativa</span></div>
              <div className="card p-4"><BedDouble className="text-rose" /><strong className="mt-2 block text-petroleo">{valueRange(item.bedrooms_min, item.bedrooms_max, "dorm.")}</strong><span className="text-xs">Dormitórios</span></div>
              <div className="card p-4"><Bath className="text-rose" /><strong className="mt-2 block text-petroleo">{valueRange(item.bathrooms_min, item.bathrooms_max, "banh.")}</strong><span className="text-xs">Banheiros</span></div>
              <div className="card p-4"><Building2 className="text-rose" /><strong className="mt-2 block text-petroleo">{item.source_status}</strong><span className="text-xs">Status informado</span></div>
            </div>

            <h2 className="display text-3xl font-bold text-petroleo">Sobre o empreendimento</h2>
            <div className="mt-4 space-y-4 leading-8 text-grafite/75">
              {item.description.split(/\n\s*\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>

            <section className="mt-10">
              <h2 className="display text-3xl font-bold text-petroleo">Ficha técnica</h2>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="card flex items-center gap-4 p-5"><Building2 className="text-rose" /><div><dt className="text-xs font-bold uppercase tracking-wider text-grafite/50">Incorporadora</dt><dd className="mt-1 font-bold text-petroleo">{item.developer || "Plano & Plano"}</dd></div></div>
                <div className="card flex items-center gap-4 p-5"><Warehouse className="text-rose" /><div><dt className="text-xs font-bold uppercase tracking-wider text-grafite/50">Finalidade</dt><dd className="mt-1 font-bold text-petroleo">{item.finality ?? "Residencial"}</dd></div></div>
                <div className="card flex items-center gap-4 p-5"><CalendarDays className="text-rose" /><div><dt className="text-xs font-bold uppercase tracking-wider text-grafite/50">Previsão informada</dt><dd className="mt-1 font-bold text-petroleo">{item.opening_date ?? "Sob consulta"}</dd></div></div>
                <div className="card flex items-center gap-4 p-5"><MapPin className="text-rose" /><div><dt className="text-xs font-bold uppercase tracking-wider text-grafite/50">Região</dt><dd className="mt-1 font-bold text-petroleo">{item.neighborhood}, Zona Sul</dd></div></div>
              </dl>
            </section>

            {item.features.length ? <section className="mt-10"><h2 className="display text-3xl font-bold text-petroleo">Diferenciais</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{item.features.map((feature) => <li key={feature} className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-rose/15 text-rose"><Check size={15} /></span>{feature}</li>)}</ul></section> : null}

            <PropertyRichMedia name={item.name} videos={videos} virtualTours={virtualTours} />

            {mapUrl ? (
              <section className="mt-10 border-t border-petroleo/10 pt-9">
                <p className="eyebrow">Localização</p>
                <h2 className="display mt-2 text-3xl font-bold text-petroleo">{item.neighborhood}, Zona Sul de São Paulo</h2>
                <p className="mt-3 text-sm leading-6 text-grafite/65">O mapa usa as coordenadas informadas pela Órulo. O número do endereço fica reservado para o atendimento com Rosa.</p>
                <div className="mt-5 overflow-hidden rounded-3xl border border-petroleo/10 bg-white shadow-sm">
                  <iframe src={mapUrl} title={`Mapa de localização de ${item.name}`} className="h-[390px] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </section>
            ) : null}

            {item.mcmv ? (
              <div className="mt-10 rounded-3xl border border-rose/25 bg-rose/8 p-7"><h2 className="font-serif text-3xl font-bold text-petroleo">Possível enquadramento no Minha Casa Minha Vida</h2><p className="mt-3 text-sm leading-7">A fonte identifica este empreendimento como participante de programa habitacional. Enquadramento, uso do FGTS, crédito, subsídios, valores e demais condições precisam ser confirmados conforme o perfil do comprador e as regras vigentes.</p></div>
            ) : null}
          </article>
          <aside className="lg:pt-5">
            <div className="card sticky top-28 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-rose">Valor indicativo</p>
              <p className="price mt-2 whitespace-nowrap text-3xl text-petroleo">{startingPriceLabel(item)}</p>
              <p className="fine-print mt-2">Consulte disponibilidade e condições atualizadas.</p>
              <a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="btn mt-6 w-full bg-whatsapp text-white"><MessageCircle size={19} /> Falar com Rosa</a>
              <p className="mt-5 text-center text-xs text-grafite/55">Informe o código {item.code} no atendimento.</p>
            </div>
          </aside>
        </div>
      </section>
      <section className="border-t border-petroleo/10 bg-creme py-16 sm:py-20">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Continue pesquisando</p>
              <h2 className="subtitle mt-3 text-4xl text-petroleo sm:text-5xl">Imóveis semelhantes</h2>
              <p className="mt-4 max-w-2xl leading-7 text-grafite/65">Outras opções próximas em localização, faixa de preço, dormitórios e fase da obra.</p>
            </div>
            <Link href="/imoveis" className="font-bold text-rose">Ver catálogo completo →</Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {similarProperties.map((property) => <PropertyCard key={property.slug} property={property} />)}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
