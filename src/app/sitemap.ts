import type { MetadataRoute } from "next";
import { catalogUpdatedAt } from "@/lib/properties";
import { getPublicProperties } from "@/lib/property-catalog";
import { neighborhoods } from "@/lib/neighborhoods";
import { editorialUpdatedAt } from "@/lib/seo";
import { site } from "@/lib/site";

function sourceDate(value: string | null | undefined, fallback: Date) {
  if (!value) return fallback;
  const brazilian = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  const parsed = brazilian ? new Date(`${brazilian[3]}-${brazilian[2]}-${brazilian[1]}T12:00:00-03:00`) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = (await getPublicProperties()).filter((item) => item.indexable !== false);
  const catalogDate = sourceDate(catalogUpdatedAt, new Date("2026-08-08T12:00:00-03:00"));
  const routes = ["", "/imoveis", "/bairros", "/minha-casa-minha-vida", "/primeiro-imovel", "/sobre-a-rosa", "/contato", "/politica-de-privacidade", "/termos-de-uso", ...neighborhoods.map((item) => `/bairros/${item.slug}`)];
  return [
    ...routes.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: new Date(editorialUpdatedAt),
      changeFrequency: path === "" || path === "/imoveis" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 1 : path === "/imoveis" ? .9 : .7,
    })),
    ...properties.map((item) => ({
      url: `${site.url}/imoveis/${item.slug}`,
      lastModified: sourceDate(item.updated_at ?? item.source_updated_at, catalogDate),
      changeFrequency: "weekly" as const,
      priority: .8,
      images: [...item.photos, ...item.floorplans.filter((url) => !/\.pdf(?:$|\?)/i.test(url))],
    })),
  ];
}
