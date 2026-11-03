import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { cleanAttribution, type Attribution } from "@/lib/leads/domain";
import { signContext, verifyContext, PublicApiError, isMissingDatabaseCapability } from "@/lib/leads/http";

export async function resolveProperty(client: SupabaseClient, id?: string, slug?: string) {
  if (!id && !slug) return null;
  const query = client.from("properties").select("id").eq("status", "available");
  const { data, error } = await (id ? query.eq("id", id) : query.eq("slug", slug!)).maybeSingle();
  if (error) throw new PublicApiError(503, "Não foi possível consultar o imóvel agora.");
  return data?.id ?? null;
}
export async function leadSession(client: SupabaseClient, token: string | undefined, attribution: Attribution, secret: string) {
  const context = verifyContext(token, secret);
  if (context) {
    const { data, error } = await client.from("visitor_sessions").select("session_id,attribution").eq("session_id", context.session_id).eq("visitor_id", context.visitor_id).maybeSingle();
    if (error && !isMissingDatabaseCapability(error)) throw new PublicApiError(503, "Não foi possível concluir agora.");
    if (data) return { ...context, attribution: data.attribution as Attribution, token: token! };
    if (error) return { ...context, attribution: cleanAttribution(attribution), token: token! };
  }
  // Capture can still work if optional tracking bootstrap failed.
  const visitor_id = randomUUID(), session_id = randomUUID();
  const cleaned = cleanAttribution(attribution);
  const { error } = await client.rpc("register_visitor_session", { p_session_id: session_id, p_visitor_id: visitor_id,
    p_attribution: cleaned, p_device_type: "unknown", p_analytics: false, p_marketing: false });
  if (error && !isMissingDatabaseCapability(error)) throw new PublicApiError(503, "Não foi possível concluir agora.");
  return { visitor_id, session_id, attribution: cleaned, token: signContext(visitor_id, session_id, secret) };
}
