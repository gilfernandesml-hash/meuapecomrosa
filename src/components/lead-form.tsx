"use client";

import { FormEvent, useState } from "react";

export function LeadForm() {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending");
    const currentForm = event.currentTarget;
    try {
      const form = new FormData(currentForm);
      const payload = Object.fromEntries(form.entries());
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      setState(response.ok ? "success" : "error");
      if (response.ok) currentForm.reset();
    } catch { setState("error"); }
  }
  return (
    <form onSubmit={submit} className="card grid gap-5 p-6 sm:grid-cols-2 sm:p-8" id="pre-analise">
      <div className="sm:col-span-2"><p className="eyebrow">Pré-análise de perfil</p><h2 className="display mt-2 text-4xl font-bold text-petroleo">Descubra quais imóveis combinam com você.</h2><p className="mt-3 text-sm leading-6 text-grafite/65">Não é aprovação de crédito nem simulação oficial. Rosa usará as informações para orientar o primeiro atendimento.</p></div>
      <label className="label">Nome completo<input required name="name" className="field" autoComplete="name"/></label>
      <label className="label">WhatsApp<input required name="phone" className="field" inputMode="tel" autoComplete="tel"/></label>
      <label className="label">E-mail<input required type="email" name="email" className="field" autoComplete="email"/></label>
      <label className="label">Região desejada<input name="region" className="field" placeholder="Ex.: Campo Limpo"/></label>
      <label className="label">Renda familiar aproximada<select name="income_range" className="field"><option value="">Prefiro conversar</option><option>Até R$ 3 mil</option><option>R$ 3 mil a R$ 5 mil</option><option>R$ 5 mil a R$ 8 mil</option><option>Acima de R$ 8 mil</option></select></label>
      <label className="label">Quando pretende comprar?<select name="purchase_timeline" className="field"><option>O quanto antes</option><option>Nos próximos 3 meses</option><option>Em 6 a 12 meses</option><option>Ainda estou pesquisando</option></select></label>
      <label className="label">Possui FGTS?<select name="has_fgts" className="field"><option value="unknown">Não sei informar</option><option value="true">Sim</option><option value="false">Não</option></select></label>
      <label className="label">Possui valor para entrada?<select name="has_down_payment" className="field"><option value="unknown">Prefiro conversar</option><option value="true">Sim</option><option value="false">Ainda não</option></select></label>
      <label className="sm:col-span-2 flex items-start gap-3 text-xs leading-5 text-grafite/70"><input required type="checkbox" name="consent" value="true" className="mt-1"/>Autorizo o contato de Rosa Oliveira sobre imóveis e declaro que li a Política de Privacidade.</label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true"/>
      <button disabled={state === "sending"} className="btn btn-primary sm:col-span-2">{state === "sending" ? "Enviando..." : "Enviar minha pré-análise"}</button>
      {state === "success" && <p role="status" className="sm:col-span-2 text-sm font-bold text-petroleo">Recebemos seus dados. Rosa entrará em contato.</p>}
      {state === "error" && <p role="alert" className="sm:col-span-2 text-sm font-bold text-rose">Não foi possível enviar agora. Você pode falar diretamente pelo WhatsApp.</p>}
      <p className="fine-print sm:col-span-2">Condições sujeitas à análise e às regras vigentes das instituições responsáveis. Não envie documentos ou dados bancários neste formulário.</p>
    </form>
  );
}
