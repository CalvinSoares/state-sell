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

/** Confirma o e-mail (magic link) e ativa o assinante. */
/** E-mail do assinante por id (para o resumo semanal). */
export async function emailPorAssinante(assinanteId: string): Promise<string | null> {
  const [l] = await db
    .select({ email: assinante.email })
    .from(assinante)
    .where(eq(assinante.id, assinanteId));
  return l?.email ?? null;
}

/** Painel do assinante: dados básicos + perfil, por e-mail. */
export async function painelPorEmail(email: string) {
  const [l] = await db
    .select({
      id: assinante.id,
      email: assinante.email,
      status: assinante.status,
      ramos: perfilBusca.ramos,
      municipiosIbge: perfilBusca.municipiosIbge,
      uf: perfilBusca.uf,
      tetoValorCentavos: perfilBusca.tetoValorCentavos,
    })
    .from(assinante)
    .leftJoin(perfilBusca, eq(perfilBusca.assinanteId, assinante.id))
    .where(eq(assinante.email, email.toLowerCase()));
  return l ?? null;
}

export async function ativarAssinante(email: string): Promise<void> {
  await db
    .update(assinante)
    .set({ status: "ativo", verificadoEm: new Date() })
    .where(eq(assinante.email, email));
}
