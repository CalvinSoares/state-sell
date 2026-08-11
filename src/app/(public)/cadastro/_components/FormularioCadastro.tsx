"use client";

import { useState } from "react";
import { useCadastro } from "../hook/cadastro.hook";

/** As 3 perguntas, sem jargão. Ver cadastro-do-assinante.md. */
export function FormularioCadastro() {
  const c = useCadastro();
  const [email, setEmail] = useState("");
  const [uf, setUf] = useState("SP");
  const [ramos, setRamos] = useState<string[]>([]);
  const [teto, setTeto] = useState("");

  if (c.enviado) {
    return (
      <Cartao>
        <h2 style={{ marginTop: 0 }}>Falta um passo</h2>
        <p style={{ color: "var(--suave)" }}>
          Enviamos um link para o seu e-mail. Abra e confirme para começar a receber os avisos.
        </p>
      </Cartao>
    );
  }

  const podeEnviar = Boolean(email && uf && ramos.length > 0 && teto && !c.isPending);

  function alternarRamo(slug: string) {
    setRamos((r) => (r.includes(slug) ? r.filter((x) => x !== slug) : [...r, slug]));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!podeEnviar) return;
        c.criar({ email, uf: uf as never, ramos: ramos as never, teto: teto as never, municipiosIbge: [] });
      }}
      style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
    >
      <Pergunta numero={1} titulo="Onde você atende?" ajuda="Escolha o seu estado.">
        <select value={uf} onChange={(e) => setUf(e.target.value)} style={campo}>
          {c.ufs.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </Pergunta>

      <Pergunta
        numero={2}
        titulo="O que você vende?"
        ajuda="Escolha o que mais parece com o que você faz. Pode marcar mais de um."
      >
        <div style={{ display: "grid", gap: ".6rem", gridTemplateColumns: "1fr 1fr" }}>
          {c.ramos.map((r) => {
            const ativo = ramos.includes(r.slug);
            return (
              <button
                type="button"
                key={r.slug}
                onClick={() => alternarRamo(r.slug)}
                style={{
                  textAlign: "left",
                  padding: ".8rem",
                  borderRadius: 10,
                  cursor: "pointer",
                  border: ativo ? "2px solid var(--acento)" : "1px solid var(--borda)",
                  background: ativo ? "#eef6f0" : "#fff",
                }}
              >
                <strong>{r.rotulo}</strong>
                <span style={{ display: "block", color: "var(--suave)", fontSize: ".85rem" }}>
                  {r.ajuda}
                </span>
              </button>
            );
          })}
        </div>
      </Pergunta>

      <Pergunta
        numero={3}
        titulo="Qual o maior pedido que você dá conta?"
        ajuda="Serve para não te avisar de coisa grande demais. Ganhar o que você não consegue cumprir dá multa e pode te impedir de participar das próximas."
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
          {c.faixas.map((f) => (
            <button
              type="button"
              key={f.valor}
              onClick={() => setTeto(f.valor)}
              style={{
                padding: ".55rem .9rem",
                borderRadius: 999,
                cursor: "pointer",
                border: teto === f.valor ? "2px solid var(--acento)" : "1px solid var(--borda)",
                background: teto === f.valor ? "#eef6f0" : "#fff",
              }}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </Pergunta>

      <div>
        <input
          type="email"
          required
          placeholder="seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...campo, marginBottom: ".75rem" }}
        />
        <button type="submit" disabled={!podeEnviar} style={botao(podeEnviar)}>
          {c.isPending ? "Enviando…" : "Quero ser avisado"}
        </button>
        {c.erro ? <p style={{ color: "#b3261e", marginTop: ".5rem" }}>{c.erro}</p> : null}
      </div>
    </form>
  );
}

function Pergunta({
  numero,
  titulo,
  ajuda,
  children,
}: {
  numero: number;
  titulo: string;
  ajuda: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 style={{ fontSize: "1.1rem", margin: "0 0 .25rem" }}>
        <span style={{ color: "var(--acento)" }}>{numero}.</span> {titulo}
      </h2>
      <p style={{ color: "var(--suave)", margin: "0 0 .75rem", fontSize: ".9rem" }}>{ajuda}</p>
      {children}
    </section>
  );
}

function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--borda)", borderRadius: 12, padding: "1.5rem", background: "#fff" }}>
      {children}
    </div>
  );
}

const campo: React.CSSProperties = {
  width: "100%",
  padding: ".7rem",
  borderRadius: 8,
  border: "1px solid var(--borda)",
  fontSize: "1rem",
};

function botao(ativo: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: ".8rem",
    borderRadius: 10,
    border: 0,
    background: ativo ? "var(--acento)" : "#c8c8c2",
    color: "#fff",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: ativo ? "pointer" : "default",
  };
}
