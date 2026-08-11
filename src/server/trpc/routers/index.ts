import { router } from "../trpc";
import { adminRouter } from "./admin.router";
import { ramoRouter } from "./ramo.router";

/**
 * appRouter — raiz do BFF. Ver docs/base-de-conhecimentos/arquitetura/visao-geral.md
 * Routers de assinante/perfil/alerta entram conforme as telas da Fase 1.
 */
export const appRouter = router({
  ramo: ramoRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
