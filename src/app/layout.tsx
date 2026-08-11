import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const brandSerif = Cormorant_Garamond({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://meuapecomrosa.com.br"),
  title: { default: "Meu Apê com Rosa | Seu primeiro imóvel começa aqui", template: "%s | Meu Apê com Rosa" },
  description: "Imóveis e orientação humana para quem deseja comprar o primeiro apartamento na Zona Sul de São Paulo.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Meu Apê com Rosa",
    title: "Seu primeiro imóvel começa aqui.",
    description: "Encontre oportunidades para sair do aluguel com orientação clara e próxima de Rosa Oliveira.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Meu Apê com Rosa — Seu primeiro imóvel começa aqui" }],
  },
  twitter: { card: "summary_large_image", title: "Meu Apê com Rosa", description: "Seu primeiro imóvel começa aqui.", images: ["/og.png"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${brandSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
