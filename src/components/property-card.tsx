import Link from "next/link";
import { BedDouble, MapPin, Maximize2 } from "lucide-react";
import type { Property } from "@/lib/properties";
import { whatsappUrl } from "@/lib/site";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="card overflow-hidden">
      <div className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-petroleo">
        <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_70%_20%,#c77c78,transparent_28%),linear-gradient(135deg,transparent_45%,#c8a96b33_45%,#c8a96b33_47%,transparent_47%)]" />
        <div className="relative grid h-28 w-40 grid-cols-3 items-end gap-2 border-b-4 border-white/80 px-3"><span className="h-16 bg-white/15"/><span className="h-24 bg-white/20"/><span className="h-20 bg-white/15"/></div>
        <div className="absolute left-4 top-4 flex gap-2">{property.mcmv && <span className="rounded-full bg-rose px-3 py-1 text-[.68rem] font-extrabold text-white">MCMV</span>}<span className="rounded-full bg-white/90 px-3 py-1 text-[.68rem] font-extrabold text-petroleo">{property.phase}</span></div>
      </div>
      <div className="p-5">
        <p className="flex items-center gap-1 text-xs font-bold text-rose"><MapPin size={14}/>{property.neighborhood}, {property.city}</p>
        <h3 className="mt-2 font-serif text-2xl font-bold text-petroleo">{property.name}</h3>
        <div className="mt-4 flex gap-4 border-y border-petroleo/10 py-3 text-xs font-semibold"><span className="flex gap-1"><Maximize2 size={15}/>{property.area}</span><span className="flex gap-1"><BedDouble size={15}/>{property.bedrooms} dorms.</span></div>
        <p className="mt-4 text-xs text-grafite/60">{property.code}</p><p className="mt-1 font-bold text-petroleo">{property.priceLabel}</p>
        <div className="mt-5 grid grid-cols-2 gap-2"><Link href={`/imoveis/${property.slug}`} className="btn btn-primary text-xs">Ver detalhes</Link><a href={whatsappUrl(`Olá, Rosa! Vi o empreendimento ${property.name} no site Meu Apê com Rosa e gostaria de mais informações.`)} target="_blank" rel="noreferrer" className="btn border border-whatsapp text-xs text-petroleo">WhatsApp</a></div>
      </div>
    </article>
  );
}
