"use client";

import { useRouter } from "next/navigation";
import { api } from "@/src/shared/trpc/cliente";

/** Submit da edição de perfil do assinante logado. */
export function useAtualizarPerfil() {
  const router = useRouter();
  const { mutate, isPending, error, isSuccess } = api.perfil.atualizar.useMutation({
    onSuccess: () => {
      router.push("/painel");
      router.refresh();
    },
  });

  return {
    isPending,
    isSuccess,
    erro: error?.message ?? null,
    atualizar: mutate,
  };
}
