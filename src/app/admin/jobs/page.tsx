import { ultimasExecucoes } from "@/src/server/db/repositorios/admin.repo";

export const dynamic = "force-dynamic";

/** Saúde da coleta. Sem isso, o produto pode morrer em silêncio. */
export default async function JobsPage() {
  const execucoes = await ultimasExecucoes();

  return (
    <main style={{ maxWidth: 820, margin: "2rem auto", padding: "0 1.25rem" }}>
      <h1 style={{ fontSize: "1.4rem" }}>Jobs — coleta</h1>
      {execucoes.length === 0 ? (
        <p style={{ color: "var(--suave)" }}>Nenhuma execução ainda.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", fontSize: ".9rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--suave)" }}>
              <th style={th}>Início</th>
              <th style={th}>UF/Mod.</th>
              <th style={th}>Status</th>
              <th style={th}>Novas</th>
              <th style={th}>Atual.</th>
              <th style={th}>Erros</th>
            </tr>
          </thead>
          <tbody>
            {execucoes.map((e) => (
              <tr key={e.id} style={{ borderTop: "1px solid var(--borda)" }}>
                <td style={td}>{e.iniciadaEm.toLocaleString("pt-BR")}</td>
                <td style={td}>
                  {e.uf}/{e.modalidadeId}
                </td>
                <td style={{ ...td, color: e.status === "ok" ? "var(--acento)" : "#b3261e" }}>
                  {e.status}
                </td>
                <td style={td}>{e.novas}</td>
                <td style={td}>{e.atualizadas}</td>
                <td style={td}>{e.erros}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const th: React.CSSProperties = { padding: ".4rem .5rem", fontWeight: 600 };
const td: React.CSSProperties = { padding: ".4rem .5rem" };
