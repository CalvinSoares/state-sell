import type { Metadata } from "next";
import { statusColeta } from "@/src/server/db/repositorios/status.repo";
import { horasRestantes } from "@/src/shared/utils/data";
import { Container, cx } from "@/src/shared/components/ui";

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
    <main className="py-16">
      <Container size="md">
        <h1 className="text-2xl font-extrabold tracking-tight">Status do serviço</h1>

        <div className="mt-4 flex items-center gap-2.5 rounded-card border border-borda bg-cartao px-4 py-3.5">
          <span
            className={cx("size-3 rounded-full", saudavel ? "bg-acento" : "bg-erro")}
            aria-hidden
          />
          <strong>{saudavel ? "No ar — coletando normalmente" : "Atenção: coleta atrasada"}</strong>
        </div>

        <dl className="mt-6 grid gap-3">
          <Linha rotulo="Última coleta bem-sucedida">
            {s.ultimaColetaOk ? s.ultimaColetaOk.toLocaleString("pt-BR") : "ainda não houve"}
          </Linha>
          <Linha rotulo="Compras lidas nas últimas 24h">{s.lidas24h.toLocaleString("pt-BR")}</Linha>
          <Linha rotulo="Novas nas últimas 24h">{s.novas24h.toLocaleString("pt-BR")}</Linha>
          {s.erros24h > 0 ? <Linha rotulo="Erros nas últimas 24h">{s.erros24h}</Linha> : null}
        </dl>

        <p className="mt-6 text-sm text-suave">
          A gente lê as compras publicadas pelas prefeituras várias vezes ao longo do dia. Esta
          página mostra que o robô está de pé.
        </p>
      </Container>
    </main>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-suave">{rotulo}</dt>
      <dd className="m-0 text-right font-semibold">{children}</dd>
    </div>
  );
}
