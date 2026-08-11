import "server-only";
import { and, count, eq, gt, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/src/server/db";
import {
  alerta,
  assinante,
  classificacaoItem,
  contratacao,
  feedbackAlerta,
  itemContratacao,
  perfilBusca,
} from "@/src/server/db/schema";
import { RAMO_SEM_CLASSIFICACAO } from "@/src/server/coleta/casar.job";
import { LIMIAR } from "@/src/server/casamento/casar";
import type {
  ContratacaoParaSelecao,
  PerfilAssinante,
} from "@/src/server/alerta/selecionar";

/** Assinantes ativos com perfil ativo. */
export async function assinantesAtivosComPerfil(): Promise<PerfilAssinante[]> {
  const linhas = await db
    .select({
      assinanteId: assinante.id,
      ramos: perfilBusca.ramos,
      municipiosIbge: perfilBusca.municipiosIbge,
      uf: perfilBusca.uf,
      tetoValorCentavos: perfilBusca.tetoValorCentavos,
    })
    .from(assinante)
    .innerJoin(perfilBusca, eq(perfilBusca.assinanteId, assinante.id))
    .where(and(eq(assinante.status, "ativo"), eq(perfilBusca.ativo, true)));

  return linhas.map((l) => ({
    assinanteId: l.assinanteId,
    ramos: l.ramos,
    municipiosIbge: l.municipiosIbge,
    uf: l.uf,
    tetoValorCentavos: l.tetoValorCentavos,
  }));
}

/**
 * Contratações candidatas: divulgadas, com prazo aberto, que têm pelo menos um
 * item classificado num ramo de verdade acima do limiar. Traz os itens
 * classificados para a seleção fina (pura) decidir por assinante.
 */
export async function contratacoesCandidatas(agora: Date): Promise<ContratacaoParaSelecao[]> {
  const linhas = await db
    .select({
      contratacaoId: contratacao.id,
      codigoIbge: contratacao.codigoIbge,
      uf: contratacao.uf,
      valorTotalEstimadoCentavos: contratacao.valorTotalEstimadoCentavos,
      situacaoCompraId: contratacao.situacaoCompraId,
      dataEncerramentoProposta: contratacao.dataEncerramentoProposta,
      itemId: itemContratacao.id,
      ramoSlug: classificacaoItem.ramoSlug,
      score: classificacaoItem.score,
      valorItemCentavos: itemContratacao.valorTotalCentavos,
      tipoBeneficioNome: itemContratacao.tipoBeneficioNome,
    })
    .from(contratacao)
    .innerJoin(itemContratacao, eq(itemContratacao.contratacaoId, contratacao.id))
    .innerJoin(classificacaoItem, eq(classificacaoItem.itemId, itemContratacao.id))
    .where(
      and(
        eq(contratacao.situacaoCompraId, 1),
        gt(contratacao.dataEncerramentoProposta, agora),
        sql`${classificacaoItem.ramoSlug} <> ${RAMO_SEM_CLASSIFICACAO}`,
        sql`${classificacaoItem.score}::numeric >= ${LIMIAR}`,
      ),
    );

  // agrupa itens por contratação
  const mapa = new Map<string, ContratacaoParaSelecao>();
  for (const l of linhas) {
    let c = mapa.get(l.contratacaoId);
    if (!c) {
      c = {
        contratacaoId: l.contratacaoId,
        codigoIbge: l.codigoIbge,
        uf: l.uf,
        valorTotalEstimadoCentavos: l.valorTotalEstimadoCentavos,
        situacaoCompraId: l.situacaoCompraId,
        dataEncerramentoProposta: l.dataEncerramentoProposta,
        itens: [],
      };
      mapa.set(l.contratacaoId, c);
    }
    c.itens.push({
      itemId: l.itemId,
      ramoSlug: l.ramoSlug,
      score: Number(l.score),
      valorTotalCentavos: l.valorItemCentavos,
      exclusivoMeEpp: (l.tipoBeneficioNome ?? "").toLowerCase().includes("exclusiv"),
    });
  }
  return [...mapa.values()];
}

/** Alertas do assinante para o painel (mais recentes primeiro). */
export async function alertasDoAssinante(assinanteId: string, limite = 30) {
  return db
    .select({
      alertaId: alerta.id,
      ramoSlug: alerta.ramoSlug,
      status: alerta.status,
      enviadoEm: alerta.enviadoEm,
      orgaoRazaoSocial: contratacao.orgaoRazaoSocial,
      municipioNome: contratacao.municipioNome,
      dataEncerramentoProposta: contratacao.dataEncerramentoProposta,
      linkSistemaOrigem: contratacao.linkSistemaOrigem,
      numeroControlePncp: contratacao.numeroControlePncp,
      itemDescricao: itemContratacao.descricao,
    })
    .from(alerta)
    .innerJoin(contratacao, eq(contratacao.id, alerta.contratacaoId))
    .innerJoin(itemContratacao, eq(itemContratacao.id, alerta.itemIdPrincipal))
    .where(eq(alerta.assinanteId, assinanteId))
    .orderBy(sql`${alerta.criadoEm} desc`)
    .limit(limite);
}

/** Pares (assinante, contratação) que já têm alerta — para não recontá-los no teto. */
export async function paresAlertados(assinanteIds: string[]): Promise<Set<string>> {
  if (assinanteIds.length === 0) return new Set();
  const linhas = await db
    .select({ assinanteId: alerta.assinanteId, contratacaoId: alerta.contratacaoId })
    .from(alerta)
    .where(inArray(alerta.assinanteId, assinanteIds));
  return new Set(linhas.map((l) => `${l.assinanteId}:${l.contratacaoId}`));
}

/** Quantos alertas cada assinante teve CRIADOS desde `desde` (janela do teto). */
export async function alertasCriadosDesde(desde: Date): Promise<Map<string, number>> {
  const linhas = await db
    .select({ assinanteId: alerta.assinanteId, n: count() })
    .from(alerta)
    .where(gte(alerta.criadoEm, desde))
    .groupBy(alerta.assinanteId);
  return new Map(linhas.map((l) => [l.assinanteId, Number(l.n)]));
}

export type CriarAlertaInput = {
  assinanteId: string;
  contratacaoId: string;
  ramoSlug: string;
  itemIdPrincipal: string;
};

/**
 * Cria alerta pendente. A UNIQUE (assinante, contratação) é a defesa contra
 * duplicado — onConflictDoNothing devolve 0 linhas se já existia.
 * Retorna quantos foram efetivamente criados.
 */
export async function criarAlertasPendentes(entradas: CriarAlertaInput[]): Promise<number> {
  if (entradas.length === 0) return 0;
  const inseridos = await db
    .insert(alerta)
    .values(entradas.map((e) => ({ ...e, status: "pendente" })))
    .onConflictDoNothing({
      target: [alerta.assinanteId, alerta.contratacaoId],
    })
    .returning({ id: alerta.id });
  return inseridos.length;
}

/** Alertas pendentes com tudo que o e-mail precisa. */
function selectDetalhesAlerta() {
  return db
    .select({
      alertaId: alerta.id,
      email: assinante.email,
      ramoSlug: alerta.ramoSlug,
      termosCasados: classificacaoItem.termosCasados,
      escala: classificacaoItem.escala,
      // contratação
      orgaoRazaoSocial: contratacao.orgaoRazaoSocial,
      municipioNome: contratacao.municipioNome,
      unidadeNome: contratacao.unidadeNome,
      valorTotalEstimadoCentavos: contratacao.valorTotalEstimadoCentavos,
      dataEncerramentoProposta: contratacao.dataEncerramentoProposta,
      linkSistemaOrigem: contratacao.linkSistemaOrigem,
      numeroControlePncp: contratacao.numeroControlePncp,
      // item principal
      itemDescricao: itemContratacao.descricao,
      itemQuantidade: itemContratacao.quantidade,
      itemUnidade: itemContratacao.unidadeMedida,
      itemTipoBeneficio: itemContratacao.tipoBeneficioNome,
    })
    .from(alerta)
    .innerJoin(assinante, eq(assinante.id, alerta.assinanteId))
    .innerJoin(contratacao, eq(contratacao.id, alerta.contratacaoId))
    .innerJoin(itemContratacao, eq(itemContratacao.id, alerta.itemIdPrincipal))
    .leftJoin(
      classificacaoItem,
      and(
        eq(classificacaoItem.itemId, alerta.itemIdPrincipal),
        eq(classificacaoItem.ramoSlug, alerta.ramoSlug),
      ),
    );
}

/** Amostra de pendentes (só leitura — usada em diagnóstico/smoke). */
export async function alertasPendentes(limite = 200) {
  return selectDetalhesAlerta()
    .where(and(eq(alerta.status, "pendente"), isNull(alerta.enviadoEm)))
    .limit(limite);
}

/**
 * Reivindica pendentes para envio de forma ATÔMICA: vira o status para
 * "enviando" e devolve os detalhes. Duas execuções concorrentes nunca pegam
 * a mesma linha (o UPDATE trava), evitando e-mail duplicado. Ver auditoria #8.
 */
export async function reivindicarParaEnvio(limite = 200) {
  const claimed = await db.execute(sql`
    update alerta set status = 'enviando'
    where id in (
      select id from alerta
      where status = 'pendente' and enviado_em is null
      order by criado_em
      limit ${limite}
      for update skip locked
    )
    returning id
  `);
  const ids = (claimed as unknown as { id: string }[]).map((r) => r.id);
  if (ids.length === 0) return [];
  return selectDetalhesAlerta().where(inArray(alerta.id, ids));
}

/** Marca enviado na mesma transação lógica do retorno do provedor. */
export async function marcarEnviado(alertaId: string, resendId: string | null, enviadoEm: Date) {
  await db
    .update(alerta)
    .set({ status: "enviado", enviadoEm, resendId })
    .where(and(eq(alerta.id, alertaId), isNull(alerta.enviadoEm)));
}

/**
 * Registra feedback de um alerta (util=false = "não era pra mim"). Idempotente:
 * cliques repetidos ou prefetch de scanner de e-mail não geram duplicatas.
 * Retorna true se foi um registro novo.
 */
export async function registrarFeedback(alertaId: string, util: boolean, motivo?: string): Promise<boolean> {
  const [existe] = await db
    .select({ id: feedbackAlerta.id })
    .from(feedbackAlerta)
    .where(eq(feedbackAlerta.alertaId, alertaId))
    .limit(1);
  if (existe) return false;
  await db.insert(feedbackAlerta).values({ alertaId, util, motivo });
  return true;
}

export async function marcarFalhou(alertaId: string, motivo: string) {
  await db.update(alerta).set({ status: "falhou", motivoSupressao: motivo }).where(eq(alerta.id, alertaId));
}
