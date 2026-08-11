import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Logo } from "@/components/logo";
import { login } from "./actions";

export const metadata: Metadata = { title: "Login administrativo", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const query = await searchParams;
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f3f4f6] p-5"><div className="absolute inset-x-0 top-0 h-72 bg-[#0d172b]"/><div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl"><div className="flex h-52 items-center justify-center bg-[#0d172b] p-8"><Logo light /></div><div className="p-7 sm:p-9"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#17539b] text-white"><LockKeyhole size={20}/></span><div><h1 className="text-xl font-extrabold text-[#0d172b]">Área Administrativa</h1><p className="mt-0.5 text-xs text-grafite/55">Meu Apê com Rosa</p></div></div><p className="mt-6 text-sm leading-6 text-grafite/65">Entre para administrar imóveis, leads e conteúdo do portal.</p>{query.erro && <p role="alert" className="mt-5 rounded-xl bg-rose/15 p-3 text-sm font-bold text-petroleo">{query.erro === "configuracao" ? "A conexão segura com o painel ainda está sendo configurada." : "E-mail ou senha inválidos."}</p>}<form action={login} className="mt-6 grid gap-5"><label className="label">E-mail<input className="field" type="email" name="email" required autoComplete="email" defaultValue="rosacorretora16@gmail.com"/></label><label className="label">Senha<input className="field" type="password" name="password" required autoComplete="current-password" placeholder="••••••••"/></label><button className="btn w-full bg-[#17539b] text-white hover:bg-petroleo">Entrar</button></form><Link href="/" className="mt-6 block text-center text-xs font-bold text-rose">← Voltar ao site</Link></div></div></main>;
}
