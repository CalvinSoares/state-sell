import "server-only";
import { and, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/src/server/db";
import { assinante, certidao } from "@/src/server/db/schema";
import type { TipoCertidao } from "@/src/shared/config/certidoes";
import { apagarPdfCertidao } from "@/src/server/certidoes/arquivo";

export type CertidaoLinha = {
  id: string;
  tipo: string;
  vencimentoEm: string;
  arquivoChave: string | null;
  lembrete15Em: Date | null;
  lembrete3Em: Date | null;
  atualizadoEm: Date;
};

const CAMPOS = {
  id: certidao.id,
  tipo: certidao.tipo,
  vencimentoEm: certidao.vencimentoEm,
  arquivoChave: certidao.arquivoChave,
  lembrete15Em: certidao.lembrete15Em,
  lembrete3Em: certidao.lembrete3Em,
  atualizadoEm: certidao.atualizadoEm,
};

export async function listarCertidoes(assinanteId: string): Promise<CertidaoLinha[]> {
  return db.select(CAMPOS).from(certidao).where(eq(certidao.assinanteId, assinanteId));
}

/** Certidões de vários assinantes (lote) — para amarrar aviso no e-mail de alerta. */
export async function certidoesPorAssinantes(
  assinanteIds: string[],
): Promise<Map<string, { tipo: string; vencimentoEm: string }[]>> {
  const mapa = new Map<string, { tipo: string; vencimentoEm: string }[]>();
  if (assinanteIds.length === 0) return mapa;
  const linhas = await db
    .select({
      assinanteId: certidao.assinanteId,
      tipo: certidao.tipo,
      vencimentoEm: certidao.vencimentoEm,
    })
    .from(certidao)
    .where(inArray(certidao.assinanteId, assinanteIds));
  for (const l of linhas) {
    const lista = mapa.get(l.assinanteId) ?? [];
    lista.push({ tipo: l.tipo, vencimentoEm: l.vencimentoEm });
    mapa.set(l.assinanteId, lista);
  }
  return mapa;
}

export async function certidaoDoAssinante(
  assinanteId: string,
  id: string,
): Promise<CertidaoLinha | null> {
  const [l] = await db
    .select(CAMPOS)
    .from(certidao)
    .where(and(eq(certidao.id, id), eq(certidao.assinanteId, assinanteId)));
  return l ?? null;
}

/** Upsert por (assinante, tipo). Reseta lembretes se a data de vencimento mudou. */
export async function salvarCertidao(
  assinanteId: string,
  tipo: TipoCertidao,
  vencimentoEm: string,
): Promise<CertidaoLinha> {
  const [existente] = await db
    .select({ id: certidao.id, vencimentoEm: certidao.vencimentoEm })
    .from(certidao)
    .where(and(eq(certidao.assinanteId, assinanteId), eq(certidao.tipo, tipo)));

  if (existente) {
    const mudouData = existente.vencimentoEm !== vencimentoEm;
    const [atualizada] = await db
      .update(certidao)
      .set({
        vencimentoEm,
        atualizadoEm: new Date(),
        ...(mudouData ? { lembrete15Em: null, lembrete3Em: null } : {}),
      })
      .where(eq(certidao.id, existente.id))
      .returning(CAMPOS);
    return atualizada!;
  }

  const [criada] = await db
    .insert(certidao)
    .values({ assinanteId, tipo, vencimentoEm })
    .returning(CAMPOS);
  return criada!;
}

export async function gravarArquivoChave(
  assinanteId: string,
  id: string,
  arquivoChave: string,
): Promise<CertidaoLinha | null> {
  const [atualizada] = await db
    .update(certidao)
    .set({ arquivoChave, atualizadoEm: new Date() })
    .where(and(eq(certidao.id, id), eq(certidao.assinanteId, assinanteId)))
    .returning(CAMPOS);
  return atualizada ?? null;
}

/** Remove só o arquivo (mantém a data). Apaga o blob de verdade. */
export async function removerArquivoCertidao(
  assinanteId: string,
  id: string,
): Promise<boolean> {
  const atual = await certidaoDoAssinante(assinanteId, id);
  if (!atual) return false;
  if (atual.arquivoChave) await apagarPdfCertidao(atual.arquivoChave);
  await db
    .update(certidao)
    .set({ arquivoChave: null, atualizadoEm: new Date() })
    .where(eq(certidao.id, id));
  return true;
}

export async function excluirCertidao(assinanteId: string, id: string): Promise<boolean> {
  const atual = await certidaoDoAssinante(assinanteId, id);
  if (!atual) return false;
  if (atual.arquivoChave) await apagarPdfCertidao(atual.arquivoChave);
  const linhas = await db
    .delete(certidao)
    .where(and(eq(certidao.id, id), eq(certidao.assinanteId, assinanteId)))
    .returning({ id: certidao.id });
  return linhas.length > 0;
}

export type CandidataLembrete = {
  id: string;
  tipo: string;
  vencimentoEm: string;
  lembrete15Em: Date | null;
  lembrete3Em: Date | null;
  email: string;
  assinanteId: string;
};

/**
 * Certidões que ainda não venceram (vencimento >= hoje) e podem precisar
 * de lembrete. Filtro fino (d15/d3) é puro em lembreteDevido.
 */
export async function candidatasLembreteCertidao(hojeYmd: string): Promise<CandidataLembrete[]> {
  return db
    .select({
      id: certidao.id,
      tipo: certidao.tipo,
      vencimentoEm: certidao.vencimentoEm,
      lembrete15Em: certidao.lembrete15Em,
      lembrete3Em: certidao.lembrete3Em,
      email: assinante.email,
      assinanteId: assinante.id,
    })
    .from(certidao)
    .innerJoin(assinante, eq(assinante.id, certidao.assinanteId))
    .where(
      and(
        eq(assinante.status, "ativo"),
        sql`${certidao.vencimentoEm} >= ${hojeYmd}::date`,
        or(isNull(certidao.lembrete15Em), isNull(certidao.lembrete3Em)),
        lte(certidao.vencimentoEm, sql`(${hojeYmd}::date + interval '15 days')`),
      ),
    );
}

export async function marcarLembreteCertidao(
  id: string,
  qual: "d15" | "d3",
  quando: Date,
): Promise<void> {
  await db
    .update(certidao)
    .set(qual === "d15" ? { lembrete15Em: quando } : { lembrete3Em: quando })
    .where(eq(certidao.id, id));
}
