import { RAMOS } from "@/content/ramos";
import { prazoTexto } from "@/src/shared/utils/data";
import { linkDoEdital } from "@/src/server/alerta/compor";

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
};

/**
 * Renderização dos avisos + perfil. Compartilhada entre o /painel do assinante
 * e a visão do admin (/admin/assinantes/[id]) — o admin vê exatamente o que a
 * pessoa vê. Sem lógica de dados aqui. Ver backoffice.md.
 */
export function PainelView({ regiao, ramos, alertas, agora, contexto = "assinante" }: Props) {
  const ehAdmin = contexto === "admin";
  return (
    <>
      <section style={cartao}>
        <strong>{ehAdmin ? "Perfil" : "Seu perfil"}</strong>
        <p style={{ color: "var(--suave)", margin: ".4rem 0 0" }}>
          Atende: {regiao} · Ramos: {ramos.map((s) => ROTULO.get(s) ?? s).join(", ") || "—"}
        </p>
      </section>

      {alertas.length === 0 ? (
        <div style={{ ...cartao, textAlign: "center" }}>
          <p style={{ fontWeight: 600, margin: 0 }}>Nenhum aviso ainda</p>
          <p style={{ color: "var(--suave)", margin: ".35rem 0 0" }}>
            {ehAdmin
              ? `Nada casou ainda para ${regiao}.`
              : `A gente está de olho nas compras de ${regiao}. Algumas semanas passam sem nada — no sábado mandamos um resumo mesmo assim.`}
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: ".75rem", marginTop: "1rem" }}>
          {alertas.map((a) => (
            <li key={a.alertaId} style={cartao}>
              <strong>{ROTULO.get(a.ramoSlug) ?? a.ramoSlug}</strong>
              <span style={{ color: "var(--suave)" }}> · {a.municipioNome}</span>
              <p style={{ margin: ".35rem 0 0" }}>{a.itemDescricao.slice(0, 120)}</p>
              {a.dataEncerramentoProposta ? (
                <p style={{ margin: ".35rem 0 0", fontWeight: 600 }}>
                  Prazo: {prazoTexto(a.dataEncerramentoProposta, agora)}
                </p>
              ) : null}
              <a
                href={linkDoEdital(a.linkSistemaOrigem, a.numeroControlePncp)}
                target="_blank"
                rel="noreferrer"
              >
                Ver o edital
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const cartao: React.CSSProperties = {
  background: "var(--cartao)",
  border: "1px solid var(--borda)",
  borderRadius: 12,
  padding: "1rem 1.15rem",
  marginTop: "1rem",
};
