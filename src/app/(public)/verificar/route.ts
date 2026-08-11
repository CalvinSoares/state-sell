import { NextResponse } from "next/server";
import { env } from "@/src/env";
import { assinarSessao, NOME_COOKIE_PUBLICO, verificarMagic } from "@/src/server/auth/sessao";
import { ativarAssinante } from "@/src/server/db/repositorios/assinante.repo";
import { consumirMagic } from "@/src/server/db/repositorios/magic.repo";

/**
 * Magic link (confirmação de cadastro ou login). Verifica o token, ativa o
 * assinante, cria a sessão da área do assinante e leva ao destino:
 * /pronto no primeiro acesso (calibra expectativa), /painel nos demais.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? undefined;
  const novo = url.searchParams.get("novo") === "1";
  const base = env.NEXT_PUBLIC_APP_URL;

  const magic = env.AUTH_SECRET ? await verificarMagic(token, env.AUTH_SECRET, Date.now()) : null;
  if (!magic) {
    return NextResponse.redirect(new URL("/entrar?erro=link", base), { status: 303 });
  }

  // Uso único: o primeiro clique consome o jti; o segundo cai aqui e falha.
  if (magic.jti && !(await consumirMagic(magic.jti))) {
    return NextResponse.redirect(new URL("/entrar?erro=usado", base), { status: 303 });
  }

  const email = magic.email;
  await ativarAssinante(email);

  // Token do link é curto; a sessão do cookie é longa — emite uma nova.
  const sessao = await assinarSessao(email, env.AUTH_SECRET!, Date.now(), { aud: "assinante" });
  const destino = novo ? "/pronto" : "/painel";
  const resp = NextResponse.redirect(new URL(destino, base), { status: 303 });
  resp.cookies.set(NOME_COOKIE_PUBLICO, sessao, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return resp;
}
