"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, FileText, Images, LayoutPanelTop, X } from "lucide-react";
import type { PropertyMedia } from "@/lib/properties";

type GalleryKind = "photos" | "floorplans";
type Viewer = { kind: GalleryKind; index: number } | null;
const isPdf = (url: string) => /\.pdf(?:$|\?)/i.test(url);

export function PropertyGallery({
  name,
  photos,
  floorplans,
  photoMedia = [],
  floorplanMedia = [],
}: {
  name: string;
  photos: string[];
  floorplans: string[];
  photoMedia?: PropertyMedia[];
  floorplanMedia?: PropertyMedia[];
}) {
  const [viewer, setViewer] = useState<Viewer>(null);
  const isOpen = viewer !== null;
  const viewableFloorplans = useMemo(() => floorplans.filter((floorplan) => !isPdf(floorplan)), [floorplans]);
  const photoDescriptions = useMemo(() => new Map(photoMedia.map((media) => [media.url, media.description])), [photoMedia]);
  const floorplanDescriptions = useMemo(() => new Map(floorplanMedia.map((media) => [media.url, media.description])), [floorplanMedia]);

  const move = useCallback((delta: number) => {
    setViewer((current) => {
      if (!current) return current;
      const images = current.kind === "photos" ? photos : viewableFloorplans;
      return { ...current, index: (current.index + delta + images.length) % images.length };
    });
  }, [photos, viewableFloorplans]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setViewer(null);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, move]);

  const activeImages = viewer ? (viewer.kind === "photos" ? photos : viewableFloorplans) : [];
  const activeImage = viewer ? activeImages[viewer.index] : null;
  const activeLabel = viewer?.kind === "floorplans" ? "Planta" : "Foto";

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="subtitle flex items-center gap-2 text-2xl text-petroleo"><Images size={22}/> Fotos do empreendimento</h2>
        <span className="text-xs font-semibold text-grafite/55">Clique para ampliar</span>
      </div>
      <div className="grid gap-3 overflow-hidden rounded-[2rem] md:grid-cols-4 md:grid-rows-2">
        {photos.slice(0, 5).map((photo, index) => (
          <button key={photo} type="button" onClick={() => setViewer({ kind: "photos", index })} className={`group relative min-h-52 cursor-zoom-in overflow-hidden bg-petroleo text-left ${index === 0 ? "md:col-span-2 md:row-span-2 md:min-h-[470px]" : ""}`} aria-label={`Ampliar foto ${index + 1} de ${name}`}>
            <Image src={photo} alt={`${name} — ${photoDescriptions.get(photo) || `foto ${index + 1}`}`} fill preload={index === 0} sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "25vw"} className="object-cover transition duration-500 group-hover:scale-105"/>
            <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white/90 text-petroleo opacity-0 shadow-lg transition group-hover:opacity-100"><Expand size={18}/></span>
            {index === 4 && photos.length > 5 ? <span className="absolute inset-0 grid place-items-center bg-petroleo/55 text-lg font-bold text-white">+{photos.length - 5} fotos</span> : null}
          </button>
        ))}
      </div>

      {floorplans.length > 0 ? (
        <section className="mt-10 border-t border-petroleo/10 pt-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="subtitle flex items-center gap-2 text-3xl text-petroleo"><LayoutPanelTop size={26}/> Plantas do empreendimento</h2>
            <span className="text-xs font-semibold text-grafite/55">{floorplans.length} {floorplans.length === 1 ? "planta" : "plantas"}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {floorplans.map((floorplan, index) => isPdf(floorplan) ? (
              <a key={floorplan} href={floorplan} target="_blank" rel="noreferrer" className="grid aspect-[4/3] place-items-center rounded-2xl border border-petroleo/10 bg-white p-6 text-center text-petroleo transition hover:border-rose hover:text-rose" aria-label={`Abrir planta ${index + 1} de ${name} em PDF`}>
                <span><FileText className="mx-auto" size={42}/><strong className="mt-3 block">Planta {index + 1} em PDF</strong><small className="mt-1 block">Abrir arquivo</small></span>
              </a>
            ) : (
              <button key={floorplan} type="button" onClick={() => setViewer({ kind: "floorplans", index: floorplans.slice(0, index).filter((item) => !isPdf(item)).length })} className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl border border-petroleo/10 bg-white" aria-label={`Ampliar planta ${index + 1} de ${name}`}>
                <Image src={floorplan} alt={`${floorplanDescriptions.get(floorplan) || `Planta ${index + 1}`} de ${name}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"/>
                <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-petroleo text-white shadow-lg"><Expand size={18}/></span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {viewer && activeImage ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#071521]/95 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`${activeLabel} ampliada de ${name}`} onClick={() => setViewer(null)}>
          <button type="button" onClick={() => setViewer(null)} className="absolute right-4 top-4 z-20 grid size-12 place-items-center rounded-full bg-white text-petroleo shadow-xl sm:right-7 sm:top-7" aria-label="Fechar galeria"><X size={24}/></button>
          {activeImages.length > 1 ? <button type="button" onClick={(event) => { event.stopPropagation(); move(-1); }} className="absolute left-3 z-20 grid size-12 place-items-center rounded-full bg-white/95 text-petroleo shadow-xl sm:left-7" aria-label="Imagem anterior"><ChevronLeft size={28}/></button> : null}
          <div className="relative h-[82vh] w-[min(1120px,86vw)]" onClick={(event) => event.stopPropagation()}>
            <Image src={activeImage} alt={`${activeLabel} ${viewer.index + 1} de ${name}`} fill sizes="90vw" className="object-contain" priority/>
          </div>
          {activeImages.length > 1 ? <button type="button" onClick={(event) => { event.stopPropagation(); move(1); }} className="absolute right-3 z-20 grid size-12 place-items-center rounded-full bg-white/95 text-petroleo shadow-xl sm:right-7" aria-label="Próxima imagem"><ChevronRight size={28}/></button> : null}
          <div className="absolute bottom-4 rounded-full bg-black/45 px-4 py-2 text-sm font-semibold text-white">{activeLabel} {viewer.index + 1} de {activeImages.length}</div>
        </div>
      ) : null}
    </>
  );
}
