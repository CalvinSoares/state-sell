import { router } from "../trpc";
import { adminRouter } from "./admin.router";
import { cadastroRouter } from "./cadastro.router";
import { certidaoRouter } from "./certidao.router";
import { perfilRouter } from "./perfil.router";
import { ramoRouter } from "./ramo.router";

/**
 * appRouter — raiz do BFF. Ver docs/base-de-conhecimentos/arquitetura/visao-geral.md
 */
export const appRouter = router({
  ramo: ramoRouter,
  cadastro: cadastroRouter,
  perfil: perfilRouter,
  certidao: certidaoRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
