import { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsappFloat } from "@/components/whatsapp-float";
import { BackToTop } from "@/components/back-to-top";
import { StructuredData } from "@/components/structured-data";
import { identitySchema } from "@/lib/seo";

export function PublicShell({ children }: { children: ReactNode }) {
  return <><StructuredData data={identitySchema} /><SiteHeader /><main>{children}</main><SiteFooter /><BackToTop /><WhatsappFloat /></>;
}
