/**
 * Hash estável do texto para deduplicação de rótulos. Puro e determinístico.
 * Um rótulo vale para todo texto idêntico, inclusive futuro. Ver backoffice.md.
 */
import { normalizar } from "@/src/server/casamento/normalizar";

/** FNV-1a 32-bit em hex. Estável entre execuções e plataformas. */
export function hashTexto(descricaoItem: string, objetoCompra: string): string {
  const base = `${normalizar(descricaoItem)}|${normalizar(objetoCompra)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < base.length; i++) {
    h ^= base.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
