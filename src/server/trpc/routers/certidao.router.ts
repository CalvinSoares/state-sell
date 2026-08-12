import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { TIPOS_CERTIDAO_SLUGS } from "@/src/shared/config/certidoes";
import { painelPorEmail } from "@/src/server/db/repositorios/assinante.repo";
import {
  excluirCertidao,
  listarCertidoes,
  removerArquivoCertidao,
  salvarCertidao,
} from "@/src/server/db/repositorios/certidao.repo";
import { blobConfigurado } from "@/src/server/certidoes/arquivo";
import { situacaoCertidao } from "@/src/server/certidoes/status";
import { assinanteProcedure } from "../assinante";
import { router } from "../trpc";

const VencimentoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato AAAA-MM-DD");

function paraCliente<T extends { arquivoChave: string | null; vencimentoEm: string }>(
  l: T,
  agora: Date,
) {
  const { arquivoChave, ...rest } = l;
  return {
    ...rest,
    temArquivo: Boolean(arquivoChave),
    situacao: situacaoCertidao(l.vencimentoEm, agora),
  };
}

export const certidaoRouter = router({
  listar: assinanteProcedure.query(async ({ ctx }) => {
    const painel = await painelPorEmail(ctx.assinanteEmail);
    if (!painel) throw new TRPCError({ code: "NOT_FOUND" });
    const agora = new Date();
    const linhas = await listarCertidoes(painel.id);
    return {
      uploadDisponivel: blobConfigurado(),
      itens: linhas.map((l) => paraCliente(l, agora)),
    };
  }),

  salvar: assinanteProcedure
    .input(
      z.object({
        tipo: z.enum(TIPOS_CERTIDAO_SLUGS),
        vencimentoEm: VencimentoSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const painel = await painelPorEmail(ctx.assinanteEmail);
      if (!painel) throw new TRPCError({ code: "NOT_FOUND" });
      const salva = await salvarCertidao(painel.id, input.tipo, input.vencimentoEm);
      return paraCliente(salva, new Date());
    }),

  excluir: assinanteProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const painel = await painelPorEmail(ctx.assinanteEmail);
      if (!painel) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await excluirCertidao(painel.id, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Certidão não encontrada" });
      return { ok: true as const };
    }),

  removerArquivo: assinanteProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const painel = await painelPorEmail(ctx.assinanteEmail);
      if (!painel) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await removerArquivoCertidao(painel.id, input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Certidão não encontrada" });
      return { ok: true as const };
    }),
});
