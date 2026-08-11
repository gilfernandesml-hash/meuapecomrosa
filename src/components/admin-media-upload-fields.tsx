"use client";

import { FileImage, ImagePlus, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type MediaAsset = {
  path: string;
  publicUrl: string;
  name: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const photoPattern = /\.(?:jpe?g|png|webp|avif)$/i;
const floorplanPattern = /\.(?:jpe?g|png|webp|avif|pdf)$/i;

function safeFileName(name: string) {
  const extension = name.includes(".") ? `.${name.split(".").pop()!.toLowerCase()}` : "";
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "arquivo";
  return `${base.slice(0, 70)}${extension}`;
}

function inferredContentType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", pdf: "application/pdf" } as Record<string, string>)[extension ?? ""];
}

export function AdminMediaUploadFields({
  propertyId,
  existingPhotos = [],
  existingFloorplans = [],
}: {
  propertyId?: string;
  existingPhotos?: string[];
  existingFloorplans?: string[];
}) {
  const sessionId = useRef("");
  const [uploadedCover, setUploadedCover] = useState<MediaAsset | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<MediaAsset[]>([]);
  const [uploadedFloorplans, setUploadedFloorplans] = useState<MediaAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function uploadFiles(kind: "cover" | "photos" | "floorplans", selected: FileList | null) {
    const files = Array.from(selected ?? []);
    if (!files.length) return;

    const pattern = kind === "floorplans" ? floorplanPattern : photoPattern;
    const invalid = files.find((file) => !pattern.test(file.name) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      setError(`${invalid.name}: use JPG, PNG, WEBP ou AVIF com até 10 MB${kind === "floorplans" ? ", ou PDF" : ""}.`);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("O armazenamento de arquivos não está configurado.");
      return;
    }

    const bucket = kind === "floorplans" ? "property-floorplans" : "property-images";
    if (!sessionId.current) sessionId.current = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const folder = propertyId ? `imoveis/${propertyId}` : `novos/${sessionId.current}`;
    const completed: MediaAsset[] = [];
    setBusy(true);
    setError("");
    window.dispatchEvent(new CustomEvent("admin-media-uploading", { detail: true }));

    try {
      for (const [index, file] of files.entries()) {
        setProgress(`Enviando ${index + 1} de ${files.length}: ${file.name}`);
        const path = `${folder}/${kind}/${Date.now()}-${index}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          contentType: inferredContentType(file),
          upsert: false,
        });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        completed.push({ path, publicUrl: data.publicUrl, name: file.name });
      }

      if (kind === "cover") setUploadedCover(completed[0]);
      if (kind === "photos") setUploadedPhotos((current) => [...current, ...completed]);
      if (kind === "floorplans") setUploadedFloorplans((current) => [...current, ...completed]);
      setProgress(`${completed.length} ${completed.length === 1 ? "arquivo enviado" : "arquivos enviados"}. Agora salve o imóvel.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar os arquivos.");
      setProgress("");
    } finally {
      setBusy(false);
      window.dispatchEvent(new CustomEvent("admin-media-uploading", { detail: false }));
    }
  }

  return <>
    <section id="fotos" className="card scroll-mt-6 grid gap-6 p-6 sm:p-8">
      <div><p className="eyebrow">Etapa 5</p><h2 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-petroleo"><ImagePlus size={24} /> Fotos do imóvel</h2><p className="mt-2 text-sm leading-6 text-grafite/60">Envie a capa separadamente e, depois, selecione quantas fotos desejar para a galeria.</p></div>
      {existingPhotos.length ? <p className="rounded-2xl bg-creme/70 px-4 py-3 text-sm font-semibold text-petroleo">{existingPhotos.length} {existingPhotos.length === 1 ? "foto já cadastrada" : "fotos já cadastradas"}. Os novos arquivos serão acrescentados.</p> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="rounded-2xl border border-dashed border-petroleo/25 bg-white p-5 text-sm font-bold text-petroleo">Foto principal (capa)<span className="mt-1 block text-xs font-normal text-grafite/55">Escolha uma imagem JPG, PNG, WEBP ou AVIF.</span><input className="mt-4 block w-full text-xs font-medium" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => void uploadFiles("cover", event.currentTarget.files)} /></label>
        <label className="rounded-2xl border border-dashed border-petroleo/25 bg-white p-5 text-sm font-bold text-petroleo">Galeria de fotos<span className="mt-1 block text-xs font-normal text-grafite/55">Você pode selecionar várias fotos de uma vez.</span><input className="mt-4 block w-full text-xs font-medium" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy} onChange={(event) => void uploadFiles("photos", event.currentTarget.files)} /></label>
      </div>
      <label className="label">Ou cole a URL de uma nova foto principal<input className="field" name="cover_image_url" type="url" placeholder="https://..." /></label>
      {uploadedCover ? <p className="text-sm font-semibold text-emerald-700">Capa enviada: {uploadedCover.name}</p> : null}
      {uploadedPhotos.length ? <p className="text-sm font-semibold text-emerald-700">Galeria: {uploadedPhotos.length} {uploadedPhotos.length === 1 ? "foto enviada" : "fotos enviadas"}.</p> : null}
      {uploadedCover ? <input type="hidden" name="uploaded_cover" value={JSON.stringify(uploadedCover)} /> : null}
      {uploadedPhotos.map((asset) => <input key={asset.path} type="hidden" name="uploaded_photos" value={JSON.stringify(asset)} />)}
    </section>

    <section id="plantas" className="card scroll-mt-6 grid gap-6 p-6 sm:p-8">
      <div><p className="eyebrow">Etapa 6</p><h2 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-petroleo"><FileImage size={24} /> Plantas do imóvel</h2><p className="mt-2 text-sm leading-6 text-grafite/60">As plantas ficam em uma galeria própria, separada das fotos do empreendimento.</p></div>
      {existingFloorplans.length ? <p className="rounded-2xl bg-creme/70 px-4 py-3 text-sm font-semibold text-petroleo">{existingFloorplans.length} {existingFloorplans.length === 1 ? "planta já cadastrada" : "plantas já cadastradas"}. Os novos arquivos serão acrescentados.</p> : null}
      <label className="rounded-2xl border border-dashed border-petroleo/25 bg-white p-5 text-sm font-bold text-petroleo">Arquivos das plantas<span className="mt-1 block text-xs font-normal text-grafite/55">Selecione imagens ou PDFs, com até 10 MB por arquivo.</span><input className="mt-4 block w-full text-xs font-medium" type="file" accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" multiple disabled={busy} onChange={(event) => void uploadFiles("floorplans", event.currentTarget.files)} /></label>
      <label className="label">Ou cole a URL de uma nova planta<input className="field" name="floorplan_url" type="url" placeholder="https://..." /></label>
      {uploadedFloorplans.length ? <p className="text-sm font-semibold text-emerald-700">{uploadedFloorplans.length} {uploadedFloorplans.length === 1 ? "planta enviada" : "plantas enviadas"}.</p> : null}
      {uploadedFloorplans.map((asset) => <input key={asset.path} type="hidden" name="uploaded_floorplans" value={JSON.stringify(asset)} />)}
    </section>

    {busy || progress ? <div className="sticky bottom-4 z-30 flex items-center gap-3 rounded-2xl bg-petroleo px-5 py-4 text-sm font-semibold text-white shadow-xl">{busy ? <LoaderCircle className="animate-spin" size={20} /> : <Upload size={20} />}{progress}</div> : null}
    {error ? <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p> : null}
  </>;
}
