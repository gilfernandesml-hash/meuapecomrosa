"use client";
import { attributionFromUrl, behavioralEvent, eventDedupeKey, nextIdentity, type Consent, type EventMetadata, type EventName, type Session, type Visitor } from "./domain";

const keys = { visitor: "rosa.visitor.v1", session: "rosa.session.v1", consent: "rosa.consent.v1", sent: "rosa.events.v1" };
let memoryVisitor: Visitor | null = null, memorySession: Session | null = null;
let memoryConsent = "";
let bootstrap: { key: string; promise: Promise<string | undefined>; expires: number } | null = null;
let currentPath = "", currentView = "";
const pending = new Set<string>();
const sent = new Set<string>();

function read<T>(key: string, local = false): T | null {
  try { return JSON.parse((local ? localStorage : sessionStorage).getItem(key) ?? "null"); } catch { return null; }
}
function write(key: string, value: unknown, local = false) {
  try { (local ? localStorage : sessionStorage).setItem(key, JSON.stringify(value)); } catch { /* Private mode: memory-only IDs. */ }
}
export function identity() {
  const next = nextIdentity(memoryVisitor ?? read<Visitor>(keys.visitor,true), memorySession ?? read<Session>(keys.session), window.location.href, document.referrer, Date.now(), () => crypto.randomUUID());
  memoryVisitor = next.visitor; memorySession = next.session;
  write(keys.visitor,next.visitor,true); write(keys.session,next.session);
  return next.session;
}
export function consentSnapshot() {
  let raw = memoryConsent;
  try { raw = localStorage.getItem(keys.consent) ?? raw; } catch {}
  try {
    const v = JSON.parse(raw);
    return v.version === 1 && typeof v.analytics === "boolean" && typeof v.marketing === "boolean" && Date.now()-v.saved_at < 180*86400000 ? raw : "";
  } catch { return ""; }
}
export const serverConsentSnapshot = () => "";
export function getConsent(): Consent {
  const raw = consentSnapshot();
  return raw ? JSON.parse(raw) : { analytics:false, marketing:false };
}
export function subscribeConsent(listener: () => void) {
  window.addEventListener("rosa-consent",listener); window.addEventListener("storage",listener);
  return () => { window.removeEventListener("rosa-consent",listener); window.removeEventListener("storage",listener); };
}
export function saveConsent(consent: Consent) {
  memoryConsent = JSON.stringify({ ...consent,version:1,saved_at:Date.now() });
  try { localStorage.setItem(keys.consent,memoryConsent); } catch {}
  bootstrap = null;
  window.dispatchEvent(new Event("rosa-consent"));
  void trackingContext();
}
export function beginNavigation(path: string) {
  if (path !== currentPath || !currentView) { currentPath = path; currentView = crypto.randomUUID(); }
  return currentView;
}
export async function trackingContext() {
  const session = identity(), consent = getConsent();
  const key = `${session.session_id}:${consent.analytics}:${consent.marketing}`;
  if (!bootstrap || bootstrap.key !== key || bootstrap.expires < Date.now()) {
    const promise = fetch("/api/tracking/session", { method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({ visitor_id:session.visitor_id,session_id:session.session_id,attribution:session.attribution,consent,
        device_type:window.innerWidth<768?"mobile":window.innerWidth<1024?"tablet":"desktop" }), signal:AbortSignal.timeout(4000),
    }).then(async r => r.ok ? (await r.json()).token as string : undefined).catch(()=>undefined);
    bootstrap = { key,promise,expires:Date.now()+20*60*60*1000 };
    void promise.then(token=>{ if (!token && bootstrap?.key===key) bootstrap=null; });
  }
  return { tracking_token:await bootstrap.promise, attribution:session.attribution };
}
export type TrackOptions = { property_id?: string; property_slug?: string; metadata?: EventMetadata; token?: string; page_path?: string };
export async function trackEvent(name: EventName, options: TrackOptions = {}): Promise<boolean> {
  if (behavioralEvent(name) && !getConsent().analytics) return false;
  const session=identity(), page=options.page_path ?? window.location.pathname;
  const metadata={ view_id:beginNavigation(page), ...options.metadata };
  const key=`${session.session_id}:${eventDedupeKey(name,metadata,options.property_id??options.property_slug)}`;
  const previous=read<string[]>(keys.sent);
  if (sent.has(key) || pending.has(key) || (Array.isArray(previous) && previous.includes(key))) return false;
  pending.add(key);
  try {
    const token = options.token ?? (await trackingContext()).tracking_token;
    if (!token) return false;
    const response=await fetch("/api/tracking/events", { method:"POST",headers:{"content-type":"application/json"},keepalive:true,signal:AbortSignal.timeout(4000),
      body:JSON.stringify({ event_id:crypto.randomUUID(),event_name:name,tracking_token:token,page_path:page,
        property_id:options.property_id,property_slug:options.property_slug,metadata }),
    });
    const recorded=response.ok && (await response.json()).recorded===true;
    if (recorded) {
      sent.add(key); write(keys.sent,[...new Set([...(Array.isArray(previous)?previous:[]),...sent])].slice(-500));
      dispatchExternal(name,options.property_id,page);
    }
    return recorded;
  } catch { return false; } finally { pending.delete(key); }
}

// Only a fixed allowlist reaches integrations. Never forward form payloads, URLs with query, or metadata.
export function dispatchExternal(name: EventName, propertyId?: string, path = window.location.pathname) {
  if (!["page_view","property_view","simulator_started","simulator_completed","whatsapp_click","lead_created"].includes(name)) return;
  window.dispatchEvent(new CustomEvent("rosa-conversion", {detail:{name,property_id:propertyId,page_path:path.split(/[?#]/)[0]}}));
}
export function fallbackAttribution() { return memorySession?.attribution ?? attributionFromUrl(window.location.href,document.referrer); }
