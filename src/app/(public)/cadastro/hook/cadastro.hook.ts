"use client";

import { useState } from "react";
import { api } from "@/src/shared/trpc/cliente";

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
