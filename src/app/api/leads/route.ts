import { createHmac } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { leadSchema, safePath } from "@/lib/leads/domain";
import { enforceRateLimit, publicError, PublicApiError, rateKey, readPublicJson } from "@/lib/leads/http";
import { leadSession, resolveProperty } from "@/lib/tracking/server";
import { captureLead } from "@/lib/leads/capture";

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
    data.page_path = safePath(data.page_path);
    data.origin_page = safePath(data.origin_page ?? data.page_path);
    const result = await captureLead(client, data, propertyId, context);
    return Response.json({ ok: true, created: result.created, replayed: result.replayed, tracking_token: context.token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return publicError(error); }
}
