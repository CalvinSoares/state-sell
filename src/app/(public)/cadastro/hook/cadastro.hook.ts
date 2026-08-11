"use client";

import { useState } from "react";
import { api } from "@/src/shared/trpc/cliente";

/** Busca de municípios (autocomplete). Só dispara com 2+ caracteres. */
export function useMunicipios(uf: string, termo: string) {
  const { data } = api.cadastro.buscarMunicipios.useQuery(
    { uf: uf as never, termo },
    { enabled: termo.trim().length >= 2 },
  );
  return data ?? [];
}

/** Estado e submit do cadastro. Lógica fora do componente. */
export function useCadastro() {
  const { data: ramos } = api.ramo.listar.useQuery();
  const { data: faixas } = api.cadastro.faixasTeto.useQuery();
  const { data: ufs } = api.cadastro.ufs.useQuery();

  const [enviado, setEnviado] = useState(false);

  const { mutate, isPending, error } = api.cadastro.criar.useMutation({
    onSuccess: () => setEnviado(true),
  });

  return {
    ramos: ramos ?? [],
    faixas: faixas ?? [],
    ufs: ufs ?? [],
    enviado,
    isPending,
    erro: error?.message ?? null,
    criar: mutate,
  };
}
