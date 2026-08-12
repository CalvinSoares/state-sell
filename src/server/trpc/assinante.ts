import { TRPCError } from "@trpc/server";
import { env } from "@/src/env";
import { NOME_COOKIE_PUBLICO, verificarSessao } from "@/src/server/auth/sessao";
import { publicProcedure } from "./trpc";

/** Lê o e-mail do assinante a partir do cookie de sessão nos headers. */
async function emailAssinante(headers: Headers): Promise<string | null> {
  if (!env.AUTH_SECRET) return null;
  const cookie = headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${NOME_COOKIE_PUBLICO}=([^;]+)`));
  const token = match?.[1];
  return verificarSessao(token, env.AUTH_SECRET, Date.now(), "assinante");
}

/** Procedure que exige assinante autenticado. Injeta { assinanteEmail } no ctx. */
export const assinanteProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const assinanteEmail = await emailAssinante(ctx.headers);
  if (!assinanteEmail) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, assinanteEmail } });
});
