import Link from "next/link";
import Image from "next/image";
import { BedDouble, MapPin, Maximize2 } from "lucide-react";
import { getHousingClassifications, startingPriceLabel, type Property } from "@/lib/properties";
import { whatsappUrl } from "@/lib/site";

export function PropertyCard({ property }: { property: Property }) {
  const classifications = getHousingClassifications(property);
  const priceLabel = startingPriceLabel(property);
  return (
    <article className="card group relative overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <Link href={`/imoveis/${property.slug}`} className="absolute inset-0 z-10 rounded-[1.5rem]" aria-label={`Ver detalhes de ${property.name}`}/>
      <div className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-petroleo">
        {property.photos[0] ? <Image src={property.photos[0]} alt={`Fachada do ${property.name}`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105"/> : <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_70%_20%,#d2ad5c,transparent_28%),linear-gradient(135deg,transparent_45%,#e1bd6955_45%,#e1bd6955_47%,transparent_47%)]" />}
        <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">{property.mcmv && <span className="rounded-full bg-rose px-3 py-1 text-[.68rem] font-extrabold text-white">MCMV</span>}<span className="rounded-full bg-white/90 px-3 py-1 text-[.68rem] font-extrabold text-petroleo">{property.phase}</span>{classifications.map((classification) => <span key={classification} className="rounded-full bg-petroleo/95 px-3 py-1 text-[.68rem] font-extrabold text-white">{classification}</span>)}</div>
      </div>
      <div className="p-5">
        <p className="flex items-center gap-1 text-xs font-bold text-rose"><MapPin size={14}/>{property.neighborhood}, {property.city}</p>
        <h3 className="subtitle mt-2 text-2xl text-petroleo">{property.name}</h3>
        <div className="mt-4 flex gap-4 border-y border-petroleo/10 py-3 text-xs font-semibold"><span className="flex gap-1"><Maximize2 size={15}/>{property.area}</span><span className="flex gap-1"><BedDouble size={15}/>{property.bedrooms_min ?? "—"} dorms.</span></div>
        <p className="mt-4 text-xs text-grafite/60">{property.code}</p><p className="price mt-1 text-petroleo">{priceLabel}</p>
        <div className="mt-5 grid grid-cols-2 gap-2"><span className="btn btn-primary text-xs">Ver detalhes</span><a href={whatsappUrl(`Olá, Rosa! Vi o empreendimento ${property.name} no site Meu Apê com Rosa e gostaria de mais informações.`)} target="_blank" rel="noreferrer" className="btn relative z-20 border border-whatsapp text-xs text-petroleo">WhatsApp</a></div>
      </div>
    </article>
  );
}
