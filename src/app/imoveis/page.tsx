import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { PropertyCard } from "@/components/property-card";
import { getPublicProperties } from "@/lib/property-catalog";
import { getHousingClassifications, housingClassificationFromQuery, housingClassifications } from "@/lib/properties";

export const metadata: Metadata = { title: "Imóveis na Zona Sul de São Paulo", description: "Apartamentos, lançamentos e oportunidades selecionadas por Rosa Oliveira.", alternates: { canonical: "/imoveis" } };

export default async function PropertiesPage({ searchParams }: PageProps<"/imoveis">) {
  const query = await searchParams;
  const properties = await getPublicProperties();
  const localValue = typeof query.local === "string" ? query.local : "";
  const local = localValue.toLowerCase();
  const priceValue = typeof query.preco === "string" ? query.preco : "";
  const max = Number(priceValue) || 0;
  const bedroomsValue = typeof query.dormitorios === "string" ? query.dormitorios : "";
  const bedrooms = Number(bedroomsValue) || 0;
  const phase = typeof query.fase === "string" ? query.fase : "";
  const classificationValue = typeof query.classificacao === "string" ? query.classificacao : "";
  const classification = housingClassificationFromQuery(classificationValue);
  const mcmvOnly = query.mcmv === "on";
  const order = typeof query.ordem === "string" ? query.ordem : "relevantes";
  const hasFilters = Boolean(local || max || bedrooms || phase || classification || mcmvOnly || order !== "relevantes");

  const filtered = properties
    .filter((item) => (
      (!local || `${item.neighborhood} ${item.city}`.toLowerCase().includes(local))
      && (!max || (item.price !== null && item.price <= max))
      && (!bedrooms || item.bedrooms_min === bedrooms || item.bedrooms_max === bedrooms)
      && (!phase || item.phase === phase)
      && (!classification || getHousingClassifications(item).includes(classification))
      && (!mcmvOnly || item.mcmv)
    ))
    .sort((first, second) => {
      if (order === "menor-preco") return (first.price ?? Number.POSITIVE_INFINITY) - (second.price ?? Number.POSITIVE_INFINITY);
      if (order === "maior-preco") return (second.price ?? Number.NEGATIVE_INFINITY) - (first.price ?? Number.NEGATIVE_INFINITY);
      return 0;
    });

  return (
    <PublicShell>
      <section className="bg-petroleo py-16 text-white">
        <div className="container-site">
          <p className="eyebrow">Catálogo</p>
          <h1 className="display mt-3 text-5xl font-bold sm:text-6xl">Encontre seu próximo endereço.</h1>
          <p className="mt-4 max-w-2xl text-white/65">Oportunidades na Zona Sul selecionadas para diferentes momentos e possibilidades.</p>
        </div>
      </section>
      <section className="section">
        <div className="container-site grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside>
            <form method="get" className="card sticky top-28 grid gap-4 p-5">
              <h2 className="font-serif text-2xl font-bold text-petroleo">Filtrar imóveis</h2>
              <label className="label">Bairro<input name="local" defaultValue={localValue} className="field" placeholder="Digite um bairro"/></label>
              <label className="label">Preço máximo<select name="preco" defaultValue={priceValue} className="field"><option value="">Qualquer valor</option><option value="300000">R$ 300 mil</option><option value="400000">R$ 400 mil</option></select></label>
              <label className="label">Dormitórios<select name="dormitorios" defaultValue={bedroomsValue} className="field"><option value="">Todos</option><option value="1">1 dormitório</option><option value="2">2 dormitórios</option><option value="3">3 dormitórios</option></select></label>
              <label className="label">Fase<select name="fase" defaultValue={phase} className="field"><option value="">Todas</option><option>Lançamento</option><option>Em construção</option><option>Pronto</option></select></label>
              <label className="label">Classificação<select name="classificacao" defaultValue={classificationValue} className="field"><option value="">Todas</option>{housingClassifications.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="label">Ordenar por<select name="ordem" defaultValue={order} className="field"><option value="relevantes">Mais relevantes</option><option value="menor-preco">Menor preço</option><option value="maior-preco">Maior preço</option></select></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="mcmv" defaultChecked={mcmvOnly}/> Minha Casa Minha Vida</label>
              <button className="btn btn-primary"><Search size={17}/> Aplicar filtros</button>
              {hasFilters ? <Link href="/imoveis" className="text-center text-sm font-bold text-rose">Limpar filtros</Link> : null}
            </form>
          </aside>
          <div>
            <p className="mb-6 font-bold text-petroleo">{filtered.length} {filtered.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}</p>
            <div className="grid gap-6 md:grid-cols-2">{filtered.map((item) => <PropertyCard key={item.slug} property={item}/>)}</div>
            {filtered.length === 0 ? <div className="card p-10 text-center"><h2 className="font-serif text-3xl font-bold text-petroleo">Nenhum imóvel com esses filtros</h2><p className="mt-3">A classificação pode ainda estar em confirmação. Tente ampliar sua busca ou converse com a Rosa.</p></div> : null}
            <p className="fine-print mt-7">Valores, disponibilidade e classificações sujeitos a confirmação. Consulte as condições atualizadas.</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
