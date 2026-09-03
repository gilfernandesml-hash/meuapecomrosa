import { CirclePlay, ExternalLink, ScanLine } from "lucide-react";
import type { PropertyVideo } from "@/lib/properties";

function videoEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v") ?? url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname.endsWith("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function isDirectVideo(url: string) {
  return /\.(?:mp4|webm|ogg)(?:$|\?)/i.test(url);
}

export function PropertyRichMedia({
  name,
  videos,
  virtualTours,
}: {
  name: string;
  videos: PropertyVideo[];
  virtualTours: string[];
}) {
  if (!videos.length && !virtualTours.length) return null;

  return (
    <section className="mt-10 border-t border-petroleo/10 pt-9">
      <p className="eyebrow">Experiência digital</p>
      <h2 className="display mt-2 text-3xl font-bold text-petroleo">Vídeos e tour virtual</h2>

      {videos.length ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {videos.map((video, index) => {
            const embedUrl = videoEmbedUrl(video.url);
            const title = video.description || `Vídeo ${index + 1} de ${name}`;
            if (embedUrl) {
              return (
                <article key={video.url} className="overflow-hidden rounded-3xl border border-petroleo/10 bg-white shadow-sm">
                  <div className="aspect-video bg-petroleo">
                    <iframe src={embedUrl} title={title} className="size-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
                  </div>
                  <p className="p-4 text-sm font-bold text-petroleo">{title}</p>
                </article>
              );
            }
            if (isDirectVideo(video.url)) {
              return (
                <article key={video.url} className="overflow-hidden rounded-3xl border border-petroleo/10 bg-white shadow-sm">
                  <video controls preload="none" playsInline className="aspect-video w-full bg-petroleo" aria-label={title}>
                    <source src={video.url} />
                    Seu navegador não oferece suporte à reprodução deste vídeo.
                  </video>
                  <p className="p-4 text-sm font-bold text-petroleo">{title}</p>
                </article>
              );
            }
            return (
              <a key={video.url} href={video.url} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-5 text-petroleo transition hover:border-rose hover:text-rose">
                <CirclePlay size={34} />
                <span><strong className="block">{title}</strong><small className="mt-1 block">Abrir vídeo <ExternalLink className="inline" size={13} /></small></span>
              </a>
            );
          })}
        </div>
      ) : null}

      {virtualTours.length ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {virtualTours.map((tour, index) => (
            <a key={tour} href={tour} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-5 text-petroleo transition hover:border-rose hover:text-rose">
              <ScanLine size={34} />
              <span><strong className="block">Tour virtual 360° {virtualTours.length > 1 ? index + 1 : ""}</strong><small className="mt-1 block">Explorar o empreendimento <ExternalLink className="inline" size={13} /></small></span>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
