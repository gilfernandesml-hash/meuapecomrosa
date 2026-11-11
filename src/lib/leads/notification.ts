import "server-only";
import { Resend } from "resend";
import { buildLeadNotification, type LeadNotificationData } from "@/lib/leads/notification-content";

export type { LeadNotificationData } from "@/lib/leads/notification-content";

export async function sendLeadNotification(data: LeadNotificationData) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const from = process.env.RESEND_FROM_EMAIL || "Meu Apê com Rosa <onboarding@resend.dev>";
  const to = process.env.RESEND_TO_EMAIL || "rosacorretora16@gmail.com";
  const notification = buildLeadNotification(data);
  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    replyTo: data.email,
    subject: notification.subject,
    html: notification.html,
  });

  if (error) throw new Error(`Falha ao enviar notificação de lead: ${error.message}`);
}
