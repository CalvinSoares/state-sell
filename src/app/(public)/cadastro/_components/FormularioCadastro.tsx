"use client";

import { useState } from "react";
import { Button, Card, Chip, Input, Select } from "@/src/shared/components/ui";
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
      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mt-0 text-xl font-bold">Falta um passo</h2>
          <p className="m-0 text-suave">
            Enviamos um link para o seu e-mail. Abra e confirme para começar a receber os avisos.
          </p>
        </Card>

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
      className="flex flex-col gap-8"
    >
      <Pergunta numero={1} titulo="Onde você atende?" ajuda="Sua cidade, ou o estado inteiro.">
        <div className="mb-3 flex flex-wrap gap-2">
          <Select value={uf} onChange={(e) => trocarUf(e.target.value)}>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
          <Chip ativo={abrangencia === "cidade"} onClick={() => setAbrangencia("cidade")} pill>
            Só a minha cidade
          </Chip>
          <Chip ativo={abrangencia === "estado"} onClick={() => setAbrangencia("estado")} pill>
            O estado inteiro
          </Chip>
        </div>

        {abrangencia === "cidade" ? (
          cidade ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{cidade.nome}</span>
              <button
                type="button"
                onClick={() => {
                  setCidade(null);
                  setCidadeTermo("");
                }}
                className="cursor-pointer border-0 bg-transparent text-acento"
              >
                trocar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Input
                type="text"
                placeholder="digite o nome da sua cidade"
                value={cidadeTermo}
                onChange={(e) => setCidadeTermo(e.target.value)}
                autoComplete="off"
              />
              {buscando ? (
                <p className="mt-1.5 text-sm text-suave">buscando cidades…</p>
              ) : null}
              {sugestoes.length > 0 ? (
                <ul className="absolute z-10 mt-1 max-h-56 w-full list-none overflow-y-auto rounded-lg border border-borda bg-cartao p-1 shadow-[var(--sombra)]">
                  {sugestoes.map((s) => (
                    <li key={s.codigoIbge}>
                      <button
                        type="button"
                        onClick={() => setCidade({ codigoIbge: s.codigoIbge, nome: s.nome })}
                        className="block w-full cursor-pointer rounded-md border-0 bg-transparent px-2.5 py-2 text-left text-tinta hover:bg-acento-suave"
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
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ramos.map((r) => (
            <Chip key={r.slug} ativo={ramosSel.includes(r.slug)} onClick={() => alternarRamo(r.slug)}>
              <strong className="block">{r.rotulo}</strong>
              <span className="mt-0.5 block text-sm text-suave">{r.ajuda}</span>
            </Chip>
          ))}
        </div>
      </Pergunta>

      <Pergunta
        numero={3}
        titulo="Qual o maior pedido que você dá conta?"
        ajuda="Serve para não te avisar de coisa grande demais. Ganhar o que você não consegue cumprir dá multa e pode te impedir de participar das próximas."
      >
        <div className="flex flex-wrap gap-2">
          {faixas.map((f) => (
            <Chip key={f.valor} ativo={teto === f.valor} onClick={() => setTeto(f.valor)} pill>
              {f.rotulo}
            </Chip>
          ))}
        </div>
      </Pergunta>

      <div>
        <Input
          type="email"
          required
          placeholder="seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3"
        />
        <Button type="submit" tamanho="lg" className="w-full" disabled={!podeEnviar}>
          {c.isPending ? "Enviando…" : "Quero ser avisado"}
        </Button>
        <p className="mt-3 text-center text-sm text-suave">
          Ao continuar, você concorda com a{" "}
          <a className="text-acento" href="/privacidade">
            política de privacidade
          </a>
          .
        </p>
        {c.erro ? <p className="mt-2 text-erro">{c.erro}</p> : null}
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
    return <p className="text-suave">Procurando compras abertas na sua região…</p>;
  }
  if (!previa || previa.itens.length === 0) {
    return (
      <Card>
        <strong>Nada aberto pra você neste momento.</strong>
        <p className="mt-1.5 text-suave">
          É comum. As compras vão aparecendo. Quando sair algo do seu ramo, o e-mail chega. No sábado
          mandamos um resumo mesmo se a semana estiver vazia.
        </p>
      </Card>
    );
  }
  return (
    <div>
      <h2 className="mb-1 text-lg font-bold">
        O que <span className="text-acento">já está aberto</span> agora
      </h2>
      <p className="mb-4 text-sm text-suave">É o tipo de aviso que chega no e-mail.</p>
      <div className="grid gap-3">
        {previa.itens.map((o, i) => (
          <Card key={i} className="border-l-4 border-l-acento">
            <strong>{o.titulo}.</strong>
            <p className="mt-1.5 text-suave">{o.item}</p>
            {o.valor ? <p className="mt-0.5 text-suave">{o.valor}.</p> : null}
            {o.exclusivo ? (
              <p className="mt-0.5 font-semibold text-acento">
                Exclusivo para micro e pequena empresa.
              </p>
            ) : null}
            {o.prazo ? <p className="mt-1.5 font-semibold">Prazo: {o.prazo}.</p> : null}
          </Card>
        ))}
      </div>
      {previa.total > previa.itens.length ? (
        <p className="mt-3 text-sm text-suave">
          E mais {previa.total - previa.itens.length} abertas agora. Confirme o e-mail pra receber
          quando surgir a próxima.
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
      <h2 className="mb-1 text-lg font-bold">
        <span className="text-acento">{numero}.</span> {titulo}
      </h2>
      <p className="mb-3 text-sm text-suave">{ajuda}</p>
      {children}
    </section>
  );
}
