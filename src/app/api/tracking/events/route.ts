import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { safePath } from "@/lib/leads/domain";
import { enforceRateLimit, publicError, PublicApiError, rateKey, readPublicJson, verifyContext } from "@/lib/leads/http";
import { eventDedupeKey, eventSchema } from "@/lib/tracking/domain";
import { resolveProperty } from "@/lib/tracking/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await readPublicJson(request, 4096);
    const client = createSupabaseServiceClient();
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    await enforceRateLimit(client, `events:${rateKey(request, secret)}`, 180);
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) throw new PublicApiError(400, "Evento inválido.");
    const event = parsed.data;
    const context = verifyContext(event.tracking_token, secret);
    if (!context) throw new PublicApiError(403, "Sessão inválida.");
    const property = await resolveProperty(client, event.property_id, event.property_slug);
    const { data, error } = await client.rpc("record_behavior_event", {
      p_id: event.event_id, p_visitor_id: context.visitor_id, p_session_id: context.session_id,
      p_name: event.event_name, p_property_id: property, p_page_path: safePath(event.page_path),
      p_metadata: event.metadata, p_dedupe_key: eventDedupeKey(event.event_name, event.metadata, property ?? event.property_slug),
    });
    if (error) throw new PublicApiError(503, "Evento indisponível.");
    return Response.json({ ok: true, recorded: data === true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return publicError(error); }
}
