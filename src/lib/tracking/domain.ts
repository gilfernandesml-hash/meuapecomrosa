import { z } from "zod";
import { attributionSchema, cleanAttribution, safePath, safeReferrer, type Attribution } from "../leads/domain";

export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const VISITOR_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
export const eventNames = ["page_view", "property_view", "property_view_30s", "property_view_repeat", "simulator_started", "simulator_step_completed", "simulator_completed", "whatsapp_click", "contact_form_started", "contact_form_completed", "lead_created"] as const;
export type EventName = typeof eventNames[number];
export type Consent = { analytics: boolean; marketing: boolean };
export const consentSchema = z.object({ analytics: z.boolean(), marketing: z.boolean() });
export const sessionSchema = z.object({ visitor_id: z.uuid(), session_id: z.uuid(), attribution: attributionSchema,
  device_type: z.enum(["mobile", "tablet", "desktop"]), consent: consentSchema });
export const stepNames = ["income", "fgts", "fgts_amount", "down_payment", "purchase_mode", "bedrooms", "region", "contact"] as const;
export const eventSchema = z.object({
  event_id: z.uuid(), event_name: z.enum(eventNames), tracking_token: z.string().max(2000),
  property_id: z.uuid().optional(), property_slug: z.string().max(150).optional(), page_path: z.string().max(250),
  metadata: z.object({ view_id: z.uuid().optional(), simulator_id: z.uuid().optional(), form_id: z.uuid().optional(),
    step: z.enum(stepNames).optional(), active_seconds: z.number().min(30).max(3600).optional(),
    placement: z.enum(["card", "property", "float", "header", "content", "simulator", "contact"]).optional(),
  }).strict().default({}),
}).strict().superRefine((v, ctx) => {
  if (["lead_created", "simulator_completed", "contact_form_completed"].includes(v.event_name)) ctx.addIssue({ code: "custom", message: "Server-owned event" });
  if (["page_view", "property_view", "property_view_30s", "property_view_repeat", "whatsapp_click"].includes(v.event_name) && !v.metadata.view_id) ctx.addIssue({ code: "custom", message: "Missing navigation" });
  if (v.event_name.startsWith("property_") && !v.property_id && !v.property_slug) ctx.addIssue({ code: "custom", message: "Missing property" });
  if (v.event_name === "property_view_30s" && !v.metadata.active_seconds) ctx.addIssue({ code: "custom", message: "Missing engagement" });
  if (v.event_name.startsWith("simulator_") && !v.metadata.simulator_id) ctx.addIssue({ code: "custom", message: "Missing simulation" });
  if (v.event_name === "simulator_step_completed" && !v.metadata.step) ctx.addIssue({ code: "custom", message: "Missing step" });
  if (v.event_name === "contact_form_started" && !v.metadata.form_id) ctx.addIssue({ code: "custom", message: "Missing form" });
});
export type EventMetadata = z.infer<typeof eventSchema>["metadata"];
export const behavioralEvent = (name: EventName) => name === "page_view" || name.startsWith("property_");

export function attributionFromUrl(url: string, referrer = ""): Attribution {
  const parsed = new URL(url);
  const fields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  return cleanAttribution({ landing_page: safePath(parsed.pathname), referrer: safeReferrer(referrer),
    ...Object.fromEntries(fields.map((key) => [key, parsed.searchParams.get(key)?.trim().slice(0, 120) || undefined])) });
}
export type Visitor = { id: string; created_at: number };
export type Session = { visitor_id: string; session_id: string; last_seen_at: number; attribution: Attribution };
export function nextIdentity(visitor: Visitor | null, session: Session | null, url: string, referrer: string, now: number, uuid: () => string) {
  const validId = (v?: string) => z.uuid().safeParse(v).success;
  const nextVisitor = visitor && validId(visitor.id) && now - visitor.created_at < VISITOR_MAX_AGE_MS && now >= visitor.created_at ? visitor : { id: uuid(), created_at: now };
  const sameSession = session && validId(session.session_id) && session.visitor_id === nextVisitor.id && now - session.last_seen_at < SESSION_IDLE_MS && now >= session.last_seen_at;
  return { visitor: nextVisitor, session: sameSession ? { ...session, last_seen_at: now } : {
    visitor_id: nextVisitor.id, session_id: uuid(), last_seen_at: now, attribution: attributionFromUrl(url, referrer),
  } };
}
export function eventDedupeKey(name: EventName, metadata: EventMetadata, property = "") {
  if (name.startsWith("property_")) return `${name}:${property}`;
  if (name === "page_view") return `${name}:${metadata.view_id}`;
  if (name.startsWith("simulator_")) return `${name}:${metadata.simulator_id}:${metadata.step ?? ""}`;
  if (name === "contact_form_started") return `${name}:${metadata.form_id}`;
  return `${name}:${metadata.view_id}:${property}:${metadata.placement ?? "content"}`;
}
