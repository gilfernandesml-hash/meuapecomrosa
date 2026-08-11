import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import { money, properties as sourceProperties, type Property } from "@/lib/properties";

type DatabaseImage = { public_url: string | null; is_cover: boolean; sort_order: number };
type DatabaseFloorplan = { public_url: string | null; sort_order: number };
type DatabaseFeature = { name: string; sort_order: number };

type DatabaseProperty = {
  id: string;
  source_id: string | null;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  zipcode: string | null;
  address: string | null;
  number: string | null;
  phase: string | null;
  area_min: number | string | null;
  area_max: number | string | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  bathrooms_min: number | null;
  bathrooms_max: number | null;
  suites_min: number | null;
  suites_max: number | null;
  parking_min: number | null;
  parking_max: number | null;
  price: number | string | null;
  price_label: string | null;
  property_type: string;
  developer: string | null;
  is_mcmv: boolean;
  is_his2: boolean;
  is_hmp: boolean;
  is_r2v: boolean;
  is_nr: boolean;
  fgts_possible: boolean | null;
  source: string;
  source_url: string | null;
  last_synced_at: string | null;
  created_at: string;
  property_images: DatabaseImage[];
  property_floorplans: DatabaseFloorplan[];
  property_features: DatabaseFeature[];
};

function numeric(value: number | string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function areaLabel(minimum: number | null, maximum: number | null) {
  if (minimum !== null && maximum !== null && minimum !== maximum) return `${minimum.toLocaleString("pt-BR")} a ${maximum.toLocaleString("pt-BR")} m²`;
  if (minimum !== null) return `${minimum.toLocaleString("pt-BR")} m²`;
  if (maximum !== null) return `Até ${maximum.toLocaleString("pt-BR")} m²`;
  return "Sob consulta";
}

function normalizedKey(row: DatabaseProperty) {
  return `${row.name}|${row.address ?? ""}|${row.number ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function simpleSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function mediaFrom(row: DatabaseProperty) {
  const photos = [...(row.property_images ?? [])]
    .filter((image) => image.public_url)
    .sort((first, second) => Number(second.is_cover) - Number(first.is_cover) || first.sort_order - second.sort_order)
    .map((image) => image.public_url as string);
  const floorplans = [...(row.property_floorplans ?? [])]
    .filter((floorplan) => floorplan.public_url)
    .sort((first, second) => first.sort_order - second.sort_order)
    .map((floorplan) => floorplan.public_url as string);
  const features = [...(row.property_features ?? [])].sort((first, second) => first.sort_order - second.sort_order).map((feature) => feature.name);
  return { photos, floorplans, features };
}

function databaseProperty(row: DatabaseProperty): Property {
  const areaMin = numeric(row.area_min);
  const areaMax = numeric(row.area_max);
  const price = numeric(row.price);
  const media = mediaFrom(row);
  const publicAddress = [row.address, row.number, row.neighborhood, row.city, row.state].filter(Boolean).join(", ");

  return {
    slug: row.slug,
    code: row.code,
    external_id: row.source_id ?? row.id,
    name: row.name,
    neighborhood: row.neighborhood ?? "São Paulo",
    city: row.city,
    state: row.state,
    zipcode: row.zipcode ?? "",
    address: [row.address, row.number].filter(Boolean).join(", "),
    public_address: publicAddress,
    phase: row.phase ?? "Não informado",
    source_status: row.phase ?? "Disponível",
    area: areaLabel(areaMin, areaMax),
    area_min: areaMin,
    area_max: areaMax,
    bedrooms_min: row.bedrooms_min,
    bedrooms_max: row.bedrooms_max,
    bathrooms_min: row.bathrooms_min,
    bathrooms_max: row.bathrooms_max,
    suites_min: row.suites_min,
    suites_max: row.suites_max,
    parking_min: row.parking_min,
    parking_max: row.parking_max,
    price,
    price_label: row.price_label ?? (price === null ? "Consulte" : `A partir de ${money(price)}`),
    property_type: row.property_type,
    developer: row.developer ?? "",
    mcmv: row.is_mcmv,
    fgts: Boolean(row.fgts_possible),
    description: row.description ?? row.short_description ?? "Consulte detalhes, disponibilidade e condições deste empreendimento.",
    features: media.features,
    is_his2: row.is_his2,
    is_hmp: row.is_hmp,
    is_r2v: row.is_r2v,
    is_nr: row.is_nr,
    photos: media.photos,
    floorplans: media.floorplans,
    source: row.source,
    source_url: row.source_url ?? "",
    source_updated_at: row.last_synced_at,
  };
}

function mergeSourceProperty(source: Property, row: DatabaseProperty): Property {
  const database = databaseProperty(row);
  return {
    ...source,
    ...database,
    external_id: source.external_id,
    photos: database.photos.length ? database.photos : source.photos,
    floorplans: database.floorplans.length ? database.floorplans : source.floorplans,
    features: database.features.length ? database.features : source.features,
    description: row.description ?? source.description,
    source_url: row.source_url ?? source.source_url,
  };
}

export const getPublicProperties = cache(async (): Promise<Property[]> => {
  if (!hasSupabaseEnv()) return sourceProperties;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("properties")
      .select("id,source_id,code,slug,name,description,short_description,neighborhood,city,state,zipcode,address,number,phase,area_min,area_max,bedrooms_min,bedrooms_max,bathrooms_min,bathrooms_max,suites_min,suites_max,parking_min,parking_max,price,price_label,property_type,developer,is_mcmv,is_his2,is_hmp,is_r2v,is_nr,fgts_possible,source,source_url,last_synced_at,created_at,property_images(public_url,is_cover,sort_order),property_floorplans(public_url,sort_order),property_features(name,sort_order)")
      .eq("status", "available");

    if (error || !data) return sourceProperties;
    const rows = data as DatabaseProperty[];
    const bySource = new Map(rows.filter((row) => row.source_id).map((row) => [row.source_id as string, row]));
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    const matchedIds = new Set<string>();

    const merged = sourceProperties.flatMap((property) => {
      const row = bySource.get(property.external_id) ?? bySlug.get(property.slug);
      if (!row) return [];
      matchedIds.add(row.id);
      return [mergeSourceProperty(property, row)];
    });

    const manualByKey = new Map<string, DatabaseProperty>();
    for (const row of rows) {
      if (matchedIds.has(row.id)) continue;
      const key = normalizedKey(row);
      const current = manualByKey.get(key);
      if (!current || (row.slug === simpleSlug(row.name) && current.slug !== simpleSlug(current.name)) || row.created_at < current.created_at) {
        manualByKey.set(key, row);
      }
    }

    return [...merged, ...Array.from(manualByKey.values(), databaseProperty)].sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
  } catch {
    return sourceProperties;
  }
});
