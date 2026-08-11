import { NextResponse } from "next/server";
import { env } from "@/src/env";
import { verificarValor } from "@/src/server/auth/token";
import { registrarFeedback } from "@/src/server/db/repositorios/alerta.repo";

/**
 * "Não era pra mim" — link assinado do e-mail, sem login. Registra o feedback
 * negativo e agradece. O item entra na fila de rotulagem como negativo depois.
 * Ver roadmap-melhorias.md (1.1) e alertas-e-envio.md.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const alertaId = url.searchParams.get("a") ?? "";
  const token = url.searchParams.get("t") ?? undefined;

  const valido = env.AUTH_SECRET
    ? await verificarValor(token, env.AUTH_SECRET, Date.now())
    : null;

  if (!valido || valido !== alertaId) {
    return paginaHtml("Link inválido", "Esse link de feedback não é válido ou expirou.");
  }

  await registrarFeedback(alertaId, false, "não era pra mim (link do e-mail)");
  return paginaHtml(
    "Obrigado!",
    "Anotamos que esse aviso não era pra você. Isso ajuda a gente a acertar mais nos próximos.",
  );
}

function paginaHtml(titulo: string, texto: string): Response {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${titulo} — Prefeitura Quer</title></head>
    <body style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:4rem auto;padding:0 1.25rem;line-height:1.5;color:#1b1a17">
      <h1 style="font-size:1.4rem">${titulo}</h1>
      <p style="color:#5f5e57">${texto}</p>
      <p><a href="${env.NEXT_PUBLIC_APP_URL}/painel" style="color:#1f6f43">Ver seus avisos</a></p>
    </body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
