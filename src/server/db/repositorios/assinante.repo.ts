import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/src/server/db";
import { assinante, perfilBusca } from "@/src/server/db/schema";

export type CriarAssinanteInput = {
  email: string;
  nome?: string;
  uf: string | null;
  municipiosIbge: string[];
  ramos: string[];
  tetoValorCentavos: bigint | null;
};

/**
 * Cria assinante + perfil numa transação. Se o e-mail já existe, NÃO revela —
 * apenas atualiza o perfil e devolve o id existente (o chamador manda magic link
 * de qualquer forma). Ver cadastro-do-assinante.md.
 */
export async function criarOuAtualizarAssinante(input: CriarAssinanteInput): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    const [existente] = await tx
      .select({ id: assinante.id })
      .from(assinante)
      .where(eq(assinante.email, input.email));

    const id =
      existente?.id ??
      (
        await tx
          .insert(assinante)
          .values({ email: input.email, nome: input.nome, status: "pendente" })
          .returning({ id: assinante.id })
      )[0]!.id;

    // v1: exatamente um perfil por assinante — apaga e recria
    await tx.delete(perfilBusca).where(eq(perfilBusca.assinanteId, id));
    await tx.insert(perfilBusca).values({
      assinanteId: id,
      uf: input.uf,
      municipiosIbge: input.municipiosIbge,
      ramos: input.ramos,
      tetoValorCentavos: input.tetoValorCentavos,
      ativo: true,
    });

    return { id };
  });
}


const CAMPOS_PAINEL = {
  id: assinante.id,
  email: assinante.email,
  status: assinante.status,
  ramos: perfilBusca.ramos,
  municipiosIbge: perfilBusca.municipiosIbge,
  uf: perfilBusca.uf,
  tetoValorCentavos: perfilBusca.tetoValorCentavos,
};

/** Painel do assinante: dados básicos + perfil, por e-mail. */
export async function painelPorEmail(email: string) {
  const [l] = await db
    .select(CAMPOS_PAINEL)
    .from(assinante)
    .leftJoin(perfilBusca, eq(perfilBusca.assinanteId, assinante.id))
    .where(eq(assinante.email, email.toLowerCase()));
  return l ?? null;
}

/** Mesmo shape, por id — para a visão do admin (/admin/assinantes/[id]). */
export async function painelPorId(id: string) {
  const [l] = await db
    .select(CAMPOS_PAINEL)
    .from(assinante)
    .leftJoin(perfilBusca, eq(perfilBusca.assinanteId, assinante.id))
    .where(eq(assinante.id, id));
  return l ?? null;
}

export async function ativarAssinante(email: string): Promise<void> {
  await db
    .update(assinante)
    .set({ status: "ativo", verificadoEm: new Date() })
    .where(eq(assinante.email, email));
}

/**
 * Suprime um assinante (bounce forte ou reclamação de spam). Não apaga —
 * marca status "suprimido" para nunca mais enviar. Ver alertas-e-envio.md.
 * Retorna quantos foram afetados.
 */
export async function suprimirAssinante(email: string): Promise<number> {
  const linhas = await db
    .update(assinante)
    .set({ status: "suprimido" })
    .where(eq(assinante.email, email.toLowerCase()))
    .returning({ id: assinante.id });
  return linhas.length;
}
