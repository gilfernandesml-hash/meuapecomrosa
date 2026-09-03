import catalog from "@/data/orulo-plano-plano-zona-sul.json";

export type PropertyVideo = { url: string; source: string; description: string };
export type PropertyMedia = { url: string; description: string };
export type PropertyTypology = {
  type: string | null; private_area: number | null; bedrooms: number | null; bathrooms: number | null;
  suites: number | null; parking: number | null; stock: number | null;
};

export type Property = {
  slug: string; code: string; external_id: string; name: string; neighborhood: string; city: string; state: string;
  zipcode: string; address: string; public_address: string; phase: string; source_status: string;
  short_description?: string; seo_title?: string; seo_description?: string; keywords?: string[];
  latitude?: number | null; longitude?: number | null; launch_date?: string | null; opening_date?: string | null;
  area: string; area_min: number | null; area_max: number | null; bedrooms_min: number | null; bedrooms_max: number | null;
  bathrooms_min: number | null; bathrooms_max: number | null; suites_min: number | null; suites_max: number | null;
  parking_min: number | null; parking_max: number | null; price: number | null; price_label: string;
  property_type: string; finality?: string; developer: string; mcmv: boolean; fgts: boolean; description: string; features: string[];
  total_units?: number | null; stock?: number | null; number_of_floors?: number | null; number_of_towers?: number | null;
  typologies?: PropertyTypology[]; photo_media?: PropertyMedia[]; floorplan_media?: PropertyMedia[];
  is_his2?: boolean; is_hmp?: boolean; is_r2v?: boolean; is_nr?: boolean;
  photos: string[]; floorplans: string[]; videos?: PropertyVideo[]; virtual_tours?: string[];
  source: string; source_url: string; developer_url?: string | null; source_updated_at: string | null;
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

export function startingPriceLabel(property: Pick<Property, "price" | "price_label">) {
  const label = property.price_label.trim();
  if (/^a partir de\b/i.test(label)) return label.replace(/^a partir de/i, "A partir de");
  if (property.price !== null && Number.isFinite(property.price)) return `A partir de ${money(property.price)}`;
  if (/^(?:R\$\s*)?\d/i.test(label)) return `A partir de ${label}`;
  return label || "Valor sob consulta";
}
