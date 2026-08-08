import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function hasSupabaseEnv() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); }

export async function createSupabaseServerClient() {
  if (!hasSupabaseEnv()) throw new Error("Supabase environment is not configured");
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: (items) => { try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} } },
  });
}
