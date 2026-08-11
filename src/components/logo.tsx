import Link from "next/link";
import { DoorOpen } from "lucide-react";

export function Logo({ compact = false, admin = false, light = false }: { compact?: boolean; admin?: boolean; light?: boolean }) {
  return (
    <Link href={admin ? "/admin" : "/"} className={`brand-logo ${compact ? "brand-logo-compact" : ""} ${light ? "brand-logo-light" : ""}`} aria-label={admin ? "Meu Apê com Rosa — painel administrativo" : "Meu Apê com Rosa — página inicial"}>
      <span className="brand-logo-mark" aria-hidden="true"><DoorOpen className="brand-logo-door" /></span>
      <span className="brand-logo-copy" aria-hidden="true">
        <span className="brand-logo-kicker">Meu apê com</span>
        <span className="brand-logo-name">Rosa</span>
        <span className="brand-logo-role">Rosa Oliveira · Corretora de imóveis</span>
      </span>
    </Link>
  );
}
