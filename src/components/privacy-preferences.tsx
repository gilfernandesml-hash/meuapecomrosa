"use client";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { consentSnapshot, getConsent, saveConsent, serverConsentSnapshot, subscribeConsent } from "@/lib/tracking/client";

export function PrivacyPreferences() {
  const saved=useSyncExternalStore(subscribeConsent,consentSnapshot,serverConsentSnapshot);
  const [opened,setOpened]=useState(false);
  const visible=opened || !saved;
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const data=new FormData(event.currentTarget);
    saveConsent({analytics:data.has("analytics"),marketing:data.has("marketing")});setOpened(false);
  }
  const consent=saved?JSON.parse(saved):{analytics:false,marketing:false};
  return <>
    <div className="bg-petroleo px-5 pb-7 text-center"><button type="button" onClick={()=>setOpened(true)} className="min-h-12 text-xs text-white/75 underline">Preferências de privacidade</button></div>
    {visible && <aside aria-label="Preferências de privacidade" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-h-[80vh] max-w-xl overflow-y-auto rounded-2xl border border-petroleo/15 bg-white p-5 shadow-2xl sm:inset-x-auto sm:left-5 sm:mx-0 sm:p-6">
      <p className="font-bold text-petroleo">Você escolhe como navegar</p>
      <p className="mt-2 text-sm leading-6 text-grafite/75">Usamos registros essenciais para salvar seu perfil e encaminhar seu atendimento. Você decide se permite medições opcionais. <Link href="/politica-de-privacidade" className="underline">Entenda o uso dos dados.</Link></p>
      <form key={saved || "initial"} onSubmit={submit} className="mt-3 grid gap-2">
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="analytics" defaultChecked={consent.analytics} className="size-4 accent-petroleo"/> Estatísticas de navegação e melhoria do site</label>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="marketing" defaultChecked={consent.marketing} className="size-4 accent-petroleo"/> Medição de anúncios</label>
        <div className="mt-2 flex flex-wrap gap-3"><button type="button" className="btn btn-secondary flex-1 text-sm" onClick={()=>{saveConsent({analytics:false,marketing:false});setOpened(false);}}>Só essenciais</button><button type="submit" className="btn btn-primary flex-1 text-sm">Salvar escolhas</button></div>
        {opened && <button type="button" className="min-h-11 text-sm text-petroleo" onClick={()=>{if(!saved)saveConsent(getConsent());setOpened(false);}}>Fechar</button>}
      </form>
    </aside>}
  </>;
}
