"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.active || !["admin", "editor"].includes(profile.role)) {
    redirect("/admin/login");
  }

  return { supabase, user };
}

async function registerActivity(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
) {
  await supabase.from("admin_activity_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
  });
}

async function availableSlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: "neighborhoods" | "blog_posts",
  requested: string,
) {
  const base = slugify(requested) || `item-${Date.now().toString(36)}`;
  const { data } = await supabase.from(table).select("slug").eq("slug", base).maybeSingle();
  return data ? `${base}-${Date.now().toString(36).slice(-5)}` : base;
}

export async function updateSiteSettings(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const siteName = text(formData, "site_name");
  const email = text(formData, "email");
  if (!siteName || !email) redirect("/admin/configuracoes?erro=dados-obrigatorios");

  const serviceRegions = text(formData, "service_regions")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const { error } = await supabase.from("site_settings").upsert(
    {
      id: 1,
      site_name: siteName,
      slogan: optionalText(formData, "slogan"),
      whatsapp: optionalText(formData, "whatsapp"),
      phone: optionalText(formData, "phone"),
      email,
      creci: optionalText(formData, "creci"),
      instagram: optionalText(formData, "instagram"),
      facebook: optionalText(formData, "facebook"),
      biography: optionalText(formData, "biography"),
      service_regions: serviceRegions,
      address: optionalText(formData, "address"),
      business_hours: optionalText(formData, "business_hours"),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "id" },
  );

  if (error) redirect("/admin/configuracoes?erro=nao-salvo");
  await registerActivity(supabase, user.id, "update", "site_settings", "1");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/", "layout");
  redirect("/admin/configuracoes?salvo=1");
}

export async function updateSeoSettings(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase
    .from("site_settings")
    .update({
      google_analytics_id: optionalText(formData, "google_analytics_id"),
      search_console_code: optionalText(formData, "search_console_code"),
      meta_pixel_id: optionalText(formData, "meta_pixel_id"),
      google_maps_key: optionalText(formData, "google_maps_key"),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", 1);

  if (error) redirect("/admin/seo?erro=nao-salvo");
  await registerActivity(supabase, user.id, "update", "seo_settings", "1");
  updateTag("public-analytics-settings");
  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
  redirect("/admin/seo?salvo=1");
}

export async function toggleMaintenanceMode(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const enabled = text(formData, "enabled") === "true";
  const { error } = await supabase
    .from("site_settings")
    .update({
      maintenance_mode: enabled,
      maintenance_message: optionalText(formData, "maintenance_message"),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", 1);

  if (error) redirect("/admin/status?erro=nao-salvo");
  await registerActivity(supabase, user.id, enabled ? "enable" : "disable", "maintenance_mode", "1");
  revalidatePath("/admin/status");
  revalidatePath("/", "layout");
  redirect("/admin/status?salvo=1");
}

export async function createBanner(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const title = text(formData, "title");
  if (!title) redirect("/admin/banners?erro=titulo-obrigatorio");
  const storagePath = text(formData, "banner_storage_path");
  if (!/^banners\/[a-zA-Z0-9/_.-]+\.(?:jpe?g|png|webp)$/i.test(storagePath) || storagePath.includes("..")) {
    redirect("/admin/banners?erro=imagem-obrigatoria");
  }
  const { data: bannerImage } = supabase.storage.from("site-assets").getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from("promo_banners")
    .insert({
      title,
      subtitle: optionalText(formData, "subtitle"),
      cta_label: optionalText(formData, "cta_label"),
      target_url: optionalText(formData, "target_url"),
      image_path: bannerImage.publicUrl,
      position: text(formData, "position") || "home",
      active: formData.has("active"),
      sort_order: Number(text(formData, "sort_order") || 0),
    })
    .select("id")
    .single();

  if (error) redirect("/admin/banners?erro=nao-salvo");
  await registerActivity(supabase, user.id, "create", "promo_banner", data.id);
  revalidatePath("/admin/banners");
  revalidatePath("/", "layout");
  redirect("/admin/banners?salvo=1");
}

export async function toggleBanner(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) redirect("/admin/banners?erro=item-invalido");
  const active = text(formData, "active") === "true";
  const { error } = await supabase.from("promo_banners").update({ active }).eq("id", id);
  if (error) redirect("/admin/banners?erro=nao-salvo");
  await registerActivity(supabase, user.id, active ? "activate" : "deactivate", "promo_banner", id);
  revalidatePath("/admin/banners");
  revalidatePath("/", "layout");
  redirect("/admin/banners?salvo=1");
}

export async function createNeighborhood(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const name = text(formData, "name");
  if (!name) redirect("/admin/bairros?erro=nome-obrigatorio");
  const slug = await availableSlug(supabase, "neighborhoods", text(formData, "slug") || name);
  const { data, error } = await supabase
    .from("neighborhoods")
    .insert({
      name,
      slug,
      city: text(formData, "city") || "São Paulo",
      state: (text(formData, "state") || "SP").slice(0, 2).toUpperCase(),
      seo_text: optionalText(formData, "seo_text"),
      published: formData.has("published"),
      meta_title: optionalText(formData, "meta_title"),
      meta_description: optionalText(formData, "meta_description"),
    })
    .select("id")
    .single();

  if (error) redirect("/admin/bairros?erro=nao-salvo");
  await registerActivity(supabase, user.id, "create", "neighborhood", data.id);
  revalidatePath("/admin/bairros");
  redirect("/admin/bairros?salvo=1");
}

export async function toggleNeighborhood(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) redirect("/admin/bairros?erro=item-invalido");
  const published = text(formData, "published") === "true";
  const { error } = await supabase.from("neighborhoods").update({ published }).eq("id", id);
  if (error) redirect("/admin/bairros?erro=nao-salvo");
  await registerActivity(supabase, user.id, published ? "publish" : "unpublish", "neighborhood", id);
  revalidatePath("/admin/bairros");
  redirect("/admin/bairros?salvo=1");
}

export async function createBlogPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const title = text(formData, "title");
  if (!title) redirect("/admin/blog?erro=titulo-obrigatorio");
  const slug = await availableSlug(supabase, "blog_posts", text(formData, "slug") || title);
  const status = text(formData, "status") === "published" ? "published" : "draft";
  const contentText = text(formData, "content");
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      excerpt: optionalText(formData, "excerpt"),
      content: { text: contentText },
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      meta_title: optionalText(formData, "meta_title"),
      meta_description: optionalText(formData, "meta_description"),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) redirect("/admin/blog?erro=nao-salvo");
  await registerActivity(supabase, user.id, "create", "blog_post", data.id);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?salvo=1");
}

export async function toggleBlogPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) redirect("/admin/blog?erro=item-invalido");
  const published = text(formData, "published") === "true";
  const { error } = await supabase
    .from("blog_posts")
    .update({ status: published ? "published" : "draft", published_at: published ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) redirect("/admin/blog?erro=nao-salvo");
  await registerActivity(supabase, user.id, published ? "publish" : "unpublish", "blog_post", id);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?salvo=1");
}
