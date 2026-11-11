export type LeadNotificationData = {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  pagePath?: string;
  propertyName?: string;
  propertyCode?: string;
  incomeRange?: string;
  incomeAmount?: number;
  hasFgts?: boolean;
  fgtsAmount?: number;
  downPaymentRange?: string;
  downPaymentAmount?: number;
  region?: string;
  bedrooms?: string;
  purchaseMode?: string;
  purchaseTimeline?: string;
};

const sourceLabels: Record<string, string> = {
  "pre-analysis": "Pré-análise",
  contact: "Formulário de contato",
  simulator: "Simulador de perfil",
};

const bedroomLabels: Record<string, string> = {
  studio: "Studio",
  "1": "1 dormitório",
  "2": "2 dormitórios",
  "3+": "3 dormitórios ou mais",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value: number | undefined) {
  return value === undefined
    ? undefined
    : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function yesNo(value: boolean | undefined) {
  return value === undefined ? undefined : value ? "Sim" : "Não";
}

function row(label: string, value: string | undefined) {
  if (!value) return "";
  return `<p style="margin: 8px 0;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

export function buildLeadNotification(data: LeadNotificationData) {
  const phone = data.phone.replace(/\D/g, "");
  const source = data.source ? sourceLabels[data.source] ?? data.source : undefined;
  const property = [data.propertyName, data.propertyCode].filter(Boolean).join(" · ") || undefined;
  const subject = property ? `Novo lead: ${property}` : "Novo lead pelo Meu Apê com Rosa";
  const whatsappUrl = phone ? `https://wa.me/${phone}` : undefined;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#16333a;line-height:1.5;max-width:680px;">
      <h1 style="font-size:22px;margin:0 0 16px;">Novo lead pelo site</h1>
      ${row("Nome", data.name)}
      ${row("WhatsApp", data.phone)}
      ${row("E-mail", data.email)}
      ${row("Origem", source)}
      ${row("Página", data.pagePath)}
      ${row("Imóvel", property)}
      ${row("Renda", money(data.incomeAmount) ?? data.incomeRange)}
      ${row("Possui FGTS", yesNo(data.hasFgts))}
      ${row("Valor do FGTS", money(data.fgtsAmount))}
      ${row("Entrada", money(data.downPaymentAmount) ?? data.downPaymentRange)}
      ${row("Região desejada", data.region)}
      ${row("Dormitórios", data.bedrooms ? bedroomLabels[data.bedrooms] ?? data.bedrooms : undefined)}
      ${row("Forma de compra", data.purchaseMode === "joint" ? "Composição de renda" : data.purchaseMode === "alone" ? "Sozinho" : undefined)}
      ${row("Prazo de compra", data.purchaseTimeline)}
      ${whatsappUrl ? `<p style="margin-top:24px;"><a href="${escapeHtml(whatsappUrl)}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:8px;">Responder pelo WhatsApp</a></p>` : ""}
    </div>
  `;

  return { subject, html, whatsappUrl };
}
