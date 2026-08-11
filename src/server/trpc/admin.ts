import { TRPCError } from "@trpc/server";
import { adminEmails, env } from "@/src/env";
import { NOME_COOKIE_SESSAO, verificarSessao } from "@/src/server/auth/sessao";
import { publicProcedure } from "./trpc";

/** Lê o e-mail do admin a partir do cookie de sessão nos headers da requisição. */
async function emailAdmin(headers: Headers): Promise<string | null> {
  if (!env.AUTH_SECRET) return null;
  const cookie = headers.get("cookie") ?? "";
  // âncora (?:^|;\s*) para não casar cookie com nome-sufixo (ex.: xss_sessao=).
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${NOME_COOKIE_SESSAO}=([^;]+)`));
  const token = match?.[1];
  const email = await verificarSessao(token, env.AUTH_SECRET, Date.now());
  if (!email || !adminEmails().includes(email)) return null;
  return email;
}

/** Procedure que exige admin autenticado. Injeta { adminEmail } no ctx. */
export const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const adminEmail = await emailAdmin(ctx.headers);
  if (!adminEmail) throw new TRPCError({ code: "NOT_FOUND" }); // 404, não 403
  return next({ ctx: { ...ctx, adminEmail } });
});
