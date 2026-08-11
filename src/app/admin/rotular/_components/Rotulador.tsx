"use client";

import { useEffect } from "react";
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
        <p style={{ color: "var(--suave)" }}>
          Rode a coleta e o casamento, ou volte quando houver itens novos.
        </p>
      </Centro>
    );
  }

  const item = r.atual;

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1.25rem" }}>
      <BarraProgresso restantes={r.restantes} total={r.totalRotulados} progresso={r.progresso} />

      <section
        style={{
          border: "1px solid var(--borda)",
          borderRadius: 14,
          padding: "1.5rem",
          marginTop: "1rem",
          background: "var(--cartao)",
        }}
      >
        <span
          style={{
            fontSize: ".7rem",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            color: "var(--suave)",
          }}
        >
          {rotuloOrigem(item.origemAmostra)}
        </span>

        <p style={{ fontSize: "1.25rem", fontWeight: 600, margin: ".5rem 0 0" }}>
          {item.descricaoItem}
        </p>

        <p style={{ color: "var(--suave)", marginTop: ".75rem", fontSize: ".95rem" }}>
          <strong style={{ color: "var(--tinta)" }}>Objeto:</strong> {item.objetoCompra}
        </p>

        <p style={{ color: "var(--suave)", fontSize: ".85rem", marginTop: ".5rem" }}>
          {item.municipioNome}
          {item.unidadeMedida ? ` · unidade: ${item.unidadeMedida}` : ""}
        </p>

        {r.palpite === null ? (
          <button
            type="button"
            onClick={r.verPalpite}
            style={{
              marginTop: "1rem",
              border: "1px dashed var(--borda)",
              background: "transparent",
              color: "var(--suave)",
              borderRadius: 8,
              padding: ".4rem .7rem",
              cursor: "pointer",
              fontSize: ".8rem",
            }}
          >
            ver o palpite do robô (enviesa — fica registrado)
          </button>
        ) : (
          <p
            style={{
              marginTop: "1rem",
              padding: ".6rem .8rem",
              borderRadius: 8,
              background: "var(--acento-suave)",
              fontSize: ".85rem",
            }}
          >
            Palpite: <strong>{r.palpite.ramo ?? "nenhum ramo"}</strong>
            {r.palpite.ramo ? ` (score ${r.palpite.score.toFixed(2)})` : ""}
            {r.palpite.termos.length ? ` · termos: ${r.palpite.termos.slice(0, 4).join(", ")}` : ""}
          </p>
        )}
      </section>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".5rem",
          marginTop: "1.25rem",
        }}
      >
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

      <p style={{ color: "var(--suave)", fontSize: ".8rem", marginTop: "1.5rem" }}>
        Modo cego: a tela não mostra o palpite do robô — seu rótulo é a régua. {r.restantes} nesta
        leva.
      </p>
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", alignItems: "center" }}>
      <strong>Rotular</strong>
      <span style={{ color: "var(--suave)", fontSize: ".85rem" }}>
        {total} rótulos no total · {restantes} na fila
      </span>
      <span style={{ flex: 1 }} />
      {progresso.map((p) => (
        <span key={p.slug} style={{ fontSize: ".75rem", color: "var(--suave)" }} title={p.rotulo}>
          {p.slug} {p.total}/{p.meta}
        </span>
      ))}
    </div>
  );
}

function Botao({
  children,
  onClick,
  disabled,
  variante = "acento",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variante?: "acento" | "neutro" | "fantasma";
}) {
  const cor =
    variante === "acento"
      ? { background: "var(--acento)", color: "#fff", border: "1px solid var(--acento)" }
      : variante === "neutro"
        ? { background: "var(--acento-suave)", color: "var(--tinta)", border: "1px solid var(--borda)" }
        : { background: "transparent", color: "var(--suave)", border: "1px solid var(--borda)" };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...cor,
        padding: ".55rem .9rem",
        borderRadius: 9,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontSize: ".9rem",
      }}
    >
      {children}
    </button>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 560,
        margin: "6rem auto",
        padding: "0 1.25rem",
        textAlign: "center",
      }}
    >
      {children}
    </main>
  );
}
