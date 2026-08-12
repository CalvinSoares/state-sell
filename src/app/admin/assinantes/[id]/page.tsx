import { notFound } from "next/navigation";
import { painelPorId } from "@/src/server/db/repositorios/assinante.repo";
import { alertasDoAssinante } from "@/src/server/db/repositorios/alerta.repo";
import { simularParaPerfil } from "@/src/server/db/repositorios/simulacao.repo";
import { regiaoLabel } from "@/src/server/ibge/municipios";
import { Container } from "@/src/shared/components/ui";
import { AdminNav } from "@/src/shared/components/app/AdminNav";
import { PainelView } from "@/src/shared/components/app/PainelView";

export const dynamic = "force-dynamic";

/** Visão do admin: exatamente o que este assinante vê no painel dele + simulação 30d. */
export default async function AssinanteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dados = await painelPorId(id);
  if (!dados) notFound();

  const agora = new Date();
  const alertas = await alertasDoAssinante(id);
  const simulacao = await simularParaPerfil(
    {
      assinanteId: dados.id,
      ramos: dados.ramos ?? [],
      municipiosIbge: dados.municipiosIbge ?? [],
      uf: dados.uf,
      tetoValorCentavos: dados.tetoValorCentavos,
    },
    agora,
    30,
  );

  return (
    <main className="py-8">
      <Container size="md">
        <AdminNav atual={dados.email} paiHref="/admin/assinantes" paiRotulo="Assinantes" />

        <div className="rounded-[10px] border border-borda bg-acento-suave px-3.5 py-2.5 text-sm text-suave">
          Você está vendo o que <strong className="text-tinta">{dados.email}</strong> vê no painel —
          status <strong className="text-tinta">{dados.status}</strong>.
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Avisos deste assinante</h1>
        <PainelView
          regiao={regiaoLabel(dados.municipiosIbge, dados.uf)}
          ramos={dados.ramos ?? []}
          alertas={alertas}
          agora={agora}
          contexto="admin"
          simulacao={simulacao}
        />
      </Container>
    </main>
  );
}
