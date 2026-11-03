import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadInput } from "@/lib/leads/domain";
import { isMissingDatabaseCapability, PublicApiError } from "@/lib/leads/http";

type LeadContext = { visitor_id: string; session_id: string; attribution: LeadInput["attribution"] };
type CaptureResult = { id?: string; created: boolean; replayed: boolean };

function definedEntries(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""));
}

export function legacyLeadRecord(data: LeadInput, propertyId: string | null) {
  return definedEntries({
    name: data.name,
    phone: data.phone,
    email: data.email,
    income_range: data.income_range,
    has_fgts: data.has_fgts,
    fgts_amount: data.fgts_amount,
    has_down_payment: data.has_down_payment,
    down_payment_amount: data.down_payment_amount,
    region: data.region,
    property_id: propertyId,
    source: data.source,
    purchase_timeline: data.purchase_timeline,
    consent_at: new Date().toISOString(),
  });
}

async function captureLegacyLead(client: SupabaseClient, data: LeadInput, propertyId: string | null): Promise<CaptureResult> {
  // A short replay window prevents a browser retry from creating a second contact
  // while production still runs the original leads schema.
  const replayAfter = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data: existing, error: findError } = await client.from("leads").select("id")
    .eq("phone", data.phone).eq("source", data.source).gte("created_at", replayAfter)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (findError) throw new PublicApiError(503, "Não foi possível salvar seu contato. Tente novamente em instantes.");
  if (existing?.id) return { id: existing.id, created: false, replayed: true };

  const { data: saved, error } = await client.from("leads").insert(legacyLeadRecord(data, propertyId)).select("id").single();
  if (error) throw new PublicApiError(503, "Não foi possível salvar seu contato. Tente novamente em instantes.");
  return { id: saved?.id, created: true, replayed: false };
}

export async function captureLead(client: SupabaseClient, data: LeadInput, propertyId: string | null, context: LeadContext): Promise<CaptureResult> {
  const { tracking_token: _token, website: _honeypot, ...profile } = data;
  void _token; void _honeypot;
  const payload = {
    ...profile,
    property_id: propertyId,
    page_path: data.page_path,
    origin_page: data.origin_page ?? data.page_path,
    attribution: context.attribution,
    consent: true,
  };
  const { data: result, error } = await client.rpc("capture_lead", {
    p_request_id: data.request_id,
    p_visitor_id: context.visitor_id,
    p_session_id: context.session_id,
    p_payload: payload,
  });
  if (!error) return result as CaptureResult;
  if (!isMissingDatabaseCapability(error)) throw new PublicApiError(503, "Não foi possível salvar seu perfil. Tente novamente em instantes.");
  return captureLegacyLead(client, data, propertyId);
}
