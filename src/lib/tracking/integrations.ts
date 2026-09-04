import type { EventName } from "./domain";
import { safePath } from "../leads/domain";
export type AnalyticsIds = { ga4:string; meta:string; clarity:string };
export function analyticsIds(ga4?:string|null,meta?:string|null,clarity?:string|null):AnalyticsIds {
  return { ga4:/^G-[A-Z0-9]{5,20}$/.test(ga4??"")?ga4!:"", meta:/^\d{5,30}$/.test(meta??"")?meta!:"",clarity:/^[a-zA-Z0-9]{5,30}$/.test(clarity??"")?clarity!:"" };
}
export type ExternalEvent = { name:EventName; property_id?:string; page_path:string };
export function externalPayload(event:ExternalEvent,origin:string) {
  return { page_location:`${origin}${safePath(event.page_path)}`,page_referrer:"",...(event.property_id?{item_id:event.property_id}:{}) };
}
