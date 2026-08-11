"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/src/shared/trpc/cliente";

export type RamoOpcao = { slug: string; rotulo: string };

/**
 * Estado da rotulagem: fila, item atual, salvar/desfazer.
 * Toda a lógica de queries e mutations vive aqui (fora do componente).
 */
export function useRotular() {
  const utils = api.useUtils();
  const { data: fila, isLoading, refetch } = api.admin.rotular.proximos.useQuery({ tamanho: 20 });
  const { data: progresso } = api.admin.rotular.progresso.useQuery();

  const [indice, setIndice] = useState(0);
  const [historico, setHistorico] = useState<number[]>([]);

  const { mutate: salvar, isPending } = api.admin.rotular.salvar.useMutation({
    onSuccess: () => {
      utils.admin.rotular.progresso.invalidate();
    },
  });

  const lista = fila ?? [];
  const atual = lista[indice];

  // Quando a fila acaba, busca a próxima leva.
  useEffect(() => {
    if (!isLoading && lista.length > 0 && indice >= lista.length) {
      refetch();
      setIndice(0);
      setHistorico([]);
    }
  }, [indice, lista.length, isLoading, refetch]);

  const rotularAtual = useCallback(
    (ramoEsperado: string | null) => {
      if (!atual) return;
      salvar({
        descricaoItem: atual.descricaoItem,
        objetoCompra: atual.objetoCompra,
        ramoEsperado,
        origemAmostra: atual.origemAmostra,
        viuPalpite: false,
      });
      setHistorico((h) => [...h, indice]);
      setIndice((i) => i + 1);
    },
    [atual, indice, salvar],
  );

  const pular = useCallback(() => {
    setHistorico((h) => [...h, indice]);
    setIndice((i) => i + 1);
  }, [indice]);

  const desfazer = useCallback(() => {
    setHistorico((h) => {
      if (h.length === 0) return h;
      const ultimo = h[h.length - 1]!;
      setIndice(ultimo);
      return h.slice(0, -1);
    });
  }, []);

  const restantes = Math.max(0, lista.length - indice);
  const totalRotulados = useMemo(
    () => (progresso ?? []).reduce((s, p) => s + p.total, 0),
    [progresso],
  );

  return {
    atual,
    isLoading,
    isPending,
    restantes,
    progresso: progresso ?? [],
    totalRotulados,
    podeDesfazer: historico.length > 0,
    rotularAtual,
    pular,
    desfazer,
  };
}
