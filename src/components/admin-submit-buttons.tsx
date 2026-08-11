"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function AdminSubmitButtons({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  const [mediaUploading, setMediaUploading] = useState(false);

  useEffect(() => {
    const handleUploadState = (event: Event) => setMediaUploading(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("admin-media-uploading", handleUploadState);
    return () => window.removeEventListener("admin-media-uploading", handleUploadState);
  }, []);

  const disabled = pending || mediaUploading;

  if (mode === "edit") {
    return <button type="submit" disabled={disabled} className="btn btn-primary disabled:cursor-wait disabled:opacity-65">
      {disabled ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
      {mediaUploading ? "Aguardando o upload..." : pending ? "Salvando alterações..." : "Salvar alterações"}
    </button>;
  }

  return <>
    <button type="submit" name="intent" value="draft" disabled={disabled} className="btn btn-secondary disabled:cursor-wait disabled:opacity-65">
      {disabled ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
      {mediaUploading ? "Aguardando o upload..." : pending ? "Salvando..." : "Salvar rascunho"}
    </button>
    <button type="submit" name="intent" value="available" disabled={disabled} className="btn btn-primary disabled:cursor-wait disabled:opacity-65">
      {disabled ? <LoaderCircle className="animate-spin" size={18} /> : null}
      {mediaUploading ? "Aguardando o upload..." : pending ? "Publicando..." : "Cadastrar e publicar"}
    </button>
    <span className="w-full text-right text-xs font-semibold text-grafite/55" aria-live="polite">
      {pending ? "Aguarde a confirmação. Não é necessário clicar novamente." : ""}
    </span>
  </>;
}
