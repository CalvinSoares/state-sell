"use client";

import { useState } from "react";
import { api } from "@/src/shared/trpc/cliente";

export function useCertidoes() {
  const utils = api.useUtils();
  const listar = api.certidao.listar.useQuery();
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const salvar = api.certidao.salvar.useMutation({
    onSuccess: () => utils.certidao.listar.invalidate(),
  });

  const excluir = api.certidao.excluir.useMutation({
    onSuccess: () => utils.certidao.listar.invalidate(),
  });

  const removerArquivo = api.certidao.removerArquivo.useMutation({
    onSuccess: () => utils.certidao.listar.invalidate(),
  });

  async function enviarPdf(certidaoId: string, file: File) {
    setErroUpload(null);
    setUploadingId(certidaoId);
    try {
      const body = new FormData();
      body.set("arquivo", file);
      const resp = await fetch(`/api/certidoes/${certidaoId}/arquivo`, {
        method: "POST",
        body,
      });
      const json = (await resp.json().catch(() => null)) as { erro?: string } | null;
      if (!resp.ok) {
        setErroUpload(json?.erro ?? "Falha no upload");
        return;
      }
      await utils.certidao.listar.invalidate();
    } catch {
      setErroUpload("Falha de rede no upload");
    } finally {
      setUploadingId(null);
    }
  }

  return {
    itens: listar.data?.itens ?? [],
    uploadDisponivel: listar.data?.uploadDisponivel ?? false,
    carregando: listar.isLoading,
    erroLista: listar.error?.message ?? null,
    salvar: salvar.mutateAsync,
    salvando: salvar.isPending,
    erroSalvar: salvar.error?.message ?? null,
    excluir: excluir.mutate,
    excluindo: excluir.isPending,
    removerArquivo: removerArquivo.mutate,
    enviandoArquivoId: uploadingId,
    enviarPdf,
    erroUpload,
  };
}
