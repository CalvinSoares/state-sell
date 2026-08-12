import Link from "next/link";
import { RAMOS } from "@/content/ramos";
import { prazoTexto } from "@/src/shared/utils/data";
import { linkDoEdital } from "@/src/server/alerta/compor";
import { Card } from "@/src/shared/components/ui";
import { SimulacaoBloco, type ItemSimulacao } from "./SimulacaoView";

const ROTULO = new Map(RAMOS.map((r) => [r.slug, r.rotulo]));

export type AlertaView = {
  alertaId: string;
  ramoSlug: string;
  municipioNome: string;
  itemDescricao: string;
  dataEncerramentoProposta: Date | null;
  linkSistemaOrigem: string | null;
  numeroControlePncp: string;
};

type Props = {
  regiao: string;
  ramos: string[];
  alertas: AlertaView[];
  agora: Date;
  /** "assinante" (linguagem em 1ª pessoa) ou "admin" (visão de fora). */
  contexto?: "assinante" | "admin";
  /** Simulação histórica (15d painel / 30d admin). */
  simulacao?: { dias: number; total: number; itens: ItemSimulacao[] };
};

/**
 * Renderização dos avisos + perfil. Compartilhada entre o /painel do assinante
 * e a visão do admin (/admin/assinantes/[id]) — o admin vê exatamente o que a
 * pessoa vê. Sem lógica de dados aqui. Ver backoffice.md.
 */
export function PainelView({
  regiao,
  ramos,
  alertas,
  agora,
  contexto = "assinante",
  simulacao,
}: Props) {
  const ehAdmin = contexto === "admin";
  return (
    <>
      <Card className="mt-4">
        <strong>{ehAdmin ? "Perfil" : "Seu perfil"}</strong>
        <p className="mt-1.5 text-suave">
          Atende: {regiao} · Ramos: {ramos.map((s) => ROTULO.get(s) ?? s).join(", ") || "—"}
        </p>
        {!ehAdmin ? (
          <p className="mt-2 text-sm">
            <Link className="text-acento" href="/perfil">
              Mudar o que eu vendo / onde atendo
            </Link>
            {" · "}
            <Link className="text-acento" href="/certidoes">
              Cofre de certidões
            </Link>
            {" · "}
            <Link className="text-acento" href="/trilha">
              Como participar da primeira vez
            </Link>
          </p>
        ) : null}
      </Card>

      {alertas.length === 0 ? (
        <Card className="mt-4 text-center">
          <p className="m-0 font-semibold">Nenhum aviso ainda</p>
          <p className="mt-1.5 text-suave">
            {ehAdmin
              ? `Nada casou ainda para ${regiao}.`
              : `A gente está de olho nas compras de ${regiao}. Algumas semanas passam sem nada — no sábado mandamos um resumo mesmo assim.`}
          </p>
        </Card>
      ) : (
        <ul className="mt-4 grid list-none gap-3 p-0">
          {alertas.map((a) => (
            <li key={a.alertaId}>
              <Card>
                <strong>{ROTULO.get(a.ramoSlug) ?? a.ramoSlug}</strong>
                <span className="text-suave"> · {a.municipioNome}</span>
                <p className="mt-1.5">{a.itemDescricao.slice(0, 120)}</p>
                {a.dataEncerramentoProposta ? (
                  <p className="mt-1.5 font-semibold">
                    Prazo: {prazoTexto(a.dataEncerramentoProposta, agora)}
                  </p>
                ) : null}
                <a
                  className="mt-2 inline-block text-acento"
                  href={linkDoEdital(a.linkSistemaOrigem, a.numeroControlePncp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver o edital
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {simulacao ? (
        <SimulacaoBloco
          dias={simulacao.dias}
          total={simulacao.total}
          itens={simulacao.itens}
          contexto={contexto}
        />
      ) : null}
    </>
  );
}
