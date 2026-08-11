/**
 * Sessão assinada por HMAC (Web Crypto — funciona em Node e no edge/middleware).
 * Usada pelo backoffice: allowlist de e-mail + cookie assinado. Ver backoffice.md.
 *
 * NÃO usa Date fora de verificação de expiração (que recebe `agora` por parâmetro
 * onde é testável). O magic link público do produto reaproveita este módulo.
 */

const COOKIE_SESSAO = "ss_sessao";
const VALIDADE_MS = 1000 * 60 * 60 * 12; // 12h

/** Cookie do backoffice (path /admin). */
export const NOME_COOKIE_SESSAO = COOKIE_SESSAO;
/** Cookie da área do assinante (path /). */
export const NOME_COOKIE_PUBLICO = "ss_assinante";
/** Validade do magic link de acesso (curta, uso único na prática pelo exp). */
export const VALIDADE_MAGIC_MS = 1000 * 60 * 30; // 30 min

type Payload = { email: string; exp: number };

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function chaveHmac(segredo: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Gera o valor assinado: base64url(payload).base64url(assinatura).
 * `validadeMs` permite token curto (magic link) ou sessão longa (cookie).
 */
export async function assinarSessao(
  email: string,
  segredo: string,
  agoraMs: number,
  validadeMs: number = VALIDADE_MS,
): Promise<string> {
  const payload: Payload = { email: email.toLowerCase(), exp: agoraMs + validadeMs };
  const corpo = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const chave = await chaveHmac(segredo);
  const assinatura = new Uint8Array(
    await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpo)),
  );
  return `${corpo}.${base64url(assinatura)}`;
}

/** Verifica assinatura e expiração. Retorna o e-mail ou null. */
export async function verificarSessao(
  token: string | undefined,
  segredo: string,
  agoraMs: number,
): Promise<string | null> {
  if (!token) return null;
  const [corpo, assinatura] = token.split(".");
  if (!corpo || !assinatura) return null;

  const chave = await chaveHmac(segredo);
  const valida = await crypto.subtle.verify(
    "HMAC",
    chave,
    deBase64url(assinatura) as unknown as BufferSource,
    new TextEncoder().encode(corpo) as unknown as BufferSource,
  );
  if (!valida) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(deBase64url(corpo))) as Payload;
    if (typeof payload.exp !== "number" || payload.exp < agoraMs) return null;
    return payload.email;
  } catch {
    return null;
  }
}
