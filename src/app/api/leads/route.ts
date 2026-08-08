import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

const schema = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().min(8).max(30), email: z.string().email().max(160), region: z.string().max(120).optional(), income_range: z.string().max(60).optional(), purchase_timeline: z.string().max(60).optional(), has_fgts: z.enum(["true", "false", "unknown"]).optional(), has_down_payment: z.enum(["true", "false", "unknown"]).optional(), consent: z.literal("true"), website: z.string().max(0).optional() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null); const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Atendimento temporariamente indisponível" }, { status: 503 });
  const supabase = await createSupabaseServerClient(); const data = parsed.data;
  const { error } = await supabase.from("leads").insert({ name: data.name, phone: data.phone, email: data.email, region: data.region || null, income_range: data.income_range || null, purchase_timeline: data.purchase_timeline || null, has_fgts: data.has_fgts === "unknown" ? null : data.has_fgts === "true", has_down_payment: data.has_down_payment === "unknown" ? null : data.has_down_payment === "true", consent_at: new Date().toISOString(), source: "pre-analysis", status: "new" });
  if (error) return NextResponse.json({ error: "Falha ao salvar" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
