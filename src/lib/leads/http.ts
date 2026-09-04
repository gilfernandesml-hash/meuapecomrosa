import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export class PublicApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readPublicJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  // Next may use the internal hostname in Request.url. Match the browser's Host,
  // never an arbitrary forwarded host supplied by a client.
  const target=new URL(request.url);
  const expectedOrigin=`${target.protocol}//${request.headers.get("host")??target.host}`;
  if (request.headers.get("origin") !== expectedOrigin) throw new PublicApiError(403, "Origem não permitida.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new PublicApiError(415, "Formato inválido.");
  if (Number(request.headers.get("content-length")) > maxBytes) throw new PublicApiError(413, "Envio muito grande.");
  const reader = request.body?.getReader();
  if (!reader) throw new PublicApiError(400, "Dados inválidos.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new PublicApiError(413, "Envio muito grande."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new PublicApiError(400, "Dados inválidos."); }
}

function signature(value: string, secret: string) { return createHmac("sha256", secret).update(value).digest("base64url"); }
export function signContext(visitorId: string, sessionId: string, secret: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ visitor_id: visitorId, session_id: sessionId, expires: now + 86_400_000 })).toString("base64url");
  return `${body}.${signature(`tracking:${body}`, secret)}`;
}
export function verifyContext(token: string | undefined, secret: string, now = Date.now()): { visitor_id: string; session_id: string } | null {
  try {
    const [body, signed, extra] = (token ?? "").split(".");
    if (!body || !signed || extra) return null;
    const expected = Buffer.from(signature(`tracking:${body}`, secret));
    const actual = Buffer.from(signed);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const value = JSON.parse(Buffer.from(body, "base64url").toString());
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return value.expires > now && uuid.test(value.visitor_id) && uuid.test(value.session_id) ? value : null;
  } catch { return null; }
}

export function rateKey(request: Request, secret: string) {
  // Vercel owns this header. Other hosts must configure a trusted proxy before using an IP header.
  const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown" : "local-or-unconfigured-proxy";
  return signature(`rate:${new Date().toISOString().slice(0, 10)}:${ip}`, secret);
}

export async function enforceRateLimit(client: SupabaseClient, key: string, limit: number, seconds = 600) {
  const { data, error } = await client.rpc("consume_public_rate_limit", { p_key: key, p_limit: limit, p_seconds: seconds });
  if (error) throw new PublicApiError(503, "Atendimento temporariamente indisponível. Tente novamente em instantes.");
  if (data !== true) throw new PublicApiError(429, "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
}

export function publicError(error: unknown): Response {
  const known = error instanceof PublicApiError;
  return Response.json({ error: known ? error.message : "Não foi possível concluir agora. Tente novamente em instantes." }, {
    status: known ? error.status : 503,
    headers: { "Cache-Control": "no-store", ...(known && error.status === 429 ? { "Retry-After": "600" } : {}) },
  });
}
