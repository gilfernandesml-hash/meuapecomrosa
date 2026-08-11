"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updatePropertyClassifications(formData: FormData) {
  const propertyId = String(formData.get("property_id") ?? "");
  if (!propertyId) redirect("/admin/imoveis?erro=imovel-invalido");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

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
  const name = String(formData.get("name") ?? "").trim();
  if (!propertyId || !name) redirect("/admin/imoveis?erro=imovel-invalido");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const priceInput = String(formData.get("price") ?? "").trim();
  const price = priceInput ? Number(priceInput) : null;
  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    redirect(`/admin/imoveis/${propertyId}/editar?erro=valor-invalido`);
  }

  const { data, error } = await supabase
    .from("properties")
    .update({
      name,
      neighborhood: String(formData.get("neighborhood") ?? "").trim() || null,
      phase: String(formData.get("phase") ?? "").trim() || null,
      price,
      price_label: String(formData.get("price_label") ?? "").trim() || null,
      status: String(formData.get("status") ?? "draft"),
      is_mcmv: formData.has("is_mcmv"),
      is_r2v: formData.has("is_r2v"),
      is_his2: formData.has("is_his2"),
      is_hmp: formData.has("is_hmp"),
      is_nr: formData.has("is_nr"),
      updated_by: user.id,
    })
    .eq("id", propertyId)
    .select("slug")
    .single();

  if (error) redirect(`/admin/imoveis/${propertyId}/editar?erro=nao-salvo`);

  revalidatePath("/admin/imoveis");
  revalidatePath(`/admin/imoveis/${propertyId}/editar`);
  revalidatePath("/");
  revalidatePath("/imoveis");
  if (data.slug) revalidatePath(`/imoveis/${data.slug}`);
  redirect(`/admin/imoveis/${propertyId}/editar?salvo=1`);
}
