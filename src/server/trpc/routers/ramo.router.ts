import { RAMOS } from "@/content/ramos";
import { publicProcedure, router } from "../trpc";

/** Catálogo público, para popular os cartões do cadastro (sem jargão). */
export const ramoRouter = router({
  listar: publicProcedure.query(() =>
    RAMOS.map((r) => ({ slug: r.slug, rotulo: r.rotulo, ajuda: r.ajuda })),
  ),
});
