import { redirect } from "next/navigation";
import { assinanteAtual } from "@/src/server/auth/assinante";
import { painelPorEmail } from "@/src/server/db/repositorios/assinante.repo";
import { alertasDoAssinante } from "@/src/server/db/repositorios/alerta.repo";
import { municipioPorCodigo } from "@/src/server/ibge/municipios";
import { RAMOS } from "@/content/ramos";
import { prazoTexto } from "@/src/shared/utils/data";

export const dynamic = "force-dynamic";

const ROTULO = new Map(RAMOS.map((r) => [r.slug, r.rotulo]));

/** Área do assinante. O middleware garante sessão; aqui só compõe. */
export default async function PainelPage() {
  const email = await assinanteAtual();
  if (!email) redirect("/entrar");

  const dados = await painelPorEmail(email);
  if (!dados) redirect("/entrar");

  const alertas = dados.id ? await alertasDoAssinante(dados.id) : [];
  const agora = new Date();

  const regiao =
    (dados.municipiosIbge?.length ?? 0) === 1
      ? (municipioPorCodigo(dados.municipiosIbge![0]!)?.nome ?? "sua cidade")
      : dados.uf
        ? `todo o estado de ${dados.uf}`
        : "sua região";

  return (
    <main style={{ maxWidth: 720, margin: "3rem auto", padding: "0 1.25rem" }}>
      <p style={{ color: "var(--suave)", margin: 0 }}>{email}</p>
      <h1 style={{ fontSize: "1.6rem", marginTop: ".25rem" }}>Seus avisos</h1>

      <section style={cartao}>
        <strong>Seu perfil</strong>
        <p style={{ color: "var(--suave)", margin: ".4rem 0 0" }}>
          Atende: {regiao} · Ramos:{" "}
          {(dados.ramos ?? []).map((s) => ROTULO.get(s) ?? s).join(", ") || "—"}
        </p>
      </section>

      {alertas.length === 0 ? (
        <div style={{ ...cartao, textAlign: "center" }}>
          <p style={{ fontWeight: 600, margin: 0 }}>Nenhum aviso ainda</p>
          <p style={{ color: "var(--suave)" }}>
            A gente está de olho nas compras de {regiao}. Algumas semanas passam sem nada — no
            sábado mandamos um resumo mesmo assim.
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
              {a.linkSistemaOrigem && a.linkSistemaOrigem !== "SEM PUBLICAÇÃO" ? (
                <a href={a.linkSistemaOrigem} target="_blank" rel="noreferrer">
                  Ver o edital
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const cartao: React.CSSProperties = {
  background: "var(--cartao)",
  border: "1px solid var(--borda)",
  borderRadius: 12,
  padding: "1rem 1.15rem",
  marginTop: "1rem",
};
