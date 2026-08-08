import type { MetadataRoute } from "next";
import { properties } from "@/lib/properties";
import { site } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap { const routes = ["", "/imoveis", "/minha-casa-minha-vida", "/primeiro-imovel", "/sobre-a-rosa", "/contato", "/politica-de-privacidade", "/termos-de-uso"]; return [...routes.map((path) => ({ url: `${site.url}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : .7 })), ...properties.map((item) => ({ url: `${site.url}/imoveis/${item.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .8 }))]; }
