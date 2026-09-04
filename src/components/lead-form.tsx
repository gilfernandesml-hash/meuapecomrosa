"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { submitLead } from "@/lib/leads/client";
import { normalizePhone } from "@/lib/leads/domain";
import { trackEvent } from "@/lib/tracking/client";
import { whatsappUrl } from "@/lib/site";

export function LeadForm({ home = false }: { home?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error,setError]=useState("");
  const requestId=useRef("");
  const formId=useRef("");
  function start() { if(!formId.current)formId.current=crypto.randomUUID(); void trackEvent("contact_form_started",{metadata:{form_id:formId.current}}); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(state==="sending")return;
    setState("sending");setError("");
    const currentForm = event.currentTarget;
    try {
      const payload = Object.fromEntries(new FormData(currentForm).entries());
      if(!normalizePhone(String(payload.phone)))throw new Error("Informe seu WhatsApp com DDD.");
      if(!requestId.current)requestId.current=crypto.randomUUID();
      await submitLead({...payload,request_id:requestId.current,source:"contact"});
      setState("success");currentForm.reset();requestId.current="";formId.current="";
    } catch (cause) {
      setState("error");setError(cause instanceof Error && cause.name!=="TimeoutError" ? cause.message : "Não foi possível confirmar o envio. Tente novamente.");
    }
  }

  return (
    <form onSubmit={submit} onFocus={start} data-clarity-mask="true" className={`card grid gap-5 p-6 sm:grid-cols-2 sm:p-8 ${home ? "lg:grid-cols-3 lg:p-10" : ""}`} id="pre-analise">
      <div className={home ? "sm:col-span-2 lg:col-span-3" : "sm:col-span-2"}>
        <p className="eyebrow">Pré-análise gratuita</p>
        <h2 className="subtitle mt-2 text-4xl text-petroleo sm:text-5xl">Descubra seu perfil de compra em 2 minutos.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-grafite/65">Conte um pouco sobre seu momento. Rosa poderá selecionar opções mais compatíveis com sua renda, entrada, FGTS e região desejada.</p>
      </div>
      <label className="label">Nome completo<input required name="name" className="field" autoComplete="name" /></label>
      <label className="label">WhatsApp<input required name="phone" className="field" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" /></label>
      <label className="label">E-mail (opcional)<input type="email" name="email" className="field" autoComplete="email" /></label>
      <label className="label">Renda familiar<select name="income_range" className="field"><option value="">Prefiro conversar</option><option>Até R$ 3 mil</option><option>R$ 3 mil a R$ 5 mil</option><option>R$ 5 mil a R$ 8 mil</option><option>Acima de R$ 8 mil</option></select></label>
      <label className="label">Possui FGTS?<select name="has_fgts" className="field"><option value="unknown">Não sei informar</option><option value="true">Sim</option><option value="false">Não</option></select></label>
      <label className="label">Valor disponível para entrada<select name="down_payment_range" className="field"><option value="">Prefiro conversar</option><option>Até R$ 10 mil</option><option>R$ 10 mil a R$ 30 mil</option><option>R$ 30 mil a R$ 60 mil</option><option>Acima de R$ 60 mil</option><option>Ainda não tenho entrada</option></select></label>
      <label className="label">Região desejada<input name="region" className="field" placeholder="Ex.: Campo Limpo" /></label>
      <label className="label">Número de dormitórios<select name="bedrooms" className="field"><option value="">Ainda não defini</option><option>1 dormitório</option><option>2 dormitórios</option><option>3 dormitórios</option></select></label>
      <label className="label">Quando pretende comprar?<select name="purchase_timeline" className="field"><option>O quanto antes</option><option>Nos próximos 3 meses</option><option>Em 6 a 12 meses</option><option>Ainda estou pesquisando</option></select></label>
      <label className={`flex items-start gap-3 text-xs leading-5 text-grafite/70 ${home ? "sm:col-span-2 lg:col-span-3" : "sm:col-span-2"}`}><input required type="checkbox" name="consent" value="true" className="mt-1" /><span>Autorizo o contato de Rosa Oliveira sobre imóveis e declaro que li a <Link href="/politica-de-privacidade" className="underline">Política de Privacidade</Link>.</span></label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <button disabled={state === "sending"} className={`btn btn-primary ${home ? "sm:col-span-2 lg:col-span-3" : "sm:col-span-2"}`}>{state === "sending" ? "Enviando..." : "Quero receber minhas opções"}</button>
      <div aria-live="polite" className={home ? "sm:col-span-2 lg:col-span-3" : "sm:col-span-2"}>
        {state === "success" ? <p role="status" className="text-sm font-bold text-petroleo">Recebemos seus dados. Rosa entrará em contato.</p> : null}
        {state === "error" ? <p role="alert" className="text-sm font-bold text-rose">{error} <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="underline">Falar com a Rosa pelo WhatsApp</a></p> : null}
      </div>
      <p className={`fine-print ${home ? "sm:col-span-2 lg:col-span-3" : "sm:col-span-2"}`}>A pré-análise não representa aprovação de crédito. Condições, subsídio e financiamento dependem das regras vigentes e da avaliação das instituições responsáveis. Não envie documentos ou dados bancários neste formulário.</p>
    </form>
  );
}
