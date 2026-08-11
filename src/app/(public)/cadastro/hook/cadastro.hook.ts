"use client";

import { useState } from "react";
import { api } from "@/src/shared/trpc/cliente";

/** Busca de municípios (autocomplete). Só dispara com 2+ caracteres. */
export function useMunicipios(uf: string, termo: string) {
  const habilitado = termo.trim().length >= 2;
  const { data, isFetching } = api.cadastro.buscarMunicipios.useQuery(
    { uf: uf as never, termo },
    { enabled: habilitado },
  );
  return { sugestoes: data ?? [], buscando: habilitado && isFetching && data === undefined };
}

/** Submit do cadastro. Dados estáticos vêm por props (server-render), não daqui. */
export function useCadastro() {
  const [enviado, setEnviado] = useState(false);

  const { mutate, isPending, error } = api.cadastro.criar.useMutation({
    onSuccess: () => setEnviado(true),
  });

  return {
    enviado,
    isPending,
    erro: error?.message ?? null,
    criar: mutate,
  };
}
