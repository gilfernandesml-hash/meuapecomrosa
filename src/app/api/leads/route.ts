import { createHmac } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { leadSchema, safePath } from "@/lib/leads/domain";
import { enforceRateLimit, publicError, PublicApiError, rateKey, readPublicJson } from "@/lib/leads/http";
import { leadSession, resolveProperty } from "@/lib/tracking/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await readPublicJson(request);
    const client = createSupabaseServiceClient();
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    await enforceRateLimit(client, `leads:${rateKey(request, secret)}`, 10);
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) throw new PublicApiError(400, "Confira os campos e informe nome, WhatsApp com DDD e autorização de contato.");
    const data = parsed.data;
    const phoneKey = createHmac("sha256", secret).update(`phone:${data.phone}`).digest("hex");
    await enforceRateLimit(client, `lead-phone:${phoneKey}`, 5);
    const context = await leadSession(client, data.tracking_token, data.attribution ?? {}, secret);
    const propertyId = await resolveProperty(client, data.property_id, data.property_slug);
    const { tracking_token: _token, website: _honeypot, ...profile } = data;
    void _token; void _honeypot;
    const { data: result, error } = await client.rpc("capture_lead", {
      p_request_id: data.request_id, p_visitor_id: context.visitor_id, p_session_id: context.session_id,
      p_payload: { ...profile, property_id: propertyId, page_path: safePath(data.page_path), attribution: context.attribution, consent: true },
    });
    if (error) throw new PublicApiError(503, "Não foi possível salvar seu perfil. Tente novamente em instantes.");
    return Response.json({ ok: true, created: result.created, replayed: result.replayed, tracking_token: context.token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return publicError(error); }
}
