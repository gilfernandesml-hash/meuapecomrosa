import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { StructuredData } from "@/components/structured-data";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { whatsappUrl } from "@/lib/site";

export const metadata = pageMetadata({ title: "Como comprar o primeiro apartamento na Zona Sul", description: "Planejamento, escolha do bairro, plantas, documentação e financiamento: conheça o passo a passo para comprar seu primeiro apartamento com Rosa Oliveira.", path: "/primeiro-imovel" });

const steps = [
  ["Organize o orçamento", "Anote os recursos disponíveis e as despesas mensais antes de escolher uma faixa de preço. Peça uma visão do custo total da aquisição: entrada, pagamentos previstos, despesas de documentação e custos que surgem depois da mudança. Preserve espaço para imprevistos."],
  ["Defina a rotina que o imóvel precisa atender", "Liste onde sua família trabalha, estuda e resolve as tarefas do dia a dia. Compare endereços concretos, não apenas o nome do bairro. Uma visita em horário semelhante ao da sua rotina ajuda a avaliar o deslocamento sem depender de promessas de tempo de trajeto."],
  ["Escolha entre lançamento, obra e imóvel pronto", "Informe quando você precisa se mudar. Em um lançamento ou imóvel em construção, confirme o cronograma e o prazo previstos na documentação. Em uma opção pronta, verifique as condições reais da unidade e as etapas necessárias para ocupação."],
  ["Compare as plantas", "Observe área privativa, circulação, posição dos móveis e quantidade de banheiros. A mesma metragem pode oferecer distribuições muito diferentes. Verifique se varanda, suíte e vaga pertencem à unidade anunciada, pois as opções variam dentro de um empreendimento."],
  ["Entenda o valor a partir de", "O menor preço divulgado é uma referência, não a promessa de que todas as unidades custam o mesmo. Pergunte qual unidade está disponível nesse valor, a data da tabela e as condições de pagamento. Guarde a proposta com a identificação do que foi oferecido."],
  ["Avalie crédito e FGTS com os responsáveis", "A possibilidade de financiamento e de uso do FGTS depende de análise. A corretora ajuda a organizar as etapas, mas não aprova crédito nem garante benefícios. Para verificar o programa habitacional, consulte também o guia Minha Casa Minha Vida e as fontes oficiais."],
  ["Prepare os documentos no canal adequado", "Peça à instituição ou ao responsável pelo processo a relação atualizada de documentos. Não envie senhas, códigos de acesso ou dados bancários nos formulários do site. Compartilhe documentos somente quando souber a finalidade, o destinatário e o canal seguro de envio."],
  ["Agende uma visita acompanhada", "Leve suas dúvidas sobre a planta, a iluminação, as áreas comuns e a unidade pretendida. A Rosa confirma o endereço completo e acompanha a visita. Imagens de decorados e perspectivas devem ser comparadas com o memorial descritivo do que será entregue."],
  ["Revise a proposta e o contrato", "Confira a identificação das partes e da unidade, valores, vencimentos, prazos e condições previstas. Peça esclarecimentos sobre qualquer ponto que não esteja claro e busque orientação profissional específica quando necessário. Evite decidir apenas por uma condição verbal."],
  ["Planeje as etapas até as chaves", "Organize os comprovantes e acompanhe as comunicações do processo. Antes da mudança, confirme as etapas de vistoria, entrega e instalação dos serviços e considere as despesas do condomínio. O acompanhamento continua depois da escolha do imóvel."],
];

export default function FirstHomePage() {
  return <PublicShell>
    <StructuredData data={breadcrumbSchema([{ name: "Início", path: "/" }, { name: "Primeiro imóvel", path: "/primeiro-imovel" }])} />
    <section className="section"><div className="container-site max-w-5xl">
      <p className="eyebrow">Do aluguel para o seu apê</p>
      <h1 className="display mt-4 text-5xl font-bold text-petroleo sm:text-6xl">Como comprar o primeiro apartamento na Zona Sul</h1>
      <p className="mt-6 max-w-3xl leading-8 text-grafite/75">Um caminho organizado ajuda a comparar opções e reduzir dúvidas. Use este roteiro para preparar sua conversa com Rosa Oliveira e levar perguntas concretas para cada etapa da compra.</p>
      <p className="mt-4 text-sm text-grafite/60">Conteúdo informativo do Meu Apê com Rosa · Atualizado em 3 de setembro de 2026.</p>
      <ol className="mt-10 grid gap-5 md:grid-cols-2">{steps.map(([title, text], index) => <li key={title} className="card p-7"><span className="text-sm font-bold text-rose">Passo {index + 1}</span><h2 className="subtitle mt-3 text-3xl text-petroleo">{title}</h2><p className="mt-4 leading-7 text-grafite/75">{text}</p></li>)}</ol>
      <aside className="mt-10 rounded-3xl bg-petroleo p-8 text-white"><h2 className="subtitle text-3xl">Transforme o roteiro em uma seleção de imóveis</h2><p className="mt-4 leading-7 text-white/75">Conte à Rosa a região desejada, a planta que procura e seu prazo para mudança. O atendimento é individual, sem promessa de aprovação financeira ou valorização garantida.</p><a className="btn btn-primary mt-6" href={whatsappUrl("Olá, Rosa! Li o guia do primeiro apartamento e gostaria de ajuda para organizar minha busca na Zona Sul.")} target="_blank" rel="noreferrer">Quero orientação para meu primeiro imóvel</a></aside>
      <nav aria-label="Próximos passos" className="mt-8 flex flex-wrap gap-5 font-bold text-rose"><Link href="/bairros">Escolher o bairro</Link><Link href="/imoveis">Comparar imóveis</Link><Link href="/minha-casa-minha-vida">Entender o Minha Casa Minha Vida</Link><Link href="/sobre-a-rosa">Conhecer a Rosa</Link></nav>
      <p className="fine-print mt-8">Orientações gerais para organizar a pesquisa. Condições contratuais e financeiras exigem análise dos profissionais e instituições responsáveis. Consulte as regras de uso do FGTS no guia e nas fontes oficiais.</p>
    </div></section>
  </PublicShell>;
}
