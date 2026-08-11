"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useFormStatus } from "react-dom";

export function AdminSubmitButtons({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  if (mode === "edit") {
    return <button type="submit" disabled={pending} className="btn btn-primary disabled:cursor-wait disabled:opacity-65">
      {pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
      {pending ? "Salvando alterações..." : "Salvar alterações"}
    </button>;
  }

  return <>
    <button type="submit" name="intent" value="draft" disabled={pending} className="btn btn-secondary disabled:cursor-wait disabled:opacity-65">
      {pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
      {pending ? "Salvando..." : "Salvar rascunho"}
    </button>
    <button type="submit" name="intent" value="available" disabled={pending} className="btn btn-primary disabled:cursor-wait disabled:opacity-65">
      {pending ? <LoaderCircle className="animate-spin" size={18} /> : null}
      {pending ? "Publicando..." : "Cadastrar e publicar"}
    </button>
    <span className="w-full text-right text-xs font-semibold text-grafite/55" aria-live="polite">
      {pending ? "Aguarde a confirmação. Não é necessário clicar novamente." : ""}
    </span>
  </>;
}
