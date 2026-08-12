"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Chip, Input, Select } from "@/src/shared/components/ui";
import { useMunicipios } from "@/src/app/(public)/cadastro/hook/cadastro.hook";
import { useAtualizarPerfil } from "../hook/perfil.hook";

type RamoOpcao = { slug: string; rotulo: string; ajuda: string };
type FaixaOpcao = { valor: string; rotulo: string };

type Props = {
  ramos: RamoOpcao[];
  faixas: FaixaOpcao[];
  ufs: string[];
  inicial: {
    uf: string;
    abrangencia: "cidade" | "estado";
    codigoMunicipio?: string;
    cidadeNome?: string | null;
    ramos: string[];
    teto: string;
  };
};

/** Mesmas 3 perguntas do cadastro, sem e-mail — edição do perfil logado. */
export function FormularioPerfil({ ramos, faixas, ufs, inicial }: Props) {
  const a = useAtualizarPerfil();
  const [uf, setUf] = useState(inicial.uf);
  const [abrangencia, setAbrangencia] = useState<"cidade" | "estado">(inicial.abrangencia);
  const [cidadeTermo, setCidadeTermo] = useState("");
  const [cidade, setCidade] = useState<{ codigoIbge: string; nome: string } | null>(
    inicial.codigoMunicipio && inicial.cidadeNome
      ? { codigoIbge: inicial.codigoMunicipio, nome: inicial.cidadeNome }
      : null,
  );
  const [ramosSel, setRamosSel] = useState<string[]>(inicial.ramos);
  const [teto, setTeto] = useState(inicial.teto);

  const { sugestoes, buscando } = useMunicipios(uf, cidade ? "" : cidadeTermo);

  const cidadeOk = abrangencia === "estado" || Boolean(cidade);
  const podeEnviar = Boolean(uf && cidadeOk && ramosSel.length > 0 && teto && !a.isPending);

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
        a.atualizar({
          uf: uf as never,
          abrangencia,
          codigoMunicipio: cidade?.codigoIbge,
          ramos: ramosSel as never,
          teto: teto as never,
        });
      }}
      className="flex flex-col gap-8"
    >
      <section>
        <h2 className="mb-1 text-lg font-bold">
          <span className="text-acento">1.</span> Onde você atende?
        </h2>
        <p className="mb-3 text-sm text-suave">Sua cidade, ou o estado inteiro.</p>
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
              {buscando ? <p className="mt-1.5 text-sm text-suave">buscando cidades…</p> : null}
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
      </section>

      <section>
        <h2 className="mb-1 text-lg font-bold">
          <span className="text-acento">2.</span> O que você vende?
        </h2>
        <p className="mb-3 text-sm text-suave">
          Escolha o que mais parece com o que você faz. Pode marcar mais de um.
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ramos.map((r) => (
            <Chip key={r.slug} ativo={ramosSel.includes(r.slug)} onClick={() => alternarRamo(r.slug)}>
              <strong className="block">{r.rotulo}</strong>
              <span className="mt-0.5 block text-sm text-suave">{r.ajuda}</span>
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-bold">
          <span className="text-acento">3.</span> Qual o maior pedido que você dá conta?
        </h2>
        <p className="mb-3 text-sm text-suave">
          Serve para não te avisar de coisa grande demais.
        </p>
        <div className="flex flex-wrap gap-2">
          {faixas.map((f) => (
            <Chip key={f.valor} ativo={teto === f.valor} onClick={() => setTeto(f.valor)} pill>
              {f.rotulo}
            </Chip>
          ))}
        </div>
      </section>

      <div>
        <Button type="submit" tamanho="lg" className="w-full" disabled={!podeEnviar}>
          {a.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
        <p className="mt-3 text-center text-sm text-suave">
          Vale para os avisos daqui pra frente.{" "}
          <Link className="text-acento" href="/painel">
            Voltar aos avisos
          </Link>
        </p>
        {a.erro ? <p className="mt-2 text-erro">{a.erro}</p> : null}
      </div>
    </form>
  );
}
