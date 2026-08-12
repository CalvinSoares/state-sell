import { buscarContratacoes } from "@/src/server/db/repositorios/admin.repo";
import { RAMOS } from "@/content/ramos";
import { AdminNav } from "@/src/shared/components/app/AdminNav";
import { Card, Container, Input } from "@/src/shared/components/ui";

export const dynamic = "force-dynamic";

const ROTULO = new Map(RAMOS.map((r) => [r.slug, r.rotulo]));

/** Busca livre de contratações para diagnóstico. */
export default async function AdminContratacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const resultados = q.trim().length >= 2 ? await buscarContratacoes(q) : [];

  return (
    <main className="py-8">
      <Container size="lg">
        <AdminNav atual="Contratações" />
        <h1 className="text-2xl font-extrabold tracking-tight">Contratações</h1>
        <p className="mt-1 text-suave">Busca por órgão, cidade, objeto ou número de controle.</p>

        <form className="mt-5 flex flex-wrap gap-2" method="get">
          <Input
            name="q"
            defaultValue={q}
            placeholder="ex.: Sorocaba, marmita, 01572…"
            className="min-w-[240px] flex-1"
          />
          <button
            type="submit"
            className="rounded-xl bg-acento px-4 py-2 text-sm font-bold text-sobre-acento"
          >
            Buscar
          </button>
        </form>

        {q.trim().length > 0 && q.trim().length < 2 ? (
          <p className="mt-4 text-sm text-suave">Digite pelo menos 2 caracteres.</p>
        ) : null}

        {q.trim().length >= 2 && resultados.length === 0 ? (
          <Card className="mt-6">
            <p className="m-0 text-suave">Nada encontrado para “{q}”.</p>
          </Card>
        ) : null}

        <ul className="mt-6 grid list-none gap-3 p-0">
          {resultados.map((c) => (
            <li key={c.id}>
              <Card>
                <strong className="block">{c.orgao}</strong>
                <span className="text-sm text-suave">
                  {c.municipio}/{c.uf} · {c.numeroControlePncp}
                </span>
                <p className="mt-2 text-suave">{c.objeto.slice(0, 160)}</p>
                {c.classificacoes.length > 0 ? (
                  <ul className="mt-2 list-none p-0 text-sm">
                    {c.classificacoes.map((cl, i) => (
                      <li key={i} className="mt-1">
                        <span className="font-semibold text-acento">
                          {ROTULO.get(cl.ramoSlug) ?? cl.ramoSlug}
                        </span>
                        <span className="text-suave"> · score {cl.score}</span>
                        <span className="block text-suave">{cl.item.slice(0, 90)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-suave">Sem classificação na versão atual.</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
