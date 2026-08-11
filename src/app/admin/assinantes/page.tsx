import Link from "next/link";
import { listarAssinantes } from "@/src/server/db/repositorios/admin.repo";
import { AdminNav } from "@/src/shared/components/app/AdminNav";
import { Container } from "@/src/shared/components/ui";

export const dynamic = "force-dynamic";

const TH = "px-2 py-1.5 font-semibold";
const TD = "px-2 py-1.5";

/** Lista de assinantes. E-mail mascarado na listagem; abre a visão de cada um. */
export default async function AssinantesPage() {
  const assinantes = await listarAssinantes();

  return (
    <main className="py-8">
      <Container size="lg">
        <AdminNav atual="Assinantes" />
        <h1 className="text-xl font-extrabold tracking-tight">Assinantes</h1>
        {assinantes.length === 0 ? (
          <p className="mt-4 text-suave">Nenhum assinante ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-suave">
                  <th className={TH}>E-mail</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Plano</th>
                  <th className={TH}>Cadastro</th>
                  <th className={TH}></th>
                </tr>
              </thead>
              <tbody>
                {assinantes.map((a) => (
                  <tr key={a.id} className="border-t border-borda">
                    <td className={TD}>{a.email}</td>
                    <td className={TD}>{a.status}</td>
                    <td className={TD}>{a.plano}</td>
                    <td className={TD}>{a.criadoEm.toLocaleDateString("pt-BR")}</td>
                    <td className={TD}>
                      <Link href={`/admin/assinantes/${a.id}`} className="text-acento">
                        ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </main>
  );
}
