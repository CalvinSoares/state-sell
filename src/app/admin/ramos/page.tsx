import Link from "next/link";
import { RAMOS } from "@/content/ramos";
import { progressoRotulagem } from "@/src/server/db/repositorios/rotulo.repo";
import { VERSAO_CATALOGO } from "@/src/shared/types/ramo";
import { AdminNav } from "@/src/shared/components/app/AdminNav";
import { Card, Container } from "@/src/shared/components/ui";

export const dynamic = "force-dynamic";

const META_ROTULOS = 60;

/** Resumo read-only dos ramos + progresso de rotulagem. */
export default async function AdminRamosPage() {
  const progresso = await progressoRotulagem();
  const porRamo = new Map(progresso.map((p) => [p.ramo, p.total]));

  return (
    <main className="py-8">
      <Container size="md">
        <AdminNav atual="Ramos" />
        <h1 className="text-2xl font-extrabold tracking-tight">Ramos</h1>
        <p className="mt-1 text-suave">
          Catálogo versão {VERSAO_CATALOGO}. Meta ~{META_ROTULOS} rótulos por ramo.
        </p>

        <ul className="mt-6 grid list-none gap-3 p-0">
          {RAMOS.map((r) => {
            const total = porRamo.get(r.slug) ?? 0;
            const pct = Math.min(100, Math.round((total / META_ROTULOS) * 100));
            return (
              <li key={r.slug}>
                <Card>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong>{r.rotulo}</strong>
                    <span className="text-sm text-suave">
                      {total} rótulo{total === 1 ? "" : "s"} · {pct}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-suave">{r.ajuda}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-borda">
                    <div
                      className="h-full rounded-full bg-acento"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-sm text-suave">
          <Link className="text-acento" href="/admin/rotular">
            Ir para rotulagem →
          </Link>
        </p>
      </Container>
    </main>
  );
}
