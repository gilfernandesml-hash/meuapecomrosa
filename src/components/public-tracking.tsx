"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { beginNavigation, getConsent, identity, subscribeConsent, trackEvent, trackingContext } from "@/lib/tracking/client";

export function PublicTracking() {
  const pathname=usePathname();
  useEffect(()=>{
    const viewId=beginNavigation(pathname);
    void trackingContext();
    const marker=document.querySelector<HTMLElement>("[data-current-property]");
    const property={property_id:marker?.dataset.propertyId,property_slug:marker?.dataset.currentProperty,metadata:{view_id:viewId}};
    let disposed=false, activeMs=0, previous=performance.now(), lastTouch=0;
    async function views() {
      if (!getConsent().analytics) return;
      await trackEvent("page_view",{metadata:{view_id:viewId},page_path:pathname});
      if (marker && !disposed) { await trackEvent("property_view",property); if (!disposed) await trackEvent("property_view_repeat",property); }
    }
    void views();
    const unsubscribe=subscribeConsent(()=>{ previous=performance.now(); activeMs=0; void views(); });
    const timer=window.setInterval(()=>{
      const now=performance.now(), delta=Math.min(now-previous,1500); previous=now;
      if (!marker || !getConsent().analytics || document.visibilityState!=="visible" || !document.hasFocus()) return;
      activeMs+=delta;
      if (activeMs>=30_000) { void trackEvent("property_view_30s",{...property,metadata:{view_id:viewId,active_seconds:30}}); window.clearInterval(timer); }
    },1000);
    const onActivity=()=>{ if (Date.now()-lastTouch>60_000) { identity(); lastTouch=Date.now(); } };
    const onClick=(event: MouseEvent)=>{
      if (!(event.target instanceof Element)) return;
      const link=event.target.closest<HTMLAnchorElement>('a[href^="https://wa.me/"]');
      if (!link || link.dataset.trackingManual==="true") return;
      void trackEvent("whatsapp_click",{property_id:link.dataset.propertyId??marker?.dataset.propertyId,
        property_slug:link.dataset.propertySlug??marker?.dataset.currentProperty,
        metadata:{view_id:viewId,placement:link.dataset.trackingPlacement==="card"?"card":marker?"property":"content"}});
    };
    document.addEventListener("click",onClick); document.addEventListener("pointerdown",onActivity,{passive:true}); document.addEventListener("keydown",onActivity);
    return ()=>{disposed=true;unsubscribe();window.clearInterval(timer);document.removeEventListener("click",onClick);document.removeEventListener("pointerdown",onActivity);document.removeEventListener("keydown",onActivity);};
  },[pathname]);
  return null;
}
