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

export type PerfilPrevia = {
  uf: string;
  abrangencia: "cidade" | "estado";
  codigoMunicipio?: string;
  ramos: string[];
  teto: string;
};

/** Prévia "o que já está aberto pra você". Só busca quando habilitada e válida. */
export function usePrevia(perfil: PerfilPrevia, habilitado: boolean) {
  const valido = Boolean(perfil.uf && perfil.ramos.length > 0 && perfil.teto);
  const { data, isLoading } = api.cadastro.previa.useQuery(
    {
      uf: perfil.uf as never,
      abrangencia: perfil.abrangencia,
      codigoMunicipio: perfil.codigoMunicipio,
      ramos: perfil.ramos as never,
      teto: perfil.teto as never,
    },
    { enabled: habilitado && valido },
  );
  return { previa: data, carregando: habilitado && valido && isLoading };
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
