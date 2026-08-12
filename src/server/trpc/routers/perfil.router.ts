import { TRPCError } from "@trpc/server";
import { centavosParaFaixa, tetoParaCentavos } from "@/src/shared/config/faixas-teto";
import {
  atualizarPerfilAssinante,
  painelPorEmail,
} from "@/src/server/db/repositorios/assinante.repo";
import { municipioPorCodigo } from "@/src/server/ibge/municipios";
import { assinanteProcedure } from "../assinante";
import { router } from "../trpc";
import { PerfilSchema } from "./input/perfil.schema";

export const perfilRouter = router({
  obter: assinanteProcedure.query(async ({ ctx }) => {
    const dados = await painelPorEmail(ctx.assinanteEmail);
    if (!dados) throw new TRPCError({ code: "NOT_FOUND", message: "Conta não encontrada" });

    const municipios = dados.municipiosIbge ?? [];
    const abrangencia = municipios.length > 0 ? ("cidade" as const) : ("estado" as const);
    const codigoMunicipio = municipios[0];
    const muni = codigoMunicipio ? municipioPorCodigo(codigoMunicipio) : undefined;

    return {
      email: dados.email,
      uf: (dados.uf ?? "SP") as string,
      abrangencia,
      codigoMunicipio,
      cidadeNome: muni?.nome ?? null,
      ramos: dados.ramos ?? [],
      teto: centavosParaFaixa(dados.tetoValorCentavos),
    };
  }),

  atualizar: assinanteProcedure.input(PerfilSchema).mutation(async ({ ctx, input }) => {
    let municipiosIbge: string[] = [];
    if (input.abrangencia === "cidade") {
      const muni = input.codigoMunicipio ? municipioPorCodigo(input.codigoMunicipio) : undefined;
      if (!muni || muni.uf !== input.uf) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cidade inválida para o estado escolhido" });
      }
      municipiosIbge = [muni.codigoIbge];
    }

    const ok = await atualizarPerfilAssinante(ctx.assinanteEmail, {
      uf: input.uf,
      municipiosIbge,
      ramos: input.ramos,
      tetoValorCentavos: tetoParaCentavos(input.teto),
    });
    if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Conta não encontrada" });
    return { ok: true as const };
  }),
});
