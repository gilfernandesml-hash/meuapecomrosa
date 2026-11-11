import { createHmac } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { leadSchema, safePath } from "@/lib/leads/domain";
import { enforceRateLimit, publicError, PublicApiError, rateKey, readPublicJson } from "@/lib/leads/http";
import { leadSession, resolveProperty } from "@/lib/tracking/server";
import { captureLead } from "@/lib/leads/capture";
import { sendLeadNotification, type LeadNotificationData } from "@/lib/leads/notification";
import type { LeadInput } from "@/lib/leads/domain";

export const runtime = "nodejs";

function notificationData(data: LeadInput, property?: { name?: string | null; code?: string | null }): LeadNotificationData {
  return {
    name: data.name,
    phone: data.phone!,
    email: data.email,
    source: data.source,
    pagePath: data.origin_page ?? data.page_path,
    propertyName: property?.name ?? undefined,
    propertyCode: property?.code ?? undefined,
    incomeRange: data.income_range,
    incomeAmount: data.income_amount,
    hasFgts: data.has_fgts,
    fgtsAmount: data.fgts_amount,
    downPaymentRange: data.down_payment_range,
    downPaymentAmount: data.down_payment_amount,
    region: data.region,
    bedrooms: data.bedrooms,
    purchaseMode: data.purchase_mode,
    purchaseTimeline: data.purchase_timeline,
  };
}

async function notifyLead(
  client: ReturnType<typeof createSupabaseServiceClient>,
  data: LeadInput,
  propertyId: string | null,
) {
  try {
    let property: { name?: string | null; code?: string | null } | undefined;
    if (propertyId) {
      const result = await client.from("properties").select("name,code").eq("id", propertyId).maybeSingle();
      if (!result.error) property = result.data ?? undefined;
    }
    await sendLeadNotification(notificationData(data, property));
    return true;
  } catch (error) {
    console.error("[leads] notification failed", {
      errorType: error instanceof Error ? error.name : "unknown_error",
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

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
    data.page_path = safePath(data.page_path);
    data.origin_page = safePath(data.origin_page ?? data.page_path);

    let context: Awaited<ReturnType<typeof leadSession>> | undefined;
    let propertyId: string | null = null;
    try {
      context = await leadSession(client, data.tracking_token, data.attribution ?? {}, secret);
      propertyId = await resolveProperty(client, data.property_id, data.property_slug);
      const result = await captureLead(client, data, propertyId, context);

      // A notificação é auxiliar: o lead já salvo nunca deve virar erro para o visitante.
      if (!result.replayed) await notifyLead(client, data, propertyId);

      return Response.json(
        { ok: true, created: result.created, replayed: result.replayed, tracking_token: context.token },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (persistenceError) {
      // Mesma contingência do gilcorretorsp: se o banco falhar depois da validação
      // e dos limites antiabuso, preserve o contato por e-mail.
      if (await notifyLead(client, data, propertyId)) {
        console.warn("[leads] persistence fallback delivered by email", {
          errorType: persistenceError instanceof Error ? persistenceError.name : "unknown_error",
        });
        return Response.json(
          { ok: true, created: false, replayed: false, fallback: "email", tracking_token: context?.token },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      throw persistenceError;
    }
  } catch (error) { return publicError(error); }
}
