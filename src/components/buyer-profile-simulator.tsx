"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, MessageCircle } from "lucide-react";
import { bedroomLabels, profileDisclaimer } from "@/lib/leads/domain";
import { emptyProfile, profilePayload, simulatorSteps, stepError, type BuyerProfile, type SimulatorStep } from "@/lib/leads/simulator";
import { submitLead, type LeadReceipt } from "@/lib/leads/client";
import { simulatorMessage, type PropertyContact } from "@/lib/leads/whatsapp";
import { whatsappUrl } from "@/lib/site";
import { trackEvent } from "@/lib/tracking/client";

const titles:Record<SimulatorStep,string>={income:"Qual é sua renda familiar mensal aproximada?",fgts:"Você possui FGTS?",fgts_amount:"Quanto você possui aproximadamente de FGTS?",down_payment:"Quanto você tem disponível para entrada?",purchase_mode:"Como você pretende comprar?",bedrooms:"Qual tipo de apartamento procura?",region:"Em qual região você gostaria de morar?",contact:"Como a Rosa pode falar com você?"};

export function BuyerProfileSimulator({regions,property,origin}:{regions:string[];property?:PropertyContact;origin?:string}) {
  const [profile,setProfile]=useState<BuyerProfile>({...emptyProfile});
  const [started,setStarted]=useState(false),[index,setIndex]=useState(0),[error,setError]=useState(""),[sending,setSending]=useState(false);
  const [receipt,setReceipt]=useState<LeadReceipt|null>(null);
  const simulatorId=useRef(""),requestId=useRef("");const titleRef=useRef<HTMLHeadingElement>(null);
  const steps=simulatorSteps(profile),step=steps[index];
  const update=<K extends keyof BuyerProfile>(key:K,value:BuyerProfile[K])=>{setProfile(current=>({...current,[key]:value}));setError("");};
  function focusTitle(){requestAnimationFrame(()=>titleRef.current?.focus());}
  function start(){simulatorId.current=crypto.randomUUID();requestId.current=crypto.randomUUID();setStarted(true);focusTitle();void trackEvent("simulator_started",{property_id:property?.id,property_slug:property?.slug,metadata:{simulator_id:simulatorId.current}});}
  async function next(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(sending)return;
    const message=stepError(step,profile,regions);if(message){setError(message);return;}
    void trackEvent("simulator_step_completed",{property_id:property?.id,property_slug:property?.slug,metadata:{simulator_id:simulatorId.current,step}});
    if(step!=="contact"){setIndex(index+1);focusTitle();return;}
    setSending(true);setError("");
    try{
      const result=await submitLead({...profilePayload(profile),request_id:requestId.current,simulator_id:simulatorId.current,
        property_id:property?.id,property_slug:property?.slug,page_path:origin??window.location.pathname,
        website:String(new FormData(event.currentTarget).get("website")??"")});
      setReceipt(result);focusTitle();
    }catch(cause){setError(cause instanceof Error && cause.name!=="TimeoutError"?cause.message:"Não foi possível confirmar o envio. Tente novamente; seu perfil continua preenchido.");}
    finally{setSending(false);}
  }
  const choice=(name:string,value:string,label:string,checked:boolean,onChange:()=>void)=><label key={value} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition ${checked?"border-petroleo bg-petroleo/5 text-petroleo":"border-petroleo/15 bg-white text-grafite"}`}><input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="size-4 accent-petroleo"/>{label}</label>;
  const amountInput=(key:"income"|"fgts_amount"|"down_payment",hint:string)=><label className="label"><span className="text-sm text-grafite/65">{hint}</span><span className="relative"><span className="absolute left-4 top-4 text-grafite/60">R$</span><input aria-label={titles[step]} className="field min-h-16 pl-12 text-xl" inputMode="decimal" autoComplete="off" maxLength={18} placeholder="0,00" value={profile[key]} onChange={e=>update(key,e.target.value)}/></span></label>;
  return <div className="card mx-auto max-w-3xl p-6 sm:p-10" data-clarity-mask="true">
    <p className="eyebrow">Seu próximo passo, com a Rosa</p>
    {!started ? <>
      <h2 className="subtitle mt-3 text-3xl leading-tight text-petroleo sm:text-4xl">Descubra o que você pode comprar</h2>
      <p className="mt-5 leading-7 text-grafite/70">Conte um pouco sobre sua renda, entrada e o apartamento que procura. Uma pergunta por vez, no seu ritmo.</p>
      {property && <p className="mt-4 text-sm font-semibold text-petroleo">Seu interesse: {property.name}</p>}
      <button type="button" onClick={start} className="btn btn-primary mt-7 w-full sm:w-auto">Simular meu primeiro apê <ArrowRight size={18}/></button>
      <p className="fine-print mt-5">É um perfil para atendimento humano, sem consulta de crédito ou pedido de documentos.</p>
    </> : receipt ? <>
      <div className="mt-5 flex items-center gap-3 text-petroleo"><Check size={26}/><h2 ref={titleRef} tabIndex={-1} className="subtitle text-3xl">Seu perfil foi recebido.</h2></div>
      <p className="mt-5 leading-7 text-grafite/70">A Rosa pode analisar os imóveis disponíveis que mais combinam com essas informações.</p>
      <p className="mt-4 text-sm leading-6 text-grafite/70">Continue no WhatsApp para conversar diretamente com ela. A mensagem já vai com o resumo do seu perfil.</p>
      <a href={whatsappUrl(simulatorMessage(profile,property,origin))} target="_blank" rel="noreferrer" data-tracking-manual="true"
        onClick={()=>void trackEvent("whatsapp_click",{token:receipt.tracking_token,property_id:property?.id,property_slug:property?.slug,metadata:{placement:"simulator",simulator_id:simulatorId.current}})}
        className="btn mt-7 w-full bg-whatsapp text-center text-sm text-petroleo"><MessageCircle size={20} className="shrink-0"/> Receber minhas opções no WhatsApp</a>
      <p className="fine-print mt-6">{profileDisclaimer}</p>
      <button type="button" className="mt-5 min-h-12 text-sm font-bold text-petroleo underline" onClick={()=>{setProfile({...emptyProfile});setReceipt(null);setStarted(false);setIndex(0);}}>Fazer outro perfil</button>
    </> : <>
      <div className="mt-5 flex justify-between text-xs font-bold text-petroleo"><span>Seu perfil de compra</span><span>{index+1} de {steps.length}</span></div>
      <progress aria-label="Progresso do perfil" value={index+1} max={steps.length} className="mt-3 h-2 w-full accent-petroleo"/>
      <h2 ref={titleRef} tabIndex={-1} className="subtitle mt-6 text-2xl leading-tight text-petroleo sm:text-3xl">{titles[step]}</h2>
      <form onSubmit={next} className="mt-6 grid gap-4" aria-busy={sending}>
        {step==="income" && amountInput("income","Considere a renda total de quem participará da compra.")}
        {step==="fgts" && <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">Possui FGTS</legend>{[true,false].map(value=>choice("fgts",String(value),value?"Sim":"Não",profile.has_fgts===value,()=>update("has_fgts",value)))}</fieldset>}
        {step==="fgts_amount" && amountInput("fgts_amount","Uma estimativa é suficiente. Não envie extratos.")}
        {step==="down_payment" && amountInput("down_payment","Sem contar o FGTS informado. Se ainda não tiver entrada, use 0.")}
        {step==="purchase_mode" && <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">Forma de compra</legend>{choice("purchase","alone","Sozinho",profile.purchase_mode==="alone",()=>update("purchase_mode","alone"))}{choice("purchase","joint","Compondo renda",profile.purchase_mode==="joint",()=>update("purchase_mode","joint"))}</fieldset>}
        {step==="bedrooms" && <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">Tipo de apartamento</legend>{(["studio","1","2","3+"] as const).map(value=>choice("bedrooms",value,bedroomLabels[value],profile.bedrooms===value,()=>update("bedrooms",value)))}</fieldset>}
        {step==="region" && <label className="label">Região desejada<select className="field min-h-14" value={profile.region} onChange={e=>update("region",e.target.value)}><option value="">Escolha uma opção</option>{regions.map(region=><option key={region}>{region}</option>)}<option>Quero orientação sobre a região</option></select></label>}
        {step==="contact" && <>
          <p className="text-sm leading-6 text-grafite/65">Falta só combinar o contato. O e-mail é opcional.</p>
          <label className="label">Nome<input className="field" required maxLength={120} autoComplete="name" value={profile.name} onChange={e=>update("name",e.target.value)}/></label>
          <label className="label">WhatsApp com DDD<input className="field" required maxLength={40} inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" value={profile.phone} onChange={e=>update("phone",e.target.value)}/></label>
          <label className="label">E-mail (opcional)<input className="field" type="email" maxLength={160} autoComplete="email" value={profile.email} onChange={e=>update("email",e.target.value)}/></label>
          <label className="flex items-start gap-3 py-3 text-xs leading-6 text-grafite/75"><input type="checkbox" required checked={profile.consent} onChange={e=>update("consent",e.target.checked)} className="mt-1 size-4 shrink-0 accent-petroleo"/><span>Autorizo a Rosa a entrar em contato sobre meu perfil e imóveis. Li a <Link className="underline" href="/politica-de-privacidade">Política de Privacidade</Link>.</span></label>
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true"/>
        </>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-3">{index>0 && <button type="button" disabled={sending} className="btn btn-secondary text-sm" onClick={()=>{setIndex(index-1);setError("");focusTitle();}}><ArrowLeft size={16}/> Voltar</button>}<button disabled={sending} className="btn btn-primary flex-1 text-sm disabled:opacity-60">{sending?"Salvando seu perfil...":step==="contact"?"Concluir meu perfil":"Continuar"}{!sending && <ArrowRight size={17}/>}</button></div>
        {error && step==="contact" && <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="min-h-12 text-center text-sm font-bold text-petroleo underline">Prefiro falar diretamente com a Rosa</a>}
      </form>
      <p className="fine-print mt-6">{profileDisclaimer}</p>
    </>}
  </div>;
}
