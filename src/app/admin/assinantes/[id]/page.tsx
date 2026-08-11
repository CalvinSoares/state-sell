import { notFound } from "next/navigation";
import { painelPorId } from "@/src/server/db/repositorios/assinante.repo";
import { alertasDoAssinante } from "@/src/server/db/repositorios/alerta.repo";
import { regiaoLabel } from "@/src/server/ibge/municipios";
import { AdminNav } from "@/src/shared/components/app/AdminNav";
import { PainelView } from "@/src/shared/components/app/PainelView";

export const dynamic = "force-dynamic";

/** Visão do admin: exatamente o que este assinante vê no painel dele. */
export default async function AssinanteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dados = await painelPorId(id);
  if (!dados) notFound();

  const alertas = await alertasDoAssinante(id);

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1.25rem" }}>
      <AdminNav atual={dados.email} paiHref="/admin/assinantes" paiRotulo="Assinantes" />

      <div
        style={{
          background: "var(--acento-suave)",
          border: "1px solid var(--borda)",
          borderRadius: 10,
          padding: ".7rem .9rem",
          fontSize: ".85rem",
          color: "var(--suave)",
        }}
      >
        Você está vendo o que <strong style={{ color: "var(--tinta)" }}>{dados.email}</strong> vê no
        painel — status <strong style={{ color: "var(--tinta)" }}>{dados.status}</strong>.
      </div>

      <h1 style={{ fontSize: "1.5rem", marginTop: "1rem" }}>Avisos deste assinante</h1>
      <PainelView
        regiao={regiaoLabel(dados.municipiosIbge, dados.uf)}
        ramos={dados.ramos ?? []}
        alertas={alertas}
        agora={new Date()}
        contexto="admin"
      />
    </main>
  );
}
