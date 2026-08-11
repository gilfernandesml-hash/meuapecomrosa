import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPropertyForm } from "@/components/admin-property-form";
import { createProperty } from "../actions";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const feedback = await searchParams;

  return <>
    <Link href="/admin/imoveis" className="inline-flex items-center gap-2 text-sm font-bold text-petroleo hover:text-rose"><ArrowLeft size={17} /> Voltar para imóveis</Link>
    <p className="eyebrow mt-6">Cadastro completo</p>
    <h1 className="display mt-2 text-5xl font-bold text-petroleo">Novo imóvel</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-grafite/60">Preencha os dados disponíveis. Campos complementares podem ser atualizados depois pela tela de edição.</p>
    {feedback.erro ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800">Não foi possível cadastrar o imóvel. Confira os campos obrigatórios e tente novamente.</p> : null}
    <AdminPropertyForm action={createProperty} mode="create" />
  </>;
}
