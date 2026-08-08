"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
export async function login(formData: FormData) {
  if (!hasSupabaseEnv()) redirect("/admin/login?erro=configuracao");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email") || ""), password: String(formData.get("password") || "") });
  if (error) redirect("/admin/login?erro=credenciais");
  redirect("/admin");
}
