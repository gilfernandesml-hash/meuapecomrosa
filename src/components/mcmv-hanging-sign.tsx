import Link from "next/link";

type McmvHangingSignProps = {
  href?: string;
  className?: string;
};

export function McmvHangingSign({
  href = "/minha-casa-minha-vida",
  className = "",
}: McmvHangingSignProps) {
  return (
    <Link
      href={href}
      className={`mcmv-cta-sign ${className}`.trim()}
      aria-label="Ver imóveis do Minha Casa Minha Vida"
    >
      <span className="mcmv-cta-sign__ropes" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="mcmv-cta-sign__board">
        <span className="mcmv-cta-sign__brand">
          <span className="mcmv-cta-sign__house" aria-hidden="true">
            <svg viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4L4 22.5h6.2V40h11.2V28.2h5.2V40h11.2V22.5H44L24 4Z" fill="#f39200" />
              <path d="M24 9.2 12.4 20.2h3.6V34h7.2V24.4h1.6V34h7.2V20.2h3.6L24 9.2Z" fill="#fff" />
              <path d="M21.2 24.4h5.6V34h-5.6V24.4Z" fill="#005ca9" />
            </svg>
          </span>
          <span className="mcmv-cta-sign__copy">
            <span className="mcmv-cta-sign__action">Ver imóveis do</span>
            <span className="mcmv-cta-sign__program">Minha Casa Minha Vida</span>
          </span>
        </span>
        <span className="mcmv-cta-sign__caixa" aria-hidden="true">
          <span className="mcmv-cta-sign__caixa-blue">CAI</span>
          <span className="mcmv-cta-sign__caixa-x">X</span>
          <span className="mcmv-cta-sign__caixa-blue">A</span>
        </span>
      </span>
    </Link>
  );
}
