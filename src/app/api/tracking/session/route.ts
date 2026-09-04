import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { cleanAttribution } from "@/lib/leads/domain";
import { enforceRateLimit, publicError, PublicApiError, rateKey, readPublicJson, signContext } from "@/lib/leads/http";
import { sessionSchema } from "@/lib/tracking/domain";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await readPublicJson(request, 4096);
    const client = createSupabaseServiceClient();
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    await enforceRateLimit(client, `sessions:${rateKey(request, secret)}`, 60);
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) throw new PublicApiError(400, "Sessão inválida.");
    const { visitor_id, session_id, attribution, device_type, consent } = parsed.data;
    const { error } = await client.rpc("register_visitor_session", { p_session_id: session_id, p_visitor_id: visitor_id,
      p_attribution: cleanAttribution(attribution), p_device_type: device_type, p_analytics: consent.analytics, p_marketing: consent.marketing });
    if (error) throw new PublicApiError(503, "Sessão indisponível.");
    return Response.json({ token: signContext(visitor_id, session_id, secret) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return publicError(error); }
}
