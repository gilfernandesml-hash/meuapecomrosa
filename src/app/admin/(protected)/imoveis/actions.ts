"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

function optionalNumber(formData: FormData, name: string) {
  const raw = text(formData, name);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function optionalSignedNumber(formData: FormData, name: string) {
  const raw = text(formData, name);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role,active").eq("id", user.id).maybeSingle();
  if (!profile?.active || !["admin", "editor"].includes(profile.role)) redirect("/admin/login");
  return { supabase, user };
}

async function propertySlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  requested: string,
  propertyId?: string,
) {
  const base = slugify(requested) || `imovel-${Date.now().toString(36)}`;
  let query = supabase.from("properties").select("id").eq("slug", base);
  if (propertyId) query = query.neq("id", propertyId);
  const { data } = await query.maybeSingle();
  return data ? `${base}-${Date.now().toString(36).slice(-5)}` : base;
}

function propertyValues(formData: FormData) {
  const keywords = text(formData, "keywords").split(",").map((item) => item.trim()).filter(Boolean);
  return {
    name: text(formData, "name"),
    full_name: optionalText(formData, "full_name"),
    description: optionalText(formData, "description"),
    short_description: optionalText(formData, "short_description"),
    property_type: text(formData, "property_type") || "apartment",
    phase: optionalText(formData, "phase"),
    purpose: text(formData, "purpose") || "sale",
    builder: optionalText(formData, "builder"),
    developer: optionalText(formData, "developer"),
    address: optionalText(formData, "address"),
    number: optionalText(formData, "number"),
    neighborhood: optionalText(formData, "neighborhood"),
    city: text(formData, "city") || "São Paulo",
    state: (text(formData, "state") || "SP").slice(0, 2).toUpperCase(),
    zipcode: optionalText(formData, "zipcode"),
    latitude: optionalSignedNumber(formData, "latitude"),
    longitude: optionalSignedNumber(formData, "longitude"),
    area_min: optionalNumber(formData, "area_min"),
    area_max: optionalNumber(formData, "area_max"),
    bedrooms_min: optionalNumber(formData, "bedrooms_min"),
    bedrooms_max: optionalNumber(formData, "bedrooms_max"),
    suites_min: optionalNumber(formData, "suites_min"),
    suites_max: optionalNumber(formData, "suites_max"),
    bathrooms_min: optionalNumber(formData, "bathrooms_min"),
    bathrooms_max: optionalNumber(formData, "bathrooms_max"),
    parking_min: optionalNumber(formData, "parking_min"),
    parking_max: optionalNumber(formData, "parking_max"),
    price: optionalNumber(formData, "price"),
    promotional_price: optionalNumber(formData, "promotional_price"),
    price_label: optionalText(formData, "price_label"),
    condominium: optionalNumber(formData, "condominium"),
    iptu: optionalNumber(formData, "iptu"),
    featured: formData.has("featured"),
    is_mcmv: formData.has("is_mcmv"),
    is_r2v: formData.has("is_r2v"),
    is_his2: formData.has("is_his2"),
    is_hmp: formData.has("is_hmp"),
    is_nr: formData.has("is_nr"),
    fgts_possible: formData.has("fgts_possible"),
    source_url: optionalText(formData, "source_url"),
    meta_title: optionalText(formData, "meta_title"),
    meta_description: optionalText(formData, "meta_description"),
    keywords,
    indexable: formData.has("indexable"),
  };
}

function featureNames(formData: FormData) {
  return text(formData, "features").split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
}

async function saveRelatedContent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  propertyId: string,
  propertyName: string,
  formData: FormData,
  replaceFeatures = false,
) {
  const features = featureNames(formData);
  if (replaceFeatures) await supabase.from("property_features").delete().eq("property_id", propertyId);
  if (features.length) {
    await supabase.from("property_features").insert(features.map((name, index) => ({ property_id: propertyId, name, sort_order: index })));
  }

  const coverImageUrl = text(formData, "cover_image_url");
  if (coverImageUrl) {
    if (replaceFeatures) await supabase.from("property_images").delete().eq("property_id", propertyId).eq("is_cover", true);
    await supabase.from("property_images").insert({ property_id: propertyId, storage_path: `external/${propertyId}/cover`, public_url: coverImageUrl, alt_text: `Foto de ${propertyName}`, is_cover: true });
  }

  const floorplanUrl = text(formData, "floorplan_url");
  if (floorplanUrl) {
    if (replaceFeatures) await supabase.from("property_floorplans").delete().eq("property_id", propertyId);
    await supabase.from("property_floorplans").insert({ property_id: propertyId, storage_path: `external/${propertyId}/planta`, public_url: floorplanUrl, name: "Planta principal", alt_text: `Planta de ${propertyName}` });
  }
}

export async function createProperty(formData: FormData) {
  const values = propertyValues(formData);
  if (!values.name) redirect("/admin/imoveis/novo?erro=nome-obrigatorio");

  const { supabase, user } = await requireAdmin();
  const slug = await propertySlug(supabase, text(formData, "slug") || values.name);
  const status = text(formData, "intent") === "available" ? "available" : "draft";
  const { data, error } = await supabase
    .from("properties")
    .insert({ ...values, slug, status, source: "manual", created_by: user.id, updated_by: user.id })
    .select("id,slug")
    .single();

  if (error) redirect("/admin/imoveis/novo?erro=nao-salvo");
  await saveRelatedContent(supabase, data.id, values.name, formData);
  await supabase.from("admin_activity_logs").insert({ user_id: user.id, action: "create", entity_type: "property", entity_id: data.id });

  revalidatePath("/admin/imoveis");
  revalidatePath("/");
  revalidatePath("/imoveis");
  revalidatePath(`/imoveis/${data.slug}`);
  redirect(`/admin/imoveis/${data.id}/editar?criado=1`);
}

export async function updatePropertyClassifications(formData: FormData) {
  const propertyId = String(formData.get("property_id") ?? "");
  if (!propertyId) redirect("/admin/imoveis?erro=imovel-invalido");

  const { supabase, user } = await requireAdmin();

  const { data: property } = await supabase.from("properties").select("slug").eq("id", propertyId).maybeSingle();
  const { error } = await supabase
    .from("properties")
    .update({
      is_r2v: formData.has("is_r2v"),
      is_his2: formData.has("is_his2"),
      is_hmp: formData.has("is_hmp"),
      is_nr: formData.has("is_nr"),
      updated_by: user.id,
    })
    .eq("id", propertyId);

  if (error) redirect("/admin/imoveis?erro=classificacao-nao-salva");

  revalidatePath("/admin/imoveis");
  revalidatePath("/");
  revalidatePath("/imoveis");
  if (property?.slug) revalidatePath(`/imoveis/${property.slug}`);
  redirect("/admin/imoveis?salvo=classificacao");
}

export async function updateProperty(formData: FormData) {
  const propertyId = String(formData.get("property_id") ?? "");
  const values = propertyValues(formData);
  if (!propertyId || !values.name) redirect("/admin/imoveis?erro=imovel-invalido");

  const { supabase, user } = await requireAdmin();
  const slug = await propertySlug(supabase, text(formData, "slug") || values.name, propertyId);

  const { data, error } = await supabase
    .from("properties")
    .update({
      ...values,
      slug,
      status: text(formData, "status") || "draft",
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", propertyId)
    .select("slug")
    .single();

  if (error) redirect(`/admin/imoveis/${propertyId}/editar?erro=nao-salvo`);

  await saveRelatedContent(supabase, propertyId, values.name, formData, true);
  await supabase.from("admin_activity_logs").insert({ user_id: user.id, action: "update", entity_type: "property", entity_id: propertyId });

  revalidatePath("/admin/imoveis");
  revalidatePath(`/admin/imoveis/${propertyId}/editar`);
  revalidatePath("/");
  revalidatePath("/imoveis");
  if (data.slug) revalidatePath(`/imoveis/${data.slug}`);
  redirect(`/admin/imoveis/${propertyId}/editar?salvo=1`);
}
