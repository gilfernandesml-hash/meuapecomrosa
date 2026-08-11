import catalog from "@/data/orulo-mcmv-zona-sul.json";

export type Property = {
  slug: string; code: string; external_id: string; name: string; neighborhood: string; city: string; state: string;
  zipcode: string; address: string; public_address: string; phase: string; source_status: string;
  area: string; area_min: number | null; area_max: number | null; bedrooms_min: number | null; bedrooms_max: number | null;
  bathrooms_min: number | null; bathrooms_max: number | null; suites_min: number | null; suites_max: number | null;
  parking_min: number | null; parking_max: number | null; price: number | null; price_label: string;
  property_type: string; developer: string; mcmv: boolean; fgts: boolean; description: string; features: string[];
  is_his2?: boolean; is_hmp?: boolean; is_r2v?: boolean; is_nr?: boolean;
  photos: string[]; floorplans: string[]; source: string; source_url: string; source_updated_at: string | null;
};

export const housingClassifications = [
  { value: "r2v", label: "R2V" },
  { value: "his2", label: "HIS 2" },
  { value: "hmp", label: "HMP" },
  { value: "nr", label: "NR" },
] as const;

export type HousingClassification = (typeof housingClassifications)[number]["label"];

export function getHousingClassifications(property: Property): HousingClassification[] {
  const classifications: HousingClassification[] = [];
  const sourceLabel = `${property.name} ${property.slug}`;

  if (property.is_r2v || /\bR2V\b/i.test(sourceLabel)) classifications.push("R2V");
  if (property.is_his2 || /\bHIS[\s-]*2\b/i.test(sourceLabel)) classifications.push("HIS 2");
  if (property.is_hmp || /\bHMP\b/i.test(sourceLabel)) classifications.push("HMP");
  if (property.is_nr || /(?:^|[\s-])NR(?:[\s-]|$)/i.test(sourceLabel)) classifications.push("NR");

  return classifications;
}

export function housingClassificationFromQuery(value: string) {
  return housingClassifications.find((classification) => classification.value === value)?.label;
}

export const catalogUpdatedAt = catalog.generated_at;
export const properties = catalog.properties as Property[];
export const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
