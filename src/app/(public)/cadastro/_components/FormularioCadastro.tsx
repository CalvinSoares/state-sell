"use client";

import { useState } from "react";
import { useCadastro, useMunicipios, usePrevia } from "../hook/cadastro.hook";

type RamoOpcao = { slug: string; rotulo: string; ajuda: string };
type FaixaOpcao = { valor: string; rotulo: string };

type Props = {
  ramos: RamoOpcao[];
  faixas: FaixaOpcao[];
  ufs: string[];
};

/** As 3 perguntas, sem jargão. Dados estáticos via props (server). Ver cadastro-do-assinante.md. */
export function FormularioCadastro({ ramos, faixas, ufs }: Props) {
  const c = useCadastro();
  const [email, setEmail] = useState("");
  const [uf, setUf] = useState("SP");
  const [abrangencia, setAbrangencia] = useState<"cidade" | "estado">("cidade");
  const [cidadeTermo, setCidadeTermo] = useState("");
  const [cidade, setCidade] = useState<{ codigoIbge: string; nome: string } | null>(null);
  const [ramosSel, setRamosSel] = useState<string[]>([]);
  const [teto, setTeto] = useState("");

  const { sugestoes, buscando } = useMunicipios(uf, cidade ? "" : cidadeTermo);

  const { previa, carregando: carregandoPrevia } = usePrevia(
    { uf, abrangencia, codigoMunicipio: cidade?.codigoIbge, ramos: ramosSel, teto },
    c.enviado,
  );

  if (c.enviado) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Cartao>
          <h2 style={{ marginTop: 0 }}>Falta um passo</h2>
          <p style={{ color: "var(--suave)", margin: 0 }}>
            Enviamos um link para o seu e-mail. Abra e confirme para começar a receber os avisos.
          </p>
        </Cartao>

        <PreviaOportunidades previa={previa} carregando={carregandoPrevia} />
      </div>
    );
  }

  const cidadeOk = abrangencia === "estado" || Boolean(cidade);
  const podeEnviar = Boolean(email && uf && cidadeOk && ramosSel.length > 0 && teto && !c.isPending);

  function alternarRamo(slug: string) {
    setRamosSel((r) => (r.includes(slug) ? r.filter((x) => x !== slug) : [...r, slug]));
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
          ramos: ramosSel as never,
          teto: teto as never,
        });
      }}
      style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
    >
      <Pergunta numero={1} titulo="Onde você atende?" ajuda="Sua cidade, ou o estado inteiro.">
        <div style={{ display: "flex", gap: ".5rem", marginBottom: ".75rem", flexWrap: "wrap" }}>
          <select value={uf} onChange={(e) => trocarUf(e.target.value)} style={{ ...campo, width: "auto" }}>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <Selecionavel ativo={abrangencia === "cidade"} onClick={() => setAbrangencia("cidade")} pill>
            Só a minha cidade
          </Selecionavel>
          <Selecionavel ativo={abrangencia === "estado"} onClick={() => setAbrangencia("estado")} pill>
            O estado inteiro
          </Selecionavel>
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
              {buscando ? (
                <p style={{ color: "var(--suave)", fontSize: ".85rem", margin: ".4rem 0 0" }}>
                  buscando cidades…
                </p>
              ) : null}
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
          {ramos.map((r) => (
            <Selecionavel key={r.slug} ativo={ramosSel.includes(r.slug)} onClick={() => alternarRamo(r.slug)}>
              <strong style={{ display: "block" }}>{r.rotulo}</strong>
              <span style={{ display: "block", color: "var(--suave)", fontSize: ".85rem", marginTop: ".15rem" }}>
                {r.ajuda}
              </span>
            </Selecionavel>
          ))}
        </div>
      </Pergunta>

      <Pergunta
        numero={3}
        titulo="Qual o maior pedido que você dá conta?"
        ajuda="Serve para não te avisar de coisa grande demais. Ganhar o que você não consegue cumprir dá multa e pode te impedir de participar das próximas."
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
          {faixas.map((f) => (
            <Selecionavel key={f.valor} ativo={teto === f.valor} onClick={() => setTeto(f.valor)} pill>
              {f.rotulo}
            </Selecionavel>
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
        {c.erro ? <p style={{ color: "var(--erro)", marginTop: ".5rem" }}>{c.erro}</p> : null}
      </div>
    </form>
  );
}

type PreviaData = {
  total: number;
  itens: {
    titulo: string;
    item: string;
    valor: string | null;
    prazo: string | null;
    exclusivo: boolean;
  }[];
};

/** "Olha o que já está aberto pra você" — o momento que faz a pessoa acreditar. */
function PreviaOportunidades({
  previa,
  carregando,
}: {
  previa: PreviaData | undefined;
  carregando: boolean;
}) {
  if (carregando) {
    return (
      <p style={{ color: "var(--suave)" }}>Procurando o que já está aberto para você agora…</p>
    );
  }
  if (!previa || previa.itens.length === 0) {
    return (
      <Cartao>
        <strong>Nada aberto exatamente pra você neste momento.</strong>
        <p style={{ color: "var(--suave)", margin: ".4rem 0 0" }}>
          É normal — as compras aparecem o tempo todo. Assim que surgir algo que serve, você recebe
          o e-mail. No sábado a gente manda um resumo de qualquer jeito.
        </p>
      </Cartao>
    );
  }
  return (
    <div>
      <h2 style={{ fontSize: "1.15rem", margin: "0 0 .25rem" }}>
        Olha o que <span style={{ color: "var(--acento)" }}>já está aberto</span> pra você agora
      </h2>
      <p style={{ color: "var(--suave)", margin: "0 0 1rem", fontSize: ".9rem" }}>
        Isso é o tipo de aviso que vai chegar no seu e-mail. Acontece todo dia.
      </p>
      <div style={{ display: "grid", gap: ".75rem" }}>
        {previa.itens.map((o, i) => (
          <div key={i} style={{ ...cartaoBase, borderLeft: "3px solid var(--acento)" }}>
            <strong>{o.titulo}.</strong>
            <p style={{ margin: ".35rem 0 0", color: "var(--suave)" }}>{o.item}</p>
            {o.valor ? <p style={{ margin: ".15rem 0 0", color: "var(--suave)" }}>{o.valor}.</p> : null}
            {o.exclusivo ? (
              <p style={{ margin: ".15rem 0 0", color: "var(--acento)", fontWeight: 600 }}>
                Exclusivo para micro e pequena empresa.
              </p>
            ) : null}
            {o.prazo ? <p style={{ margin: ".35rem 0 0", fontWeight: 600 }}>Prazo: {o.prazo}.</p> : null}
          </div>
        ))}
      </div>
      {previa.total > previa.itens.length ? (
        <p style={{ color: "var(--suave)", marginTop: ".75rem", fontSize: ".9rem" }}>
          E mais {previa.total - previa.itens.length} abertas agora. Confirme seu e-mail para receber
          na hora certa.
        </p>
      ) : null}
    </div>
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

/** Botão selecionável (chip ou card). Tema-aware. */
function Selecionavel({
  children,
  ativo,
  onClick,
  pill = false,
}: {
  children: React.ReactNode;
  ativo: boolean;
  onClick: () => void;
  pill?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: pill ? ".55rem .9rem" : ".8rem",
        borderRadius: pill ? 999 : 10,
        cursor: "pointer",
        border: ativo ? "2px solid var(--acento)" : "1px solid var(--borda)",
        background: ativo ? "var(--acento-suave)" : "var(--cartao)",
        color: "var(--tinta)",
        whiteSpace: pill ? "nowrap" : "normal",
      }}
    >
      {children}
    </button>
  );
}

function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--borda)", borderRadius: 12, padding: "1.5rem", background: "var(--cartao)" }}>
      {children}
    </div>
  );
}

const cartaoBase: React.CSSProperties = {
  background: "var(--cartao)",
  border: "1px solid var(--borda)",
  borderRadius: 12,
  padding: "1rem 1.15rem",
};

const campo: React.CSSProperties = {
  width: "100%",
  padding: ".7rem",
  borderRadius: 8,
};

const listaSugestoes: React.CSSProperties = {
  listStyle: "none",
  margin: ".25rem 0 0",
  padding: ".25rem",
  border: "1px solid var(--borda)",
  borderRadius: 8,
  background: "var(--cartao)",
  position: "absolute",
  width: "100%",
  zIndex: 10,
  maxHeight: 220,
  overflowY: "auto",
  boxShadow: "var(--sombra)",
};

const itemSugestao: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: ".5rem .6rem",
  border: 0,
  background: "none",
  color: "var(--tinta)",
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
    background: ativo ? "var(--acento)" : "var(--desabilitado-bg)",
    color: ativo ? "#fff" : "var(--desabilitado-tinta)",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: ativo ? "pointer" : "default",
  };
}
