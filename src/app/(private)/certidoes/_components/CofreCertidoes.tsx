"use client";

import { useState } from "react";
import Link from "next/link";
import { TIPOS_CERTIDAO, type TipoCertidao } from "@/src/shared/config/certidoes";
import { Button, Card, Input, Select } from "@/src/shared/components/ui";
import { useCertidoes } from "../hook/certidoes.hook";

const COR_SITUACAO = {
  ok: { ponto: "bg-acento", texto: "Em dia" },
  atencao: { ponto: "bg-[#c47a00]", texto: "Vence em breve" },
  vencida: { ponto: "bg-erro", texto: "Vencida (pela data que você informou)" },
} as const;

function formatarBr(ymd: string): string {
  const [a, m, d] = ymd.split("-");
  return `${d}/${m}/${a}`;
}

/** Painel do cofre: datas + PDF privado (Vercel Blob). */
export function CofreCertidoes() {
  const c = useCertidoes();
  const [tipo, setTipo] = useState<TipoCertidao>("cnd_federal");
  const [vencimento, setVencimento] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const porTipo = new Map(c.itens.map((i) => [i.tipo, i]));
  const meta = TIPOS_CERTIDAO.find((t) => t.tipo === tipo);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <p className="m-0 text-suave">
          Guarde a <strong className="text-tinta">data de vencimento</strong> que está no documento
          e, se quiser, o PDF. A gente avisa 15 dias e 3 dias antes. Não afirmamos que o órgão ainda
          aceita — a verdade está no emissor.
        </p>
        <p className="mt-2 text-sm text-suave">
          Arquivos ficam privados (só você baixa, logado). Passo a passo de como tirar:{" "}
          <Link className="text-acento" href="/trilha">
            trilha
          </Link>
          .
        </p>
        {!c.uploadDisponivel ? (
          <p className="mt-2 text-sm text-erro">
            Upload de PDF ainda não está ligado neste ambiente. Em produção a Vercel usa
            BLOB_STORE_ID; no PC local precisa de BLOB_READ_WRITE_TOKEN no .env.local.
          </p>
        ) : null}
      </Card>

      {c.carregando ? <p className="text-suave">Carregando…</p> : null}
      {c.erroLista ? <p className="text-erro">{c.erroLista}</p> : null}
      {c.erroUpload ? <p className="text-erro">{c.erroUpload}</p> : null}

      <ul className="grid list-none gap-3 p-0">
        {TIPOS_CERTIDAO.map((t) => {
          const item = porTipo.get(t.tipo);
          const sit = item ? COR_SITUACAO[item.situacao] : null;
          const enviando = c.enviandoArquivoId === item?.id;
          return (
            <li key={t.tipo}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong>{t.rotulo}</strong>
                    <p className="mt-1 text-sm text-suave">{t.ajuda}</p>
                    {t.ondeTirar ? (
                      <a
                        className="mt-1 inline-block text-sm text-acento"
                        href={t.ondeTirar}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Onde tirar →
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-suave">Emissor: {t.emissor}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    {item && sit ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${sit.ponto}`} />
                          {sit.texto}
                        </span>
                        <p className="mt-1 text-suave">Vence em {formatarBr(item.vencimentoEm)}</p>
                        {item.temArquivo ? (
                          <p className="mt-2 flex flex-wrap justify-end gap-2">
                            <a className="text-acento" href={`/api/certidoes/${item.id}/arquivo`}>
                              Baixar PDF
                            </a>
                            <button
                              type="button"
                              className="cursor-pointer border-0 bg-transparent text-suave"
                              onClick={() => c.removerArquivo({ id: item.id })}
                            >
                              Tirar PDF
                            </button>
                          </p>
                        ) : c.uploadDisponivel ? (
                          <label className="mt-2 inline-block cursor-pointer text-acento">
                            {enviando ? "Enviando…" : "Anexar PDF"}
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              className="hidden"
                              disabled={enviando}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void c.enviarPdf(item.id, f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        ) : (
                          <p className="mt-2 text-suave">Sem PDF</p>
                        )}
                        <button
                          type="button"
                          className="mt-2 block w-full cursor-pointer border-0 bg-transparent text-erro"
                          disabled={c.excluindo}
                          onClick={() => c.excluir({ id: item.id })}
                        >
                          Remover certidão
                        </button>
                      </>
                    ) : (
                      <span className="text-suave">Ainda não informada</span>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <section>
        <h2 className="text-lg font-bold">Informar ou atualizar</h2>
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!vencimento) return;
            void (async () => {
              const salva = await c.salvar({ tipo, vencimentoEm: vencimento });
              if (arquivo && salva?.id && c.uploadDisponivel) {
                await c.enviarPdf(salva.id, arquivo);
                setArquivo(null);
              }
            })();
          }}
        >
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCertidao)}>
            {TIPOS_CERTIDAO.map((t) => (
              <option key={t.tipo} value={t.tipo}>
                {t.rotulo}
              </option>
            ))}
          </Select>
          <label className="text-sm">
            <span className="mb-1 block text-suave">Data de vencimento (como no documento)</span>
            <Input
              type="date"
              required
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
            />
          </label>
          {c.uploadDisponivel ? (
            <label className="text-sm">
              <span className="mb-1 block text-suave">PDF (opcional, máx. 5 MB)</span>
              <Input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : null}
          {meta ? <p className="m-0 text-sm text-suave">{meta.ajuda}</p> : null}
          <Button type="submit" disabled={c.salvando || !vencimento || Boolean(c.enviandoArquivoId)}>
            {c.salvando || c.enviandoArquivoId ? "Salvando…" : "Salvar"}
          </Button>
          {c.erroSalvar ? <p className="text-erro">{c.erroSalvar}</p> : null}
        </form>
      </section>
    </div>
  );
}
