/**
 * Token assinado genérico (HMAC via Web Crypto). Usado para links que agem em
 * nome de um recurso sem exigir login — ex.: "não era pra mim" no e-mail.
 * Puro quanto ao tempo: `agoraMs` entra por parâmetro.
 */

type Carga = { v: string; exp: number };

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function chave(segredo: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function assinarValor(
  valor: string,
  segredo: string,
  agoraMs: number,
  validadeMs: number,
): Promise<string> {
  const carga: Carga = { v: valor, exp: agoraMs + validadeMs };
  const corpo = b64url(new TextEncoder().encode(JSON.stringify(carga)));
  const k = await chave(segredo);
  const assinatura = new Uint8Array(
    await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(corpo)),
  );
  return `${corpo}.${b64url(assinatura)}`;
}

/** Retorna o valor se a assinatura e o prazo forem válidos; senão null. */
export async function verificarValor(
  token: string | undefined,
  segredo: string,
  agoraMs: number,
): Promise<string | null> {
  if (!token) return null;
  const [corpo, assinatura] = token.split(".");
  if (!corpo || !assinatura) return null;
  const k = await chave(segredo);
  const ok = await crypto.subtle.verify(
    "HMAC",
    k,
    deB64url(assinatura) as unknown as BufferSource,
    new TextEncoder().encode(corpo) as unknown as BufferSource,
  );
  if (!ok) return null;
  try {
    const carga = JSON.parse(new TextDecoder().decode(deB64url(corpo))) as Carga;
    if (typeof carga.exp !== "number" || carga.exp < agoraMs) return null;
    return carga.v;
  } catch {
    return null;
  }
}
