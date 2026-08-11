"use client";

import Image from "next/image";
import { ImagePlus, LoaderCircle, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_BANNER_SIZE = 5 * 1024 * 1024;

function safeFileName(name: string) {
  const extension = name.includes(".") ? `.${name.split(".").pop()!.toLowerCase()}` : "";
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "banner";
  return `${base.slice(0, 70)}${extension}`;
}

export function AdminBannerUpload() {
  const sessionId = useRef("");
  const [storagePath, setStoragePath] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadBanner(file: File | undefined) {
    if (!file) return;
    if (!/\.(?:jpe?g|png|webp)$/i.test(file.name) || file.size > MAX_BANNER_SIZE) {
      setError("Escolha um banner JPG, PNG ou WEBP com até 5 MB.");
      setStoragePath("");
      window.dispatchEvent(new CustomEvent("admin-banner-ready", { detail: false }));
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("O armazenamento de banners não está configurado.");
      return;
    }

    if (!sessionId.current) sessionId.current = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `banners/${sessionId.current}/${Date.now()}-${safeFileName(file.name)}`;
    setUploading(true);
    setError("");
    setStoragePath("");
    window.dispatchEvent(new CustomEvent("admin-banner-ready", { detail: false }));

    const { error: uploadError } = await supabase.storage.from("site-assets").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : file.name.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg"),
      upsert: false,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setStoragePath(path);
    setPublicUrl(data.publicUrl);
    setFileName(file.name);
    setUploading(false);
    window.dispatchEvent(new CustomEvent("admin-banner-ready", { detail: true }));
  }

  return <div className="sm:col-span-2">
    <label className="block rounded-2xl border border-dashed border-petroleo/25 bg-white p-6 text-sm font-bold text-petroleo">
      <span className="flex items-center gap-2 text-lg"><ImagePlus size={22} /> Banner pronto no computador</span>
      <span className="mt-2 block text-xs font-normal leading-5 text-grafite/55">Escolha um arquivo JPG, PNG ou WEBP de até 5 MB. O envio começa automaticamente.</span>
      <input className="mt-5 block w-full text-xs font-medium" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => void uploadBanner(event.currentTarget.files?.[0])} />
    </label>
    {uploading ? <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-petroleo"><LoaderCircle className="animate-spin" size={19} /> Enviando banner...</p> : null}
    {publicUrl ? <div className="mt-5 overflow-hidden rounded-2xl border border-petroleo/10 bg-creme/50 p-3"><Image src={publicUrl} alt="Prévia do banner selecionado" width={1600} height={500} className="h-auto max-h-72 w-full rounded-xl object-contain" /><p className="mt-3 text-xs font-semibold text-emerald-700">Banner enviado: {fileName}</p></div> : null}
    {error ? <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p> : null}
    {storagePath ? <input type="hidden" name="banner_storage_path" value={storagePath} /> : null}
  </div>;
}

export function BannerSubmitButton() {
  const { pending } = useFormStatus();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleReady = (event: Event) => setReady(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("admin-banner-ready", handleReady);
    return () => window.removeEventListener("admin-banner-ready", handleReady);
  }, []);

  return <div className="sm:col-span-2 sm:justify-self-end">
    <button type="submit" disabled={!ready || pending} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-55">
      {pending ? <LoaderCircle className="animate-spin" size={18} /> : ready ? <Save size={18} /> : <Upload size={18} />}
      {pending ? "Salvando banner..." : ready ? "Salvar banner" : "Escolha o banner para continuar"}
    </button>
  </div>;
}
