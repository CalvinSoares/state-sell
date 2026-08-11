"use client";

import { useState } from "react";
import { useCadastro, useMunicipios } from "../hook/cadastro.hook";

/** As 3 perguntas, sem jargão. Ver cadastro-do-assinante.md. */
export function FormularioCadastro() {
  const c = useCadastro();
  const [email, setEmail] = useState("");
  const [uf, setUf] = useState("SP");
  const [abrangencia, setAbrangencia] = useState<"cidade" | "estado">("cidade");
  const [cidadeTermo, setCidadeTermo] = useState("");
  const [cidade, setCidade] = useState<{ codigoIbge: string; nome: string } | null>(null);
  const [ramos, setRamos] = useState<string[]>([]);
  const [teto, setTeto] = useState("");

  const sugestoes = useMunicipios(uf, cidade ? "" : cidadeTermo);

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

  const cidadeOk = abrangencia === "estado" || Boolean(cidade);
  const podeEnviar = Boolean(email && uf && cidadeOk && ramos.length > 0 && teto && !c.isPending);

  function alternarRamo(slug: string) {
    setRamos((r) => (r.includes(slug) ? r.filter((x) => x !== slug) : [...r, slug]));
  }

  function trocarUf(novaUf: string) {
    setUf(novaUf);
    setCidade(null);
    setCidadeTermo("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!podeEnviar) return;
        c.criar({
          email,
          uf: uf as never,
          abrangencia,
          codigoMunicipio: cidade?.codigoIbge,
          ramos: ramos as never,
          teto: teto as never,
        });
      }}
      style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
    >
      <Pergunta numero={1} titulo="Onde você atende?" ajuda="Sua cidade, ou o estado inteiro.">
        <div style={{ display: "flex", gap: ".5rem", marginBottom: ".75rem" }}>
          <select value={uf} onChange={(e) => trocarUf(e.target.value)} style={{ ...campo, width: "auto" }}>
            {c.ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <Chip ativo={abrangencia === "cidade"} onClick={() => setAbrangencia("cidade")}>
            Só a minha cidade
          </Chip>
          <Chip ativo={abrangencia === "estado"} onClick={() => setAbrangencia("estado")}>
            O estado inteiro
          </Chip>
        </div>

        {abrangencia === "cidade" ? (
          cidade ? (
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
              <span style={{ fontWeight: 600 }}>{cidade.nome}</span>
              <button
                type="button"
                onClick={() => {
                  setCidade(null);
                  setCidadeTermo("");
                }}
                style={{ border: 0, background: "none", color: "var(--acento)", cursor: "pointer" }}
              >
                trocar
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="digite o nome da sua cidade"
                value={cidadeTermo}
                onChange={(e) => setCidadeTermo(e.target.value)}
                style={campo}
                autoComplete="off"
              />
              {sugestoes.length > 0 ? (
                <ul style={listaSugestoes}>
                  {sugestoes.map((s) => (
                    <li key={s.codigoIbge}>
                      <button
                        type="button"
                        onClick={() => setCidade({ codigoIbge: s.codigoIbge, nome: s.nome })}
                        style={itemSugestao}
                      >
                        {s.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )
        ) : null}
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

function Chip({
  children,
  ativo,
  onClick,
}: {
  children: React.ReactNode;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: ".55rem .9rem",
        borderRadius: 999,
        cursor: "pointer",
        border: ativo ? "2px solid var(--acento)" : "1px solid var(--borda)",
        background: ativo ? "#eef6f0" : "#fff",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
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

const listaSugestoes: React.CSSProperties = {
  listStyle: "none",
  margin: ".25rem 0 0",
  padding: ".25rem",
  border: "1px solid var(--borda)",
  borderRadius: 8,
  background: "#fff",
  position: "absolute",
  width: "100%",
  zIndex: 10,
  maxHeight: 220,
  overflowY: "auto",
  boxShadow: "0 6px 20px rgba(0,0,0,.08)",
};

const itemSugestao: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: ".5rem .6rem",
  border: 0,
  background: "none",
  cursor: "pointer",
  borderRadius: 6,
  fontSize: ".95rem",
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
