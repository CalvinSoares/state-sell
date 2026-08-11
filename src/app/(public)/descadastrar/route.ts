import { NextResponse } from "next/server";
import { env } from "@/src/env";
import { verificarValor } from "@/src/server/auth/token";
import { suprimirAssinante } from "@/src/server/db/repositorios/assinante.repo";

/**
 * Descadastro. GET mostra um botão de confirmação (scanner de e-mail que só faz
 * GET não descadastra ninguém). POST efetiva — e é também o alvo do
 * List-Unsubscribe-Post (one-click dos clientes de e-mail). Token assinado.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!(await emailDoToken(token))) return pagina("Link inválido", "Esse link não é válido.");

  return pagina(
    "Parar de receber?",
    `<p>Confirme para não receber mais os avisos.</p>
     <form method="post">
       <input type="hidden" name="t" value="${escapar(token)}" />
       <button type="submit" style="background:#b3261e;color:#fff;border:0;padding:.7rem 1.1rem;border-radius:8px;font-size:1rem;cursor:pointer">Sim, parar de receber</button>
     </form>
     <p style="margin-top:1rem;color:#6b6a63;font-size:.9rem">Mudou de ideia? É só fechar esta página.</p>`,
  );
}

export async function POST(req: Request) {
  // Token pode vir do form (GET→confirma) ou da querystring (one-click do cliente).
  const form = await req.formData().catch(() => null);
  const token =
    (form?.get("t") as string | null) ?? new URL(req.url).searchParams.get("t") ?? "";

  const email = await emailDoToken(token);
  if (!email) return pagina("Link inválido", "Esse link não é válido.");

  await suprimirAssinante(email);
  return pagina(
    "Pronto",
    "Você não vai mais receber os avisos. Se um dia quiser voltar, é só se cadastrar de novo.",
  );
}

async function emailDoToken(token: string): Promise<string | null> {
  if (!env.AUTH_SECRET || !token) return null;
  return verificarValor(token, env.AUTH_SECRET, Date.now());
}

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pagina(titulo: string, corpo: string): Response {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${titulo} — Prefeitura Quer</title></head>
    <body style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:4rem auto;padding:0 1.25rem;line-height:1.5;color:#1b1a17">
      <h1 style="font-size:1.4rem">${titulo}</h1>
      <div style="color:#5f5e57">${corpo}</div>
    </body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
