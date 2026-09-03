import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { PropertyCard } from "@/components/property-card";
import { StructuredData } from "@/components/structured-data";
import { getPublicProperties } from "@/lib/property-catalog";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { whatsappUrl } from "@/lib/site";

export const metadata = pageMetadata({ title: "Minha Casa Minha Vida na Zona Sul de São Paulo", description: "Entenda o Minha Casa Minha Vida, o uso do FGTS e a análise de crédito. Veja imóveis identificados no programa e converse com Rosa Oliveira.", path: "/minha-casa-minha-vida" });

const topics = [
  ["O que é o Minha Casa Minha Vida?", "É um programa habitacional com diferentes formas de atendimento. Na linha financiada, a compra depende do enquadramento do imóvel e da análise realizada por uma instituição financeira. A existência de um anúncio no site não representa inscrição, concessão de subsídio ou aprovação de crédito."],
  ["Como descobrir se meu perfil se enquadra?", "O primeiro passo é organizar as informações de renda familiar, recursos para entrada e objetivo de compra. A instituição responsável verifica os critérios aplicáveis à modalidade. Não é possível concluir o enquadramento somente pelo bairro, pelo preço do anúncio ou por uma simulação informal."],
  ["Posso usar o FGTS?", "O saldo pode ser utilizado em modalidades de moradia própria, desde que o trabalhador, o imóvel e a operação atendam às condições exigidas. A análise deve ser feita pelo agente financeiro. Ter saldo disponível não significa que todo o valor possa ser usado em qualquer imóvel."],
  ["O que preparar para o atendimento?", "Informe sua região de preferência, quantidade de dormitórios, prazo para mudança e uma estimativa dos recursos disponíveis. No site, não envie documentos, senhas, extratos ou dados bancários. A lista oficial de documentos e o canal adequado para enviá-los serão indicados na etapa de análise."],
  ["Como comparar os imóveis da Zona Sul?", "Abra a página de cada empreendimento e observe planta, área privativa, finalidade da unidade e fase da obra. Compare também a rotina de deslocamento e as despesas previstas. Uma opção mais barata no anúncio pode ter uma planta, uma finalidade ou um prazo diferente do que você precisa."],
  ["O que conferir antes de assinar?", "Peça a identificação da unidade, o valor total, o cronograma de pagamentos e a documentação da proposta. Verifique com os responsáveis as condições de financiamento e as despesas de aquisição. Não se baseie apenas em frases como entrada facilitada ou parcela que cabe no bolso."],
];

export default async function McmvPage() {
  const properties = (await getPublicProperties()).filter((item) => item.mcmv && item.property_type !== "commercial");
  return <PublicShell>
    <StructuredData data={breadcrumbSchema([{ name: "Início", path: "/" }, { name: "Minha Casa Minha Vida", path: "/minha-casa-minha-vida" }])} />
    <section className="section bg-petroleo text-white"><div className="container-site max-w-4xl">
      <p className="eyebrow">Guia sem complicação</p>
      <h1 className="display mt-4 text-5xl font-bold sm:text-6xl">Minha Casa Minha Vida na Zona Sul de São Paulo</h1>
      <p className="mt-6 text-lg leading-8 text-white/75">Entenda as etapas da compra e as perguntas que ajudam a comparar os imóveis. Rosa Oliveira orienta sua busca; o enquadramento e a aprovação são definidos pelas instituições responsáveis.</p>
    </div></section>
    <section className="section"><div className="container-site max-w-4xl">
      <p className="mb-8 text-sm text-grafite/60">Conteúdo informativo do Meu Apê com Rosa · Atualizado em 3 de setembro de 2026.</p>
      <div className="grid gap-5">{topics.map(([title, text], index) => <article key={title} className="card p-7"><p className="eyebrow">Etapa {index + 1}</p><h2 className="subtitle mt-3 text-3xl text-petroleo">{title}</h2><p className="mt-4 leading-8 text-grafite/75">{text}</p></article>)}</div>
      <aside className="mt-8 rounded-3xl bg-creme p-7"><h2 className="subtitle text-2xl text-petroleo">Consulte as fontes oficiais</h2><p className="mt-3 leading-7">As regras podem mudar. Confira a <a className="font-bold text-rose underline" href="https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/mcmv-fgts" target="_blank" rel="noreferrer">linha financiada do Ministério das Cidades</a> e as informações do <a className="font-bold text-rose underline" href="https://www.fgts.gov.br/Paginas/trabalhador/fgts-na-moradia.aspx" target="_blank" rel="noreferrer">FGTS na moradia própria</a>.</p><p className="mt-3 text-sm leading-7">Este site não representa o Governo Federal ou a Caixa. O contato com a Rosa não substitui o processo oficial de análise.</p></aside>
    </div></section>
    <section className="pb-16"><div className="container-site">
      <h2 className="subtitle text-4xl text-petroleo">Imóveis identificados no programa pela fonte</h2>
      <p className="mt-4 max-w-3xl leading-7 text-grafite/70">A indicação vem do catálogo Órulo e deve ser confirmada para a unidade escolhida e para o perfil de quem vai comprar.</p>
      {properties.length ? <div className="property-grid mt-8">{properties.map((item) => <PropertyCard key={item.slug} property={item} />)}</div> : <p className="mt-6">Consulte a Rosa para verificar as opções e condições disponíveis.</p>}
      <div className="mt-10 flex flex-wrap gap-4"><a href={whatsappUrl("Olá, Rosa! Li o guia Minha Casa Minha Vida e gostaria de orientação para procurar meu primeiro imóvel.")} target="_blank" rel="noreferrer" className="btn btn-primary">Conversar com a Rosa</a><Link href="/primeiro-imovel" className="btn border border-petroleo/20 text-petroleo">Ver o passo a passo da compra</Link><Link href="/bairros" className="btn text-rose">Comparar bairros</Link></div>
    </div></section>
  </PublicShell>;
}
