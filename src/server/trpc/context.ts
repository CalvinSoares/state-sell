import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

/** Contexto do tRPC. Sessão do assinante entra com o magic link (Fase 1). */
export function createContext(opts: FetchCreateContextFnOptions) {
  return { headers: opts.req.headers };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
