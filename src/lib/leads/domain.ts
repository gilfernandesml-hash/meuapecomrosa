import { z } from "zod";

export function normalizePhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(digits)) return null;
  if (/^(\d)\1+$/.test(digits.slice(4))) return null;
  return digits;
}

const emptyToUndefined = (value: unknown) => value === "" || value === null ? undefined : value;
const optionalText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const amount = z.preprocess(emptyToUndefined, z.coerce.number().finite().min(0).max(100_000_000).optional());
const optionalBoolean = z.preprocess((v) => v === "true" ? true : v === "false" ? false : v === "unknown" || v === "" ? undefined : v, z.boolean().optional());

export const attributionSchema = z.object({
  landing_page: z.string().max(250).optional(),
  referrer: z.string().max(250).optional(),
  utm_source: optionalText(120), utm_medium: optionalText(120), utm_campaign: optionalText(120),
  utm_content: optionalText(120), utm_term: optionalText(120),
});
export type Attribution = z.infer<typeof attributionSchema>;

export const leadSchema = z.object({
  request_id: z.uuid(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().max(40).transform(normalizePhone).refine((v) => v !== null, "Informe um telefone brasileiro com DDD."),
  email: z.preprocess(emptyToUndefined, z.email().trim().toLowerCase().max(160).optional()),
  income_range: optionalText(60), income_amount: amount,
  has_fgts: optionalBoolean, fgts_amount: amount,
  has_down_payment: optionalBoolean, down_payment_amount: amount, down_payment_range: optionalText(60),
  purchase_mode: z.enum(["alone", "joint"]).optional(),
  bedrooms: z.preprocess((v) => ({ "1 dormitório": "1", "2 dormitórios": "2", "3 dormitórios": "3+" }[String(v)] ?? emptyToUndefined(v)), z.enum(["studio", "1", "2", "3+"]).optional()),
  region: optionalText(120), purchase_timeline: optionalText(60),
  property_id: z.uuid().optional(), property_slug: optionalText(150),
  source: z.enum(["pre-analysis", "contact", "simulator"]).default("contact"),
  page_path: z.string().max(250).default("/contato"),
  origin_page: z.string().max(250).optional(),
  attribution: attributionSchema.optional(),
  tracking_token: z.string().max(2000).optional(),
  simulator_id: z.uuid().optional(),
  consent: z.union([z.literal(true), z.literal("true")]),
  website: z.string().max(0).optional(),
}).superRefine((v, ctx) => {
  if (v.source === "simulator") {
    const missing = !v.simulator_id || !v.income_amount || v.has_fgts === undefined ||
      (v.has_fgts && v.fgts_amount === undefined) || v.down_payment_amount === undefined ||
      !v.purchase_mode || !v.bedrooms || !v.region;
    if (missing) ctx.addIssue({ code: "custom", message: "Complete seu perfil antes de continuar." });
  }
}).transform((v) => ({ ...v,
  fgts_amount: v.has_fgts === false ? 0 : v.fgts_amount,
  has_down_payment: v.down_payment_amount !== undefined ? v.down_payment_amount > 0 : v.has_down_payment,
}));

export type LeadInput = z.infer<typeof leadSchema>;
export const bedroomLabels: Record<string, string> = { studio: "Studio", "1": "1 dormitório", "2": "2 dormitórios", "3+": "3 dormitórios ou mais" };
export const profileDisclaimer = "Esta é uma análise inicial de perfil. Valores, enquadramento, financiamento, subsídios e aprovação dependem das regras vigentes e da análise das instituições responsáveis.";

export function safePath(value: string | undefined, fallback = "/"): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return fallback;
  const path = value.split(/[?#]/)[0].slice(0, 250);
  return /^\/[a-zA-Z0-9/_%.-]*$/.test(path) ? path : fallback;
}

export function safeReferrer(value?: string): string | undefined {
  try { const url = new URL(value ?? ""); return ["https:", "http:"].includes(url.protocol) ? url.origin : undefined; } catch { return undefined; }
}

export function cleanAttribution(value: Attribution = {}): Attribution {
  return { ...value, landing_page: safePath(value.landing_page), referrer: safeReferrer(value.referrer) };
}
