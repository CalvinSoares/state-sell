"use client";

import { useEffect } from "react";
import { Card, Container, cx } from "@/src/shared/components/ui";
import { AdminNav } from "@/src/shared/components/app/AdminNav";
import { useRotular, type RamoOpcao } from "../hook/rotular.hook";

/**
 * Tela de rotulagem. Atalhos: 1-9 ramo, 0 nenhum, ? pular, U desfazer.
 * Modo cego: não mostra o palpite do robô. Ver backoffice.md.
 */
export function Rotulador({ ramos }: { ramos: RamoOpcao[] }) {
  const r = useRotular();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        const ramo = ramos[idx];
        if (ramo) r.rotularAtual(ramo.slug);
      } else if (e.key === "0") {
        r.rotularAtual(null);
      } else if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        r.pular();
      } else if (e.key.toLowerCase() === "u") {
        r.desfazer();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ramos, r]);

  if (r.isLoading) return <Centro>Carregando a fila…</Centro>;
  if (!r.atual) {
    return (
      <Centro>
        <p>Fila vazia. Nada para rotular agora.</p>
        <p className="text-suave">
          Rode a coleta e o casamento, ou volte quando houver itens novos.
        </p>
      </Centro>
    );
  }

  const item = r.atual;

  return (
    <main className="py-8">
      <Container size="md">
        <AdminNav atual="Rotular" />
        <BarraProgresso restantes={r.restantes} total={r.totalRotulados} progresso={r.progresso} />

        <Card className="mt-4">
          <span className="text-[.7rem] uppercase tracking-[.05em] text-suave">
            {rotuloOrigem(item.origemAmostra)}
          </span>

          <p className="mt-2 text-xl font-semibold">{item.descricaoItem}</p>

          <p className="mt-3 text-[.95rem] text-suave">
            <strong className="text-tinta">Objeto:</strong> {item.objetoCompra}
          </p>

          <p className="mt-2 text-sm text-suave">
            {item.municipioNome}
            {item.unidadeMedida ? ` · unidade: ${item.unidadeMedida}` : ""}
          </p>

          {r.palpite === null ? (
            <button
              type="button"
              onClick={r.verPalpite}
              className="mt-4 cursor-pointer rounded-lg border border-dashed border-borda bg-transparent px-2.5 py-1.5 text-xs text-suave"
            >
              ver o palpite do robô (enviesa — fica registrado)
            </button>
          ) : (
            <p className="mt-4 rounded-lg bg-acento-suave px-3 py-2.5 text-sm">
              Palpite: <strong>{r.palpite.ramo ?? "nenhum ramo"}</strong>
              {r.palpite.ramo ? ` (score ${r.palpite.score.toFixed(2)})` : ""}
              {r.palpite.termos.length ? ` · termos: ${r.palpite.termos.slice(0, 4).join(", ")}` : ""}
            </p>
          )}
        </Card>

        <div className="mt-5 flex flex-wrap gap-2">
          {ramos.map((ramo, i) => (
            <Botao key={ramo.slug} onClick={() => r.rotularAtual(ramo.slug)} disabled={r.isPending}>
              <kbd>{i + 1}</kbd> {ramo.rotulo}
            </Botao>
          ))}
          <Botao onClick={() => r.rotularAtual(null)} disabled={r.isPending} variante="neutro">
            <kbd>0</kbd> nenhum
          </Botao>
          <Botao onClick={r.pular} disabled={r.isPending} variante="fantasma">
            <kbd>?</kbd> pular
          </Botao>
          <Botao onClick={r.desfazer} disabled={!r.podeDesfazer} variante="fantasma">
            <kbd>U</kbd> desfazer
          </Botao>
        </div>

        <p className="mt-6 text-xs text-suave">
          Modo cego: a tela não mostra o palpite do robô — seu rótulo é a régua. {r.restantes} nesta
          leva.
        </p>
      </Container>
    </main>
  );
}

function rotuloOrigem(o: string): string {
  if (o === "feedback") return "veio de feedback de assinante";
  if (o === "aleatoria") return "amostra aleatória";
  return "caso dirigido";
}

function BarraProgresso({
  restantes,
  total,
  progresso,
}: {
  restantes: number;
  total: number;
  progresso: { slug: string; rotulo: string; total: number; meta: number }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <strong>Rotular</strong>
      <span className="text-sm text-suave">
        {total} rótulos no total · {restantes} na fila
      </span>
      <span className="flex-1" />
      {progresso.map((p) => (
        <span key={p.slug} className="text-xs text-suave" title={p.rotulo}>
          {p.slug} {p.total}/{p.meta}
        </span>
      ))}
    </div>
  );
}

const BOTAO_VARIANTE = {
  acento: "bg-acento text-sobre-acento border border-acento",
  neutro: "bg-acento-suave text-tinta border border-borda",
  fantasma: "bg-transparent text-suave border border-borda",
} as const;

function Botao({
  children,
  onClick,
  disabled,
  variante = "acento",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variante?: keyof typeof BOTAO_VARIANTE;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "rounded-[9px] px-3.5 py-2 text-sm transition-colors",
        "cursor-pointer disabled:cursor-default disabled:opacity-50",
        BOTAO_VARIANTE[variante],
      )}
    >
      {children}
    </button>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <main className="py-8">
      <Container size="sm">
        <AdminNav atual="Rotular" />
        <div className="mt-16 text-center">{children}</div>
      </Container>
    </main>
  );
}
