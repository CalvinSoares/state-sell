import { NextResponse } from "next/server";
import { env } from "@/src/env";
import { verificarValor } from "@/src/server/auth/token";
import { registrarFeedback } from "@/src/server/db/repositorios/alerta.repo";

/**
 * "Não era pra mim". GET só mostra um botão de confirmação; o registro acontece
 * no POST. Assim, prefetch/scanner de e-mail (que só faz GET) não polui os dados
 * de rotulagem. Ver auditoria #3. Token assinado, sem login.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const alertaId = url.searchParams.get("a") ?? "";
  const token = url.searchParams.get("t") ?? "";
  if (!(await tokenValido(alertaId, token))) return paginaLinkInvalido();

  return paginaHtml(
    "Confirmar",
    `<p>Quer avisar que esse aviso <strong>não era pra você</strong>? Isso ajuda a gente a acertar mais.</p>
     <form method="post">
       <input type="hidden" name="a" value="${escapar(alertaId)}" />
       <input type="hidden" name="t" value="${escapar(token)}" />
       <button type="submit" style="background:#1f6f43;color:#fff;border:0;padding:.7rem 1.1rem;border-radius:8px;font-size:1rem;cursor:pointer">Sim, não era pra mim</button>
     </form>`,
  );
}

export async function POST(req: Request) {
  const form = await req.formData();
  const alertaId = String(form.get("a") ?? "");
  const token = String(form.get("t") ?? "");
  if (!(await tokenValido(alertaId, token))) return paginaLinkInvalido();

  await registrarFeedback(alertaId, false, "não era pra mim (link do e-mail)");
  return paginaHtml(
    "Obrigado!",
    "Anotamos que esse aviso não era pra você. Isso ajuda a gente a acertar mais nos próximos.",
  );
}

async function tokenValido(alertaId: string, token: string): Promise<boolean> {
  if (!env.AUTH_SECRET || !alertaId || !token) return false;
  const valor = await verificarValor(token, env.AUTH_SECRET, Date.now());
  return valor === alertaId;
}

function paginaLinkInvalido(): Response {
  return paginaHtml("Link inválido", "Esse link de feedback não é válido ou expirou.");
}

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function paginaHtml(titulo: string, corpo: string): Response {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${titulo} — Prefeitura Quer</title></head>
    <body style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:4rem auto;padding:0 1.25rem;line-height:1.5;color:#1b1a17">
      <h1 style="font-size:1.4rem">${titulo}</h1>
      <div style="color:#5f5e57">${corpo}</div>
      <p style="margin-top:1.5rem"><a href="${env.NEXT_PUBLIC_APP_URL}/painel" style="color:#1f6f43">Ver seus avisos</a></p>
    </body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
