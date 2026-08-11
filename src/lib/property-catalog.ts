import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import { properties as sourceProperties, type Property } from "@/lib/properties";

type PropertyOverride = {
  source_id: string | null;
  slug: string;
  name: string;
  neighborhood: string | null;
  phase: string | null;
  price: number | string | null;
  price_label: string | null;
  is_mcmv: boolean;
  is_his2: boolean;
  is_hmp: boolean;
  is_r2v: boolean;
  is_nr: boolean;
};

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
      .select("source_id,slug,name,neighborhood,phase,price,price_label,is_mcmv,is_his2,is_hmp,is_r2v,is_nr")
      .eq("status", "available");

    if (error || !data) return sourceProperties;

    const overrides = new Map<string, PropertyOverride>();
    for (const row of data as PropertyOverride[]) {
      if (row.source_id) overrides.set(`source:${row.source_id}`, row);
      overrides.set(`slug:${row.slug}`, row);
    }

    return sourceProperties.flatMap((property) => {
      const override = overrides.get(`source:${property.external_id}`) ?? overrides.get(`slug:${property.slug}`);
      if (!override) return [];

      return [{
        ...property,
        name: override.name || property.name,
        neighborhood: override.neighborhood || property.neighborhood,
        phase: override.phase || property.phase,
        price: override.price === null ? null : Number(override.price),
        price_label: override.price_label || property.price_label,
        mcmv: override.is_mcmv,
        is_his2: override.is_his2,
        is_hmp: override.is_hmp,
        is_r2v: override.is_r2v,
        is_nr: override.is_nr,
      }];
    });
  } catch {
    return sourceProperties;
  }
});
