import Link from "next/link";
import { listarAlertasAdmin } from "@/src/server/db/repositorios/admin.repo";
import { RAMOS } from "@/content/ramos";
import { AdminNav } from "@/src/shared/components/app/AdminNav";
import { Card, Container } from "@/src/shared/components/ui";

export const dynamic = "force-dynamic";

const ROTULO = new Map(RAMOS.map((r) => [r.slug, r.rotulo]));

/** Lista recente de alertas + feedback. Filtros via querystring. */
export default async function AdminAlertasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; negativo?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status && sp.status !== "todos" ? sp.status : undefined;
  const soFeedbackNegativo = sp.negativo === "1";

  const alertas = await listarAlertasAdmin({ status, soFeedbackNegativo });

  return (
    <main className="py-8">
      <Container size="lg">
        <AdminNav atual="Alertas" />
        <h1 className="text-2xl font-extrabold tracking-tight">Alertas</h1>
        <p className="mt-1 text-suave">Enviados, pendentes e feedback “não era pra mim”.</p>

        <form className="mt-5 flex flex-wrap items-end gap-3" method="get">
          <label className="text-sm">
            <span className="mb-1 block text-suave">Status</span>
            <select
              name="status"
              defaultValue={status ?? "todos"}
              className="rounded-lg border border-borda bg-campo px-3 py-2 text-tinta"
            >
              <option value="todos">Todos</option>
              <option value="enviado">Enviado</option>
              <option value="pendente">Pendente</option>
              <option value="falhou">Falhou</option>
              <option value="suprimido">Suprimido</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-tinta">
            <input type="checkbox" name="negativo" value="1" defaultChecked={soFeedbackNegativo} />
            Só com feedback negativo
          </label>
          <button
            type="submit"
            className="rounded-xl bg-acento px-4 py-2 text-sm font-bold text-sobre-acento"
          >
            Filtrar
          </button>
        </form>

        {alertas.length === 0 ? (
          <Card className="mt-6">
            <p className="m-0 text-suave">Nenhum alerta com esse filtro.</p>
          </Card>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-borda text-suave">
                  <th className="px-2 py-2 font-medium">Quando</th>
                  <th className="px-2 py-2 font-medium">Assinante</th>
                  <th className="px-2 py-2 font-medium">Órgão</th>
                  <th className="px-2 py-2 font-medium">Ramo</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((a) => (
                  <tr key={a.id} className="border-b border-borda">
                    <td className="px-2 py-2.5 whitespace-nowrap text-suave">
                      {(a.enviadoEm ?? a.criadoEm).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-2 py-2.5">{a.email}</td>
                    <td className="px-2 py-2.5">
                      {a.orgao.slice(0, 40)}
                      {a.orgao.length > 40 ? "…" : ""}
                      <span className="block text-suave">{a.municipio}</span>
                    </td>
                    <td className="px-2 py-2.5">{ROTULO.get(a.ramoSlug) ?? a.ramoSlug}</td>
                    <td className="px-2 py-2.5">{a.status}</td>
                    <td className="px-2 py-2.5">
                      {a.feedbackUtil === false ? (
                        <span className="font-semibold text-erro">não era pra mim</span>
                      ) : a.feedbackUtil === true ? (
                        "útil"
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-sm text-suave">
          Feedback negativo vira fila em{" "}
          <Link className="text-acento" href="/admin/rotular">
            Rotular
          </Link>
          .
        </p>
      </Container>
    </main>
  );
}
