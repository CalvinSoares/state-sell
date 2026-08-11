import { NextResponse, type NextRequest } from "next/server";
import { NOME_COOKIE_SESSAO, verificarSessao } from "@/src/server/auth/sessao";

/**
 * Protege /admin/*. E-mail fora da allowlist ou sem sessão recebe 404 — não 403,
 * para não confirmar que a área existe. /admin/entrar é público. Ver backoffice.md.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/entrar" || pathname.startsWith("/admin/api/entrar")) {
    return NextResponse.next();
  }

  const segredo = process.env.AUTH_SECRET;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const token = req.cookies.get(NOME_COOKIE_SESSAO)?.value;
  const email = segredo ? await verificarSessao(token, segredo, Date.now()) : null;

  if (!email || !allowlist.includes(email)) {
    // 404 deliberado: não revela que /admin existe.
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
