import { z } from "zod";
import { VERSAO_CATALOGO } from "@/src/shared/types/ramo";
import { RAMOS } from "@/content/ramos";
import { montarFila } from "@/src/server/rotulagem/fila";
import { melhorRamo } from "@/src/server/casamento/casar";
import {
  candidatosParaRotular,
  progressoRotulagem,
  salvarRotulo,
} from "@/src/server/db/repositorios/rotulo.repo";
import { listarAssinantes, ultimasExecucoes } from "@/src/server/db/repositorios/admin.repo";
import { adminProcedure } from "../admin";
import { router } from "../trpc";

const SLUGS = RAMOS.map((r) => r.slug) as [string, ...string[]];

export const adminRouter = router({
  rotular: router({
    /** Fila priorizada de itens a rotular. Modo cego por padrão (sem palpite). */
    proximos: adminProcedure
      .input(z.object({ tamanho: z.number().int().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        const candidatos = await candidatosParaRotular(VERSAO_CATALOGO, 2000);
        const fila = montarFila(candidatos, input.tamanho);
        // Modo cego: não devolvemos ramoSugerido/score para não enviesar o rótulo.
        return fila.map((f) => ({
          hashTexto: f.hashTexto,
          descricaoItem: f.descricaoItem,
          objetoCompra: f.objetoCompra,
          unidadeMedida: f.unidadeMedida,
          municipioNome: f.municipioNome,
          origemAmostra: f.origemAmostra,
        }));
      }),

    /**
     * Palpite do robô para UM item, sob demanda. Fica fora de `proximos` de
     * propósito: o modo cego não pode nem trafegar o palpite. Revelar é ato
     * deliberado do operador (registrado em viu_palpite no salvar).
     */
    palpite: adminProcedure
      .input(
        z.object({
          descricaoItem: z.string(),
          objetoCompra: z.string(),
          unidadeMedida: z.string().nullable().optional(),
        }),
      )
      .query(({ input }) => {
        const m = melhorRamo(
          {
            descricaoItem: input.descricaoItem,
            objetoCompra: input.objetoCompra,
            unidadeMedida: input.unidadeMedida ?? undefined,
          },
          RAMOS,
        );
        if (!m) return { ramo: null as string | null, score: 0, termos: [] as string[] };
        return { ramo: m.ramo, score: m.score, termos: m.termosCasados };
      }),

    salvar: adminProcedure
      .input(
        z.object({
          descricaoItem: z.string().min(1),
          objetoCompra: z.string().min(1),
          ramoEsperado: z.enum(SLUGS).nullable(),
          origemAmostra: z.enum(["dirigida", "aleatoria", "feedback", "duvida"]),
          viuPalpite: z.boolean().default(false),
          nota: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        await salvarRotulo({ ...input, rotuladoPor: ctx.adminEmail });
        return { ok: true };
      }),

    progresso: adminProcedure.query(async () => {
      const bruto = await progressoRotulagem();
      const porRamo = new Map(bruto.map((b) => [b.ramo, b.total]));
      return RAMOS.map((r) => ({
        slug: r.slug,
        rotulo: r.rotulo,
        total: porRamo.get(r.slug) ?? 0,
        meta: 200,
      }));
    }),
  }),

  assinantes: router({
    listar: adminProcedure.query(() => listarAssinantes()),
  }),

  jobs: router({
    execucoes: adminProcedure.query(() => ultimasExecucoes()),
  }),
});
