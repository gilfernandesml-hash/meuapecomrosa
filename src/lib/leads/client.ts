"use client";
import { dispatchExternal, fallbackAttribution, trackingContext } from "@/lib/tracking/client";

export type LeadReceipt = { ok:true; created:boolean; replayed:boolean; tracking_token:string };
export async function submitLead(payload: Record<string,unknown>): Promise<LeadReceipt> {
  const context=await trackingContext().catch(()=>({tracking_token:undefined,attribution:fallbackAttribution()}));
  const response=await fetch("/api/leads", {method:"POST",headers:{"content-type":"application/json"},signal:AbortSignal.timeout(20_000),
    body:JSON.stringify({...payload,...context,page_path:payload.page_path??window.location.pathname})});
  const result=await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || "Não foi possível salvar. Tente novamente.");
  if (!result.replayed) {
    dispatchExternal(payload.source==="simulator"?"simulator_completed":"contact_form_completed",payload.property_id as string|undefined);
    if(result.created)dispatchExternal("lead_created",payload.property_id as string|undefined);
  }
  return result;
}
