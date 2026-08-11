/**
 * Verificação de assinatura Svix (usada pelo Resend nos webhooks).
 * HMAC-SHA256 sobre `${id}.${timestamp}.${payload}` com o segredo whsec_...
 * Web Crypto — funciona no runtime da Vercel.
 */

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export type CabecalhosSvix = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

/**
 * Verifica a assinatura. Retorna true se qualquer assinatura v1 do header bate.
 * `segredo` é o whsec_... do painel do Resend. `corpoBruto` é o body cru (texto).
 */
export async function verificarSvix(
  corpoBruto: string,
  h: CabecalhosSvix,
  segredo: string,
): Promise<boolean> {
  if (!h.id || !h.timestamp || !h.signature) return false;

  const segredoB64 = segredo.startsWith("whsec_") ? segredo.slice(6) : segredo;
  const chave = await crypto.subtle.importKey(
    "raw",
    b64ToBytes(segredoB64) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const conteudo = `${h.id}.${h.timestamp}.${corpoBruto}`;
  const assinatura = new Uint8Array(
    await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(conteudo) as unknown as BufferSource),
  );
  const esperado = bytesToB64(assinatura);

  // header: "v1,<sig> v1,<sig2>" — comparar com cada uma
  for (const parte of h.signature.split(" ")) {
    const [versao, sig] = parte.split(",");
    if (versao === "v1" && sig && sig === esperado) return true;
  }
  return false;
}
