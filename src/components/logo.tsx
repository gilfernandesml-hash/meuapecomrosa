import Link from "next/link";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="Meu Apê com Rosa — página inicial">
      <span className={`grid size-10 place-items-center rounded-[14px] border ${inverse ? "border-white/30" : "border-champagne/70"}`} aria-hidden="true">
        <span className={`h-4 w-3 border-b-2 border-l-2 ${inverse ? "border-white" : "border-petroleo"}`} />
      </span>
      <span className="leading-none">
        <strong className={`block text-[.9rem] tracking-[.14em] ${inverse ? "text-white" : "text-petroleo"}`}>MEU APÊ</strong>
        <span className="mt-1 block font-serif text-xl font-bold text-rose">com Rosa</span>
      </span>
    </Link>
  );
}
