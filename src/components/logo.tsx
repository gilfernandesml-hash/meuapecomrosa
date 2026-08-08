import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false, admin = false }: { compact?: boolean; admin?: boolean }) {
  return (
    <Link href={admin ? "/admin" : "/"} className={`relative block shrink-0 overflow-hidden ${compact ? "h-16 w-52 sm:w-60" : "h-24 w-72 sm:w-80"}`} aria-label={admin ? "Meu Apê com Rosa — painel administrativo" : "Meu Apê com Rosa — página inicial"}>
      <Image src="/logo-rosa-oliveira-transp.png" alt="Rosa Oliveira — Corretora de Imóveis" fill priority className="scale-[1.02] object-cover object-[center_47%]" sizes={compact ? "240px" : "320px"}/>
    </Link>
  );
}
