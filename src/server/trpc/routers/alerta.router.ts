import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { painelPorEmail } from "@/src/server/db/repositorios/assinante.repo";
import {
  definirDisputado,
  definirFavorito,
} from "@/src/server/db/repositorios/alerta.repo";
import { assinanteProcedure } from "../assinante";
import { router } from "../trpc";

/** Intenção no histórico: favoritar e "já disputei". */
export const alertaRouter = router({
  favoritar: assinanteProcedure
    .input(z.object({ alertaId: z.string().uuid(), favorito: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const painel = await painelPorEmail(ctx.assinanteEmail);
      if (!painel) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await definirFavorito(painel.id, input.alertaId, input.favorito, new Date());
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true as const };
    }),

  disputar: assinanteProcedure
    .input(z.object({ alertaId: z.string().uuid(), disputado: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const painel = await painelPorEmail(ctx.assinanteEmail);
      if (!painel) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await definirDisputado(painel.id, input.alertaId, input.disputado, new Date());
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true as const };
    }),
});
