import { NextResponse, type NextRequest } from "next/server";
import { NOME_COOKIE_PUBLICO, NOME_COOKIE_SESSAO, verificarSessao } from "@/src/server/auth/sessao";

/**
 * Dois guards, ambos com redirect amigável para a tela de login:
 * - /painel → área do assinante; sem sessão vai para /entrar.
 * - /admin/* → backoffice; sem sessão de admin (allowlist) vai para /admin/entrar.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const segredo = process.env.AUTH_SECRET;

  if (pathname.startsWith("/painel")) {
    const token = req.cookies.get(NOME_COOKIE_PUBLICO)?.value;
    const email = segredo ? await verificarSessao(token, segredo, Date.now(), "assinante") : null;
    if (!email) {
      return NextResponse.redirect(new URL("/entrar", req.url));
    }
    return NextResponse.next();
  }

  // /admin/*
  if (pathname === "/admin/entrar" || pathname.startsWith("/admin/api/entrar")) {
    return NextResponse.next();
  }

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const token = req.cookies.get(NOME_COOKIE_SESSAO)?.value;
  const email = segredo ? await verificarSessao(token, segredo, Date.now(), "admin") : null;

  if (!email || !allowlist.includes(email)) {
    return NextResponse.redirect(new URL("/admin/entrar", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/painel/:path*", "/painel"],
};
