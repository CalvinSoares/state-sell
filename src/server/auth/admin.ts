import "server-only";
import { cookies } from "next/headers";
import { adminEmails, env } from "@/src/env";
import { NOME_COOKIE_SESSAO, verificarSessao } from "./sessao";

/** E-mail do admin logado, ou null. Usado por Server Components e actions. */
export async function adminAtual(): Promise<string | null> {
  if (!env.AUTH_SECRET) return null;
  const token = (await cookies()).get(NOME_COOKIE_SESSAO)?.value;
  const email = await verificarSessao(token, env.AUTH_SECRET, Date.now(), "admin");
  if (!email || !adminEmails().includes(email)) return null;
  return email;
}

/** Garante admin; lança se não for. Para uso em actions/rotas. */
export async function exigirAdmin(): Promise<string> {
  const email = await adminAtual();
  if (!email) throw new Error("Não autorizado");
  return email;
}
