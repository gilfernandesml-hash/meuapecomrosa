import catalog from "@/data/orulo-mcmv-zona-sul.json";

export type Property = {
  slug: string; code: string; external_id: string; name: string; neighborhood: string; city: string; state: string;
  zipcode: string; address: string; public_address: string; phase: string; source_status: string;
  area: string; area_min: number | null; area_max: number | null; bedrooms_min: number | null; bedrooms_max: number | null;
  bathrooms_min: number | null; bathrooms_max: number | null; suites_min: number | null; suites_max: number | null;
  parking_min: number | null; parking_max: number | null; price: number | null; price_label: string;
  property_type: string; developer: string; mcmv: boolean; fgts: boolean; description: string; features: string[];
  photos: string[]; floorplans: string[]; source: string; source_url: string; source_updated_at: string | null;
};

export const catalogUpdatedAt = catalog.generated_at;
export const properties = catalog.properties as Property[];
export const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
