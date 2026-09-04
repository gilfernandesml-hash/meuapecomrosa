import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: "Política de Privacidade", description: "Saiba como o Meu Apê com Rosa utiliza os dados enviados nos formulários e como solicitar acesso, correção ou exclusão.", alternates: { canonical: "/politica-de-privacidade" } };
export default function PrivacyPage() {
  return <PublicShell><article className="container-site section max-w-4xl">
    <p className="eyebrow">Sua privacidade</p>
    <h1 className="display mt-3 text-4xl font-bold text-petroleo sm:text-5xl">Política de Privacidade</h1>
    <div className="mt-8 space-y-7 leading-8 text-grafite/75">
      <section><h2 className="font-serif text-3xl font-bold text-petroleo">Dados de contato e perfil</h2>
        <p>Ao pedir atendimento, você informa nome e telefone. O e-mail é opcional. O simulador também recebe renda aproximada, FGTS, entrada e preferências de compra para ajudar a Rosa no atendimento. Não solicitamos documentos, senhas ou dados bancários pelo site. O perfil não representa aprovação de crédito.</p>
      </section>
      <section><h2 className="font-serif text-3xl font-bold text-petroleo">Funcionamento do site</h2>
        <p>Usamos identificadores aleatórios de visitante e sessão, sem seu nome ou telefone embutidos, para manter a origem da visita, evitar registros repetidos e relacionar suas solicitações. O identificador de visitante fica no navegador por até 180 dias. A sessão se renova após 30 minutos de inatividade. Se o navegador bloquear o armazenamento, esses recursos funcionam apenas durante a navegação atual.</p>
        <p>Registramos a página de entrada, o site de origem e os parâmetros de campanha disponíveis. Ações como iniciar ou concluir um pedido de atendimento e clicar no WhatsApp ajudam a dar continuidade ao contato. Quando você envia seu perfil, a sessão e suas interações podem ser associadas a ele. Para conter abuso de formulários, usamos chaves de controle derivadas do endereço de rede, sem gravar esse endereço em nossa tabela de eventos.</p>
      </section>
      <section><h2 className="font-serif text-3xl font-bold text-petroleo">Suas escolhas de analytics</h2>
        <p>As preferências de privacidade ficam disponíveis no rodapé. Você pode escolher só os recursos essenciais, permitir analytics ou permitir também marketing, e mudar de ideia a qualquer momento. A escolha fica salva neste navegador por até 180 dias.</p>
        <p>Com sua permissão para analytics, registramos páginas e imóveis visitados, revisitas e tempo de interesse. Google Analytics e Microsoft Clarity, quando configurados, ajudam a entender o uso do site. O Clarity pode produzir mapas de interação e registros de navegação; os campos de contato e perfil são mascarados. Com sua permissão para marketing, o Meta Pixel, quando configurado, pode medir ações relacionadas a campanhas.</p>
        <p>Esses serviços opcionais só são carregados após a escolha correspondente. Nossos eventos enviados ao Google Analytics e à Meta não incluem nome, telefone, e-mail, valores financeiros ou respostas do simulador. Ao retirar a permissão, interrompemos os próximos envios; isso não apaga automaticamente dados já recebidos pelos serviços.</p>
      </section>
      <section><h2 className="font-serif text-3xl font-bold text-petroleo">WhatsApp, armazenamento e segurança</h2>
        <p>O perfil enviado é salvo para atendimento. Ao escolher continuar no WhatsApp, você abre esse serviço com uma mensagem preenchida e decide se deseja enviá-la. O WhatsApp possui suas próprias condições de privacidade.</p>
        <p>Usamos infraestrutura de hospedagem e banco de dados para operar o site. O acesso aos contatos e ao histórico é restrito à equipe autorizada. As informações não são vendidas. Mantemos os registros conforme a necessidade de atendimento, segurança e obrigações aplicáveis; você pode solicitar a revisão ou exclusão pelo canal abaixo.</p>
      </section>
      <section><h2 className="font-serif text-3xl font-bold text-petroleo">Fale sobre seus dados</h2>
        <p>Para solicitar acesso, correção, exclusão ou esclarecer o uso das suas informações, entre em contato pelo e-mail <a className="break-all font-bold text-rose" href={`mailto:${site.email}`}>{site.email}</a>.</p>
      </section>
      <p className="fine-print">Última atualização: setembro de 2026.</p>
    </div>
  </article></PublicShell>;
}
