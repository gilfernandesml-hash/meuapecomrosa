import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  if (!url || !key) {
    if (path.startsWith("/admin") && path !== "/admin/login") {
      const target = request.nextUrl.clone(); target.pathname = "/admin/login"; return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (path.startsWith("/admin") && path !== "/admin/login") {
    let authorized = false;
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", user.id).maybeSingle();
      authorized = Boolean(profile?.active && ["admin", "editor"].includes(profile.role));
    }
    if (!authorized) { const target = request.nextUrl.clone(); target.pathname = "/admin/login"; return NextResponse.redirect(target); }
  }
  if (!path.startsWith("/admin") && !path.startsWith("/api") && path !== "/manutencao") {
    const { data } = await supabase.from("site_settings").select("maintenance_mode").eq("id", 1).maybeSingle();
    if (data?.maintenance_mode) { const target = request.nextUrl.clone(); target.pathname = "/manutencao"; return NextResponse.rewrite(target, { status: 503, headers: { "Retry-After": "3600" } }); }
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
