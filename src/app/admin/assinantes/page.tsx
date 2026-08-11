import Link from "next/link";
import { listarAssinantes } from "@/src/server/db/repositorios/admin.repo";
import { AdminNav } from "@/src/shared/components/app/AdminNav";

export const dynamic = "force-dynamic";

/** Lista de assinantes. E-mail mascarado na listagem; abre a visão de cada um. */
export default async function AssinantesPage() {
  const assinantes = await listarAssinantes();

  return (
    <main style={{ maxWidth: 820, margin: "2rem auto", padding: "0 1.25rem" }}>
      <AdminNav atual="Assinantes" />
      <h1 style={{ fontSize: "1.4rem" }}>Assinantes</h1>
      {assinantes.length === 0 ? (
        <p style={{ color: "var(--suave)" }}>Nenhum assinante ainda.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", fontSize: ".9rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--suave)" }}>
              <th style={th}>E-mail</th>
              <th style={th}>Status</th>
              <th style={th}>Plano</th>
              <th style={th}>Cadastro</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {assinantes.map((a) => (
              <tr key={a.id} style={{ borderTop: "1px solid var(--borda)" }}>
                <td style={td}>{a.email}</td>
                <td style={td}>{a.status}</td>
                <td style={td}>{a.plano}</td>
                <td style={td}>{a.criadoEm.toLocaleDateString("pt-BR")}</td>
                <td style={td}>
                  <Link href={`/admin/assinantes/${a.id}`} style={{ color: "var(--acento)" }}>
                    ver
                  </Link>
                </td>
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
