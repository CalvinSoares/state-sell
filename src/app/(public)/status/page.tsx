import type { Metadata } from "next";
import { statusColeta } from "@/src/server/db/repositorios/status.repo";
import { horasRestantes } from "@/src/shared/utils/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status do serviço",
  description: "Prova de vida da coleta — se o serviço está lendo os anúncios normalmente.",
  robots: { index: false, follow: false },
};

const LIMITE_ALARME_H = 36;

/** Página pública de prova de vida. O produto é invisível quando funciona. */
export default async function StatusPage() {
  const agora = new Date();
  const s = await statusColeta(agora);

  const horasDesde = s.ultimaColetaOk ? -horasRestantes(s.ultimaColetaOk, agora) : Infinity;
  const saudavel = horasDesde <= LIMITE_ALARME_H;

  return (
    <main style={{ maxWidth: 560, margin: "4rem auto", padding: "0 1.25rem" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Status do serviço</h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".6rem",
          padding: ".9rem 1.1rem",
          borderRadius: 12,
          border: "1px solid var(--borda)",
          background: "var(--cartao)",
          marginTop: "1rem",
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: saudavel ? "var(--acento)" : "var(--erro)",
          }}
        />
        <strong>{saudavel ? "No ar — coletando normalmente" : "Atenção: coleta atrasada"}</strong>
      </div>

      <dl style={{ marginTop: "1.5rem", display: "grid", gap: ".75rem" }}>
        <Linha rotulo="Última coleta bem-sucedida">
          {s.ultimaColetaOk ? s.ultimaColetaOk.toLocaleString("pt-BR") : "ainda não houve"}
        </Linha>
        <Linha rotulo="Compras lidas nas últimas 24h">{s.lidas24h.toLocaleString("pt-BR")}</Linha>
        <Linha rotulo="Novas nas últimas 24h">{s.novas24h.toLocaleString("pt-BR")}</Linha>
        {s.erros24h > 0 ? <Linha rotulo="Erros nas últimas 24h">{s.erros24h}</Linha> : null}
      </dl>

      <p style={{ color: "var(--suave)", fontSize: ".85rem", marginTop: "1.5rem" }}>
        A gente lê as compras publicadas pelas prefeituras várias vezes ao longo do dia. Esta página
        mostra que o robô está de pé.
      </p>
    </main>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
      <dt style={{ color: "var(--suave)" }}>{rotulo}</dt>
      <dd style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>{children}</dd>
    </div>
  );
}
