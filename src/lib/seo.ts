import type { Metadata } from "next";
import { site } from "@/lib/site";

export const editorialUpdatedAt = "2026-09-03T12:00:00-03:00";
export const organizationId = `${site.url}/#organizacao`;
export const personId = `${site.url}/#rosa-oliveira`;
export const websiteId = `${site.url}/#website`;

export function robotsMetadata(index = true): Metadata["robots"] {
  const allowed = index && process.env.VERCEL_ENV !== "preview";
  return {
    index: allowed, follow: true,
    googleBot: { index: allowed, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  };
}

export function pageMetadata({ title, description, path, image = "/og.webp", index = true }: {
  title: string; description: string; path: string; image?: string; index?: boolean;
}): Metadata {
  const url = new URL(path, site.url).href;
  return {
    title, description, alternates: { canonical: url }, robots: robotsMetadata(index),
    openGraph: { title, description, url, siteName: site.name, locale: "pt_BR", type: "website", images: [{ url: image, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: new URL(item.path, site.url).href })),
  };
}

export function collectionSchema(name: string, path: string, items: { name: string; path: string }[]) {
  const url = new URL(path, site.url).href;
  return {
    "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${url}#pagina`, url, name, inLanguage: "pt-BR",
    isPartOf: { "@id": websiteId }, publisher: { "@id": organizationId },
    mainEntity: {
      "@type": "ItemList", numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: new URL(item.path, site.url).href })),
    },
  };
}

export const identitySchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization", "@id": organizationId, name: site.name, url: site.url,
      description: "Atendimento imobiliário com Rosa Oliveira para a compra do primeiro imóvel na Zona Sul de São Paulo.",
      logo: `${site.url}/icon`, image: `${site.url}/og.webp`, telephone: `+${site.whatsapp}`, email: site.email,
      founder: { "@id": personId }, areaServed: { "@type": "Place", name: site.serviceArea },
      sameAs: [`https://www.instagram.com/${site.instagram}/`],
      contactPoint: { "@type": "ContactPoint", telephone: `+${site.whatsapp}`, contactType: "Atendimento imobiliário", availableLanguage: "Portuguese" },
    },
    {
      "@type": "Person", "@id": personId, name: site.professionalName, jobTitle: "Corretora de imóveis",
      url: `${site.url}/sobre-a-rosa`, image: `${site.url}/rosa-oliveira-oficial.webp`,
      description: `Corretora desde 2015. ${site.creci}. Atendimento na ${site.serviceArea}.`,
      worksFor: { "@id": organizationId }, sameAs: [`https://www.instagram.com/${site.instagram}/`],
    },
    { "@type": "WebSite", "@id": websiteId, url: site.url, name: site.name, inLanguage: "pt-BR", publisher: { "@id": organizationId } },
  ],
};
