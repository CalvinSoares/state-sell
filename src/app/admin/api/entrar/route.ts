import { NextResponse } from "next/server";
import { adminEmails, env } from "@/src/env";
import { assinarSessao, NOME_COOKIE_SESSAO } from "@/src/server/auth/sessao";

/** Comparação de tempo constante para a senha. */
function igualConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Login do backoffice: exige e-mail na allowlist E a senha (ADMIN_PASSWORD).
 * A allowlist sozinha não basta — e-mail não é segredo. Sem ADMIN_PASSWORD
 * configurada, o login é bloqueado em produção (nunca liberar sem 2º fator).
 * Resposta de erro é sempre igual (não confirma o que falhou).
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const base = env.NEXT_PUBLIC_APP_URL;
  const erro = NextResponse.redirect(new URL("/admin/entrar?erro=1", base), { status: 303 });

  const emailOk = Boolean(email) && adminEmails().includes(email);
  const senhaOk = Boolean(env.ADMIN_PASSWORD) && igualConstante(senha, env.ADMIN_PASSWORD!);

  if (!env.AUTH_SECRET || !emailOk || !senhaOk) {
    return erro;
  }

  const token = await assinarSessao(email, env.AUTH_SECRET, Date.now(), { aud: "admin" });
  const resp = NextResponse.redirect(new URL("/admin", base), { status: 303 });
  resp.cookies.set(NOME_COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    // path "/" (não "/admin"): o BFF vive em /api/trpc e precisa receber o cookie.
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return resp;
}
