import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/site";

export function WhatsappFloat() {
  return <a href={whatsappUrl()} target="_blank" rel="noreferrer" aria-label="Conversar com Rosa pelo WhatsApp" className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-whatsapp text-white shadow-xl transition hover:scale-105"><MessageCircle /></a>;
}
