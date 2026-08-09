import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false, admin = false }: { compact?: boolean; admin?: boolean }) {
  return (
    <Link href={admin ? "/admin" : "/"} className={`relative block shrink-0 overflow-hidden ${compact ? "h-16 w-56 sm:h-20 sm:w-60" : "h-28 w-72 sm:h-32 sm:w-[25rem]"}`} aria-label={admin ? "Meu Apê com Rosa — painel administrativo" : "Meu Apê com Rosa — página inicial"}>
      <Image src="/logo-rosa-5.png" alt="Meu Apê com Rosa — Rosa Oliveira, Corretora de Imóveis" fill preload className={`${compact ? "scale-[1.4]" : "scale-[1.75]"} object-contain brightness-105 contrast-125 saturate-125 drop-shadow-[0_3px_12px_rgba(18,48,71,.42)]`} sizes={compact ? "240px" : "400px"}/>
    </Link>
  );
}
