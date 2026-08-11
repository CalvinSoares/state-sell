import { NextResponse } from "next/server";
import { env } from "@/src/env";
import { verificarSessao } from "@/src/server/auth/sessao";
import { ativarAssinante } from "@/src/server/db/repositorios/assinante.repo";

/** Magic link de confirmação de e-mail. Ativa o assinante e leva ao /pronto. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? undefined;
  const base = env.NEXT_PUBLIC_APP_URL;

  const email = env.AUTH_SECRET ? await verificarSessao(token, env.AUTH_SECRET, Date.now()) : null;
  if (!email) {
    return NextResponse.redirect(new URL("/cadastro?erro=link", base), { status: 303 });
  }

  await ativarAssinante(email);
  return NextResponse.redirect(new URL("/pronto", base), { status: 303 });
}
