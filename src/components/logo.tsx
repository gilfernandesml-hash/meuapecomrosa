import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false, admin = false }: { compact?: boolean; admin?: boolean }) {
  return (
    <Link href={admin ? "/admin" : "/"} className={`relative block shrink-0 overflow-hidden rounded-xl bg-[#4e4f50] shadow-sm ${compact ? "h-12 w-36" : "h-16 w-52 sm:w-60"}`} aria-label={admin ? "Meu Apê com Rosa — painel administrativo" : "Meu Apê com Rosa — página inicial"}>
      <Image src="/logo-rosa-oliveira.png" alt="Rosa Oliveira — Corretora de Imóveis" fill priority className="scale-[1.02] object-cover object-[center_47%]" sizes={compact ? "144px" : "240px"}/>
    </Link>
  );
}
