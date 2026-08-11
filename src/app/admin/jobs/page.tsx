import { ultimasExecucoes } from "@/src/server/db/repositorios/admin.repo";
import { AdminNav } from "@/src/shared/components/app/AdminNav";
import { Container, cx } from "@/src/shared/components/ui";

export const dynamic = "force-dynamic";

const TH = "px-2 py-1.5 font-semibold";
const TD = "px-2 py-1.5";

/** Saúde da coleta. Sem isso, o produto pode morrer em silêncio. */
export default async function JobsPage() {
  const execucoes = await ultimasExecucoes();

  return (
    <main className="py-8">
      <Container size="lg">
        <AdminNav atual="Jobs" />
        <h1 className="text-xl font-extrabold tracking-tight">Jobs — coleta</h1>
        {execucoes.length === 0 ? (
          <p className="mt-4 text-suave">Nenhuma execução ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-suave">
                  <th className={TH}>Início</th>
                  <th className={TH}>UF/Mod.</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Novas</th>
                  <th className={TH}>Atual.</th>
                  <th className={TH}>Erros</th>
                </tr>
              </thead>
              <tbody>
                {execucoes.map((e) => (
                  <tr key={e.id} className="border-t border-borda">
                    <td className={TD}>{e.iniciadaEm.toLocaleString("pt-BR")}</td>
                    <td className={TD}>
                      {e.uf}/{e.modalidadeId}
                    </td>
                    <td className={cx(TD, e.status === "ok" ? "text-acento" : "text-erro")}>
                      {e.status}
                    </td>
                    <td className={TD}>{e.novas}</td>
                    <td className={TD}>{e.atualizadas}</td>
                    <td className={TD}>{e.erros}</td>
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
