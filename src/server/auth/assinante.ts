import "server-only";
import { cookies } from "next/headers";
import { env } from "@/src/env";
import { NOME_COOKIE_PUBLICO, verificarSessao } from "./sessao";

/** E-mail do assinante logado (sessão da área pública), ou null. */
export async function assinanteAtual(): Promise<string | null> {
  if (!env.AUTH_SECRET) return null;
  const token = (await cookies()).get(NOME_COOKIE_PUBLICO)?.value;
  return verificarSessao(token, env.AUTH_SECRET, Date.now());
}
