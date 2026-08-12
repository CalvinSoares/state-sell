/**
 * Storage privado dos PDFs do cofre (Vercel Blob).
 * Pathname no banco; leitura só via rota autenticada. Ver cofre-de-certidoes.md.
 *
 * Auth:
 * - Na Vercel: OIDC automático com BLOB_STORE_ID (não precisa passar token).
 * - Local / fora da Vercel: BLOB_READ_WRITE_TOKEN.
 */
import "server-only";
import { del, get, put } from "@vercel/blob";
import { env } from "@/src/env";

export const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

/** Upload disponível se houver token estático OU store OIDC (produção Vercel). */
export function blobConfigurado(): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID);
}

function opcoesAuth(): { token?: string } {
  // Token explícito tem prioridade (local / fallback). Sem token, o SDK usa OIDC na Vercel.
  if (env.BLOB_READ_WRITE_TOKEN) return { token: env.BLOB_READ_WRITE_TOKEN };
  return {};
}

function exigirBlob(): void {
  if (!blobConfigurado()) {
    throw new Error(
      "Upload de PDF não está configurado. Na Vercel precisa de BLOB_STORE_ID; no local, BLOB_READ_WRITE_TOKEN.",
    );
  }
}

/** Pathname estável e opaco: certidoes/{assinanteId}/{certidaoId}.pdf */
export function pathnameCertidao(assinanteId: string, certidaoId: string): string {
  return `certidoes/${assinanteId}/${certidaoId}.pdf`;
}

/** Aceita só PDF (MIME + magic bytes). */
export async function validarPdf(file: File): Promise<Buffer> {
  if (file.size <= 0) throw new Error("Arquivo vazio");
  if (file.size > MAX_PDF_BYTES) throw new Error("PDF grande demais (máximo 5 MB)");
  const tipo = (file.type || "").toLowerCase();
  if (tipo && tipo !== "application/pdf") {
    throw new Error("Só aceitamos PDF");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 4).toString("ascii") !== "%PDF") {
    throw new Error("Arquivo não parece um PDF válido");
  }
  return buf;
}

export async function subirPdfCertidao(
  assinanteId: string,
  certidaoId: string,
  bytes: Buffer,
): Promise<string> {
  exigirBlob();
  const pathname = pathnameCertidao(assinanteId, certidaoId);
  await put(pathname, bytes, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
    ...opcoesAuth(),
  });
  return pathname;
}

export async function apagarPdfCertidao(pathname: string): Promise<void> {
  if (!pathname || !blobConfigurado()) return;
  try {
    await del(pathname, opcoesAuth());
  } catch {
    // blob já ausente — ok
  }
}

export async function lerPdfCertidao(pathname: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
} | null> {
  exigirBlob();
  const result = await get(pathname, { access: "private", ...opcoesAuth() });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return {
    stream: result.stream,
    contentType: result.blob.contentType || "application/pdf",
  };
}
