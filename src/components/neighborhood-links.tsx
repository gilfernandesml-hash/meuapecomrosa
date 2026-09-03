import Link from "next/link";
import { neighborhoods } from "@/lib/neighborhoods";

export function NeighborhoodLinks() {
  return <section className="section bg-creme"><div className="container-site">
    <p className="eyebrow">Escolha a região</p>
    <h2 className="subtitle mt-3 text-4xl text-petroleo">Imóveis por bairro na Zona Sul</h2>
    <p className="mt-4 max-w-3xl leading-7 text-grafite/70">Compare as opções cadastradas em cada bairro, conheça as diferenças entre os empreendimentos e organize sua visita com a Rosa.</p>
    <nav aria-label="Imóveis por bairro" className="mt-7 flex flex-wrap gap-3">
      {neighborhoods.map((item) => <Link key={item.slug} href={`/bairros/${item.slug}`} className="rounded-full border border-petroleo/15 bg-white px-5 py-3 text-sm font-bold text-petroleo hover:border-rose hover:text-rose">{item.name}</Link>)}
    </nav>
    <Link href="/bairros" className="mt-6 inline-block font-bold text-rose">Explorar todos os bairros →</Link>
  </div></section>;
}
