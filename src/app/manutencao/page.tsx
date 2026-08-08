import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { whatsappUrl } from "@/lib/site";
export const metadata: Metadata = { title: "Voltamos em breve", robots: { index: false, follow: false } };
export default function MaintenancePage() { return <main className="grid min-h-screen place-items-center bg-petroleo p-6 text-white"><div className="max-w-xl text-center"><div className="flex justify-center"><Logo /></div><p className="eyebrow mt-12">Cuidando de cada detalhe</p><h1 className="display mt-4 text-6xl font-bold">Estamos preparando algo especial.</h1><p className="mt-6 leading-8 text-white/70">O site está em manutenção por alguns instantes. Se precisar, Rosa continua disponível pelo WhatsApp.</p><a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn mt-8 bg-rose text-white">Falar com a Rosa</a></div></main>; }
