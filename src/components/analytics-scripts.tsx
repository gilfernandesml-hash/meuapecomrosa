"use client";
import { useEffect, useSyncExternalStore } from "react";
import { consentSnapshot, getConsent, serverConsentSnapshot, subscribeConsent, subscribeExternal } from "@/lib/tracking/client";
import { externalPayload, type AnalyticsIds } from "@/lib/tracking/integrations";
import { site } from "@/lib/site";

type Command=((...args:unknown[])=>void)&{q?:unknown[][];queue?:unknown[][];callMethod?:(...args:unknown[])=>void;push?:Command;loaded?:boolean;version?:string};
declare global { interface Window { dataLayer?:unknown[];gtag?:Command;fbq?:Command;_fbq?:Command;clarity?:Command; } }
const initialized=new Set<string>();
function script(id:string,src:string){
  if(document.getElementById(id))return;
  const element=document.createElement("script");element.id=id;element.src=src;element.async=true;element.referrerPolicy="origin";document.head.appendChild(element);
}
function clearCookies(pattern:RegExp){
  for(const cookie of document.cookie.split(";")){
    const name=cookie.split("=")[0].trim();if(!pattern.test(name))continue;
    for(const domain of ["",`; domain=${location.hostname}`,`; domain=.${location.hostname}`])document.cookie=`${name}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
  }
}
export function AnalyticsScripts({ids}:{ids:AnalyticsIds}){
  const saved=useSyncExternalStore(subscribeConsent,consentSnapshot,serverConsentSnapshot);
  useEffect(()=>{
    const consent=getConsent();
    if(ids.ga4){
      (window as unknown as Record<string,unknown>)[`ga-disable-${ids.ga4}`]=!consent.analytics;
      if(consent.analytics){
        window.dataLayer??=[];
        window.gtag??=function(){
          // gtag's documented queue expects an Arguments object.
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer!.push(arguments);
        };
        window.gtag("consent","update",{analytics_storage:"granted",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
        if(!initialized.has(ids.ga4)){
          window.gtag("js",new Date());
          window.gtag("config",ids.ga4,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:`${site.url}${location.pathname}`,page_referrer:""});
          initialized.add(ids.ga4);script("rosa-ga4",`https://www.googletagmanager.com/gtag/js?id=${ids.ga4}`);
        }
      }else{window.gtag?.("consent","update",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});clearCookies(/^_ga/);}
    }
    if(ids.meta){
      if(consent.marketing){
        if(!window.fbq){const command:Command=(...args)=>{if(command.callMethod)command.callMethod(...args);else command.queue!.push(args);};command.queue=[];command.push=command;command.loaded=true;command.version="2.0";window.fbq=command;window._fbq=command;}
        window.fbq("consent","grant");
        if(!initialized.has(ids.meta)){window.fbq("set","autoConfig",false,ids.meta);window.fbq("init",ids.meta);initialized.add(ids.meta);script("rosa-meta","https://connect.facebook.net/en_US/fbevents.js");}
      }else{window.fbq?.("consent","revoke");clearCookies(/^_fb[pc]$/);}
    }
    if(ids.clarity){
      if(consent.analytics){
        if(!window.clarity){const command:Command=(...args)=>{(command.q??=[]).push(args);};window.clarity=command;}
        window.clarity("consentv2",{analytics_Storage:"granted",ad_Storage:consent.marketing?"granted":"denied"});
        if(!initialized.has(`clarity:${ids.clarity}`)){initialized.add(`clarity:${ids.clarity}`);script("rosa-clarity",`https://www.clarity.ms/tag/${ids.clarity}`);}else window.clarity("start");
      }else{window.clarity?.("consentv2",{analytics_Storage:"denied",ad_Storage:"denied"});window.clarity?.("stop");clearCookies(/^_cl[cs]k$/);}
    }
    const unsubscribe=subscribeExternal(event=>{
      const current=getConsent();const payload=externalPayload(event,site.url);
      if(ids.ga4 && current.analytics)window.gtag?.("event",event.name==="lead_created"?"generate_lead":event.name,{...payload,send_to:ids.ga4});
      if(ids.meta && current.marketing && event.name!=="page_view"){
        const standard=event.name==="lead_created"?"Lead":event.name==="property_view"?"ViewContent":null;
        window.fbq?.(standard?"trackSingle":"trackSingleCustom",ids.meta,standard??event.name,event.property_id?{content_ids:[event.property_id]}:{});
      }
    });
    return ()=>{
      unsubscribe();
      if(ids.ga4)(window as unknown as Record<string,unknown>)[`ga-disable-${ids.ga4}`]=true;
      window.fbq?.("consent","revoke");window.clarity?.("stop");
    };
  },[ids.ga4,ids.meta,ids.clarity,saved]);
  return null;
}
