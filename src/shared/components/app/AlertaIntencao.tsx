"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { api } from "@/src/shared/trpc/cliente";
import { cx } from "@/src/shared/components/ui";

type Props = {
  alertaId: string;
  favorito: boolean;
  disputado: boolean;
};

/** Favoritar + "já disputei" — intenção no histórico. */
export function AlertaIntencao({ alertaId, favorito, disputado }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const fav = api.alerta.favoritar.useMutation({
    onSuccess: () => start(() => router.refresh()),
  });
  const disp = api.alerta.disputar.useMutation({
    onSuccess: () => start(() => router.refresh()),
  });

  const busy = pending || fav.isPending || disp.isPending;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => fav.mutate({ alertaId, favorito: !favorito })}
        className={cx(
          "cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
          favorito
            ? "border-acento bg-acento-suave text-acento"
            : "border-borda bg-cartao text-suave hover:border-acento hover:text-acento",
        )}
      >
        {favorito ? "Nos favoritos" : "Favoritar"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => disp.mutate({ alertaId, disputado: !disputado })}
        className={cx(
          "cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
          disputado
            ? "border-acento bg-acento-suave text-acento"
            : "border-borda bg-cartao text-suave hover:border-acento hover:text-acento",
        )}
      >
        {disputado ? "Já disputei" : "Marcar que disputei"}
      </button>
    </div>
  );
}
