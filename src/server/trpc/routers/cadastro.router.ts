import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { env } from "@/src/env";
import { consumirLimite, ipDoRequest } from "@/src/server/rate-limit/limitar";
import { RAMOS } from "@/content/ramos";
import { FAIXAS_TETO, tetoParaCentavos, type FaixaTeto } from "@/src/shared/config/faixas-teto";
import { assinarSessao, VALIDADE_MAGIC_MS } from "@/src/server/auth/sessao";
import { criarOuAtualizarAssinante } from "@/src/server/db/repositorios/assinante.repo";
import { enviarEmailBruto } from "@/src/server/alerta/enviar.action";
import { buscarMunicipios, municipioPorCodigo } from "@/src/server/ibge/municipios";
import { UFS } from "@/src/shared/config/ufs";
import { publicProcedure, router } from "../trpc";

const SLUGS = RAMOS.map((r) => r.slug) as [string, ...string[]];

/** Nunca assinar com segredo público. Sem AUTH_SECRET, o fluxo falha alto. */
function exigirSegredo(): string {
  if (!env.AUTH_SECRET) throw new Error("AUTH_SECRET não configurado");
  return env.AUTH_SECRET;
}

/** Rate limit (auditoria #2): protege as rotas que disparam e-mail de mail-bombing. */
async function limitarEnvio(headers: Headers, email: string): Promise<void> {
  const ip = ipDoRequest(headers);
  const porIp = await consumirLimite(`envio:ip:${ip}`, 10, 3600); // 10/h por IP
  const porEmail = await consumirLimite(`envio:email:${email}`, 3, 3600); // 3/h por e-mail
  if (!porIp.permitido || !porEmail.permitido) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Muitas tentativas. Tente de novo daqui a pouco.",
    });
  }
}
const FAIXAS = FAIXAS_TETO.map((f) => f.valor) as [FaixaTeto, ...FaixaTeto[]];

const CadastroSchema = z
  .object({
    email: z.string().email("Digite um e-mail válido"),
    nome: z.string().optional(),
    uf: z.enum(UFS),
    // abrangência: só a cidade escolhida, ou o estado inteiro
    abrangencia: z.enum(["cidade", "estado"]),
    codigoMunicipio: z.string().optional(),
    ramos: z.array(z.enum(SLUGS)).min(1, "Escolha o que você vende"),
    teto: z.enum(FAIXAS),
  })
  .refine((v) => v.abrangencia !== "cidade" || Boolean(v.codigoMunicipio), {
    message: "Escolha a sua cidade",
    path: ["codigoMunicipio"],
  });

export const cadastroRouter = router({
  buscarMunicipios: publicProcedure
    .input(z.object({ uf: z.enum(UFS), termo: z.string() }))
    .query(({ input }) => buscarMunicipios(input.uf, input.termo)),

  criar: publicProcedure.input(CadastroSchema).mutation(async ({ input, ctx }) => {
    const email = input.email.trim().toLowerCase();
    await limitarEnvio(ctx.headers, email);

    // Resolve a abrangência em municípios de verdade, validando contra a base IBGE.
    let municipiosIbge: string[] = [];
    if (input.abrangencia === "cidade") {
      const muni = input.codigoMunicipio ? municipioPorCodigo(input.codigoMunicipio) : undefined;
      if (!muni || muni.uf !== input.uf) {
        throw new Error("Cidade inválida para o estado escolhido");
      }
      municipiosIbge = [muni.codigoIbge];
    }

    await criarOuAtualizarAssinante({
      email,
      nome: input.nome,
      uf: input.uf,
      municipiosIbge,
      ramos: input.ramos,
      tetoValorCentavos: tetoParaCentavos(input.teto),
    });

    // magic link de confirmação (curto, uso único via jti). novo=1 → /pronto.
    const token = await assinarSessao(email, exigirSegredo(), Date.now(), {
      validadeMs: VALIDADE_MAGIC_MS,
      aud: "magic",
      jti: crypto.randomUUID(),
    });
    const url = `${env.NEXT_PUBLIC_APP_URL}/verificar?token=${encodeURIComponent(token)}&novo=1`;
    await enviarEmailBruto(
      email,
      "Confirme seu e-mail — Prefeitura Quer",
      `<p>Falta um passo: confirme seu e-mail para começar a receber os avisos.</p>
       <p><a href="${url}">Confirmar meu e-mail</a></p>`,
      `Falta um passo: confirme seu e-mail.\n\n${url}`,
    );

    // Nunca revela se o e-mail já existia. Sempre a mesma resposta.
    return { ok: true };
  }),

  /**
   * Login de quem já é assinante: manda um link de acesso. Resposta sempre igual,
   * exista ou não o e-mail (não revela cadastro). Ver cadastro-do-assinante.md.
   */
  enviarLinkAcesso: publicProcedure
    .input(z.object({ email: z.string().email("Digite um e-mail válido") }))
    .mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      await limitarEnvio(ctx.headers, email);
      const token = await assinarSessao(email, exigirSegredo(), Date.now(), {
        validadeMs: VALIDADE_MAGIC_MS,
        aud: "magic",
        jti: crypto.randomUUID(),
      });
      const url = `${env.NEXT_PUBLIC_APP_URL}/verificar?token=${encodeURIComponent(token)}`;
      await enviarEmailBruto(
        email,
        "Seu link de acesso — Prefeitura Quer",
        `<p>Aqui está seu link para entrar (vale por 30 minutos):</p>
         <p><a href="${url}">Entrar na sua conta</a></p>`,
        `Seu link para entrar (vale 30 min):\n\n${url}`,
      );
      return { ok: true };
    }),
});
