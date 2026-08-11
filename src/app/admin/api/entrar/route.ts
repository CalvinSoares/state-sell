import { NextResponse } from "next/server";
import { adminEmails, env } from "@/src/env";
import { assinarSessao, NOME_COOKIE_SESSAO } from "@/src/server/auth/sessao";

/**
 * Valida e-mail contra a allowlist e emite cookie de sessão assinado.
 * Sem allowlist ou fora dela → volta para /admin/entrar?erro=1 (não confirma o motivo).
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const base = env.NEXT_PUBLIC_APP_URL;

  if (!env.AUTH_SECRET || !email || !adminEmails().includes(email)) {
    return NextResponse.redirect(new URL("/admin/entrar?erro=1", base), { status: 303 });
  }

  const token = await assinarSessao(email, env.AUTH_SECRET, Date.now());
  const resp = NextResponse.redirect(new URL("/admin", base), { status: 303 });
  resp.cookies.set(NOME_COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
  return resp;
}
