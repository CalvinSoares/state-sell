import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/src/server/db";

/**
 * Rate limit de janela fixa, atômico no Postgres. Uma linha por chave.
 * Um único UPSERT decide: se ainda estamos na janela, incrementa; senão,
 * reinicia a janela. Retorna se a requisição está DENTRO do limite.
 * Ver auditoria #2 (mail-bombing nas rotas públicas de e-mail).
 */
export async function consumirLimite(
  chave: string,
  limite: number,
  janelaSegundos: number,
): Promise<{ permitido: boolean; contador: number }> {
  const linhas = (await db.execute(sql`
    insert into rate_limit (chave, janela_inicio, contador)
    values (${chave}, now(), 1)
    on conflict (chave) do update set
      contador = case
        when rate_limit.janela_inicio > now() - (${janelaSegundos} * interval '1 second')
        then rate_limit.contador + 1
        else 1
      end,
      janela_inicio = case
        when rate_limit.janela_inicio > now() - (${janelaSegundos} * interval '1 second')
        then rate_limit.janela_inicio
        else now()
      end
    returning contador
  `)) as unknown as { contador: number }[];

  const contador = Number(linhas[0]?.contador ?? 1);
  return { permitido: contador <= limite, contador };
}

/** IP do cliente a partir dos headers (Vercel: x-forwarded-for). "?" se ausente. */
export function ipDoRequest(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "desconhecido";
}
