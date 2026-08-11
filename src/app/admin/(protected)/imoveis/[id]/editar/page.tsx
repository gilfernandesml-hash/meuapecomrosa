import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPropertyForm } from "@/components/admin-property-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProperty } from "../../actions";

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; criado?: string; existente?: string; erro?: string }>;
}) {
  const [{ id }, feedback] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [propertyResult, featuresResult, coverResult, floorplanResult] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle(),
    supabase.from("property_features").select("name").eq("property_id", id).order("sort_order"),
    supabase.from("property_images").select("public_url").eq("property_id", id).eq("is_cover", true).limit(1).maybeSingle(),
    supabase.from("property_floorplans").select("public_url").eq("property_id", id).order("sort_order").limit(1).maybeSingle(),
  ]);

  const property = propertyResult.data;
  if (propertyResult.error || !property) notFound();

  const values = {
    ...property,
    keywords: Array.isArray(property.keywords) ? property.keywords.join(", ") : "",
    features: (featuresResult.data ?? []).map((feature) => feature.name).join("\n"),
    cover_image_url: coverResult.data?.public_url ?? "",
    floorplan_url: floorplanResult.data?.public_url ?? "",
  };

  return <>
    <Link href="/admin/imoveis" className="inline-flex items-center gap-2 text-sm font-bold text-petroleo hover:text-rose"><ArrowLeft size={17} /> Voltar para imóveis</Link>
    <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">Edição do imóvel</p>
        <h1 className="display mt-2 text-4xl font-bold text-petroleo sm:text-5xl">{property.name}</h1>
        <p className="mt-2 text-sm text-grafite/60">{property.code}</p>
      </div>
      <Link href={`/imoveis/${property.slug}`} target="_blank" className="btn btn-secondary"><ExternalLink size={17} /> Ver no site</Link>
    </div>

    {feedback.criado ? <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Imóvel cadastrado com sucesso. Complete ou revise as informações abaixo.</p> : null}
    {feedback.existente ? <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">Este imóvel já estava cadastrado. Para evitar cópias, abrimos o registro existente para você revisar ou atualizar.</p> : null}
    {feedback.salvo ? <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Alterações salvas e atualizadas no site.</p> : null}
    {feedback.erro ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível salvar. Confira os dados e tente novamente.</p> : null}

    <AdminPropertyForm action={updateProperty} values={values} mode="edit" />
  </>;
}
