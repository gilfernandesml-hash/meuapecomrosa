import { normalizePhone, type LeadInput } from "./domain";
import type { stepNames } from "../tracking/domain";

export type SimulatorStep = typeof stepNames[number];
export type BuyerProfile = { income: string; has_fgts?: boolean; fgts_amount: string; down_payment: string; purchase_mode: "" | "alone" | "joint"; bedrooms: "" | "studio" | "1" | "2" | "3+"; region: string; name:string; phone:string; email:string; consent:boolean };
export const emptyProfile: BuyerProfile = { income:"",fgts_amount:"",down_payment:"",purchase_mode:"",bedrooms:"",region:"",name:"",phone:"",email:"",consent:false };
export function parseMoney(value:string): number | undefined {
  const cleaned=value.trim().replace(/^R\$\s*/,"").replace(/\s/g,"");
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(cleaned) && !/^\d+\.\d{1,2}$/.test(cleaned)) return undefined;
  const number=Number(cleaned.includes(",") || /\.\d{3}(?:\.|$)/.test(cleaned) ? cleaned.replace(/\./g,"").replace(",",".") : cleaned);
  return Number.isFinite(number) && number>=0 && number<=100_000_000 ? number : undefined;
}
export function simulatorSteps(profile:BuyerProfile): SimulatorStep[] {
  return ["income","fgts",...(profile.has_fgts===false?[]:["fgts_amount" as const]),"down_payment","purchase_mode","bedrooms","region","contact"];
}
export function stepError(step:SimulatorStep, profile:BuyerProfile, regions: readonly string[]): string | null {
  if(step==="income" && !(Number(parseMoney(profile.income))>0))return "Informe sua renda familiar aproximada.";
  if(step==="fgts" && profile.has_fgts===undefined)return "Escolha se você possui FGTS.";
  if(step==="fgts_amount" && parseMoney(profile.fgts_amount)===undefined)return "Informe o valor aproximado do FGTS.";
  if(step==="down_payment" && parseMoney(profile.down_payment)===undefined)return "Informe a entrada disponível. Se ainda não tiver, use 0.";
  if(step==="purchase_mode" && !profile.purchase_mode)return "Escolha como pretende comprar.";
  if(step==="bedrooms" && !profile.bedrooms)return "Escolha o tipo de apartamento.";
  if(step==="region" && !(regions.includes(profile.region)||profile.region==="Quero orientação sobre a região"))return "Escolha uma região ou peça orientação à Rosa.";
  if(step==="contact") {
    if(profile.name.trim().length<2)return "Informe seu nome.";
    if(!normalizePhone(profile.phone))return "Informe seu WhatsApp com DDD.";
    if(!profile.consent)return "Precisamos da sua autorização para entrar em contato.";
  }
  return null;
}
export function profilePayload(profile:BuyerProfile) {
  return {name:profile.name.trim(),phone:profile.phone,email:profile.email.trim()||undefined,
    income_amount:parseMoney(profile.income),has_fgts:profile.has_fgts,fgts_amount:profile.has_fgts?parseMoney(profile.fgts_amount):0,
    down_payment_amount:parseMoney(profile.down_payment),purchase_mode:profile.purchase_mode||undefined,bedrooms:profile.bedrooms||undefined,
    region:profile.region,consent:profile.consent?true as const:undefined,source:"simulator"} satisfies Partial<LeadInput>;
}
