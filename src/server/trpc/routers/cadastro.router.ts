import { z } from "zod";
import { env } from "@/src/env";
import { RAMOS } from "@/content/ramos";
import { FAIXAS_TETO, tetoParaCentavos, type FaixaTeto } from "@/src/shared/config/faixas-teto";
import { assinarSessao, VALIDADE_MAGIC_MS } from "@/src/server/auth/sessao";
import { criarOuAtualizarAssinante } from "@/src/server/db/repositorios/assinante.repo";
import { enviarEmailBruto } from "@/src/server/alerta/enviar.action";
import { buscarMunicipios, municipioPorCodigo } from "@/src/server/ibge/municipios";
import { publicProcedure, router } from "../trpc";

const SLUGS = RAMOS.map((r) => r.slug) as [string, ...string[]];
const FAIXAS = FAIXAS_TETO.map((f) => f.valor) as [FaixaTeto, ...FaixaTeto[]];

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

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
  faixasTeto: publicProcedure.query(() =>
    FAIXAS_TETO.map((f) => ({ valor: f.valor, rotulo: f.rotulo })),
  ),

  ufs: publicProcedure.query(() => UFS),

  buscarMunicipios: publicProcedure
    .input(z.object({ uf: z.enum(UFS), termo: z.string() }))
    .query(({ input }) => buscarMunicipios(input.uf, input.termo)),

  criar: publicProcedure.input(CadastroSchema).mutation(async ({ input }) => {
    const email = input.email.trim().toLowerCase();

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

    // magic link de confirmação (curto). novo=1 → cai em /pronto (onboarding).
    const token = await assinarSessao(email, env.AUTH_SECRET ?? "sem-segredo", Date.now(), VALIDADE_MAGIC_MS);
    const url = `${env.NEXT_PUBLIC_APP_URL}/verificar?token=${encodeURIComponent(token)}&novo=1`;
    await enviarEmailBruto(
      email,
      "Confirme seu e-mail — StateSell",
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
    .mutation(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      const token = await assinarSessao(email, env.AUTH_SECRET ?? "sem-segredo", Date.now(), VALIDADE_MAGIC_MS);
      const url = `${env.NEXT_PUBLIC_APP_URL}/verificar?token=${encodeURIComponent(token)}`;
      await enviarEmailBruto(
        email,
        "Seu link de acesso — StateSell",
        `<p>Aqui está seu link para entrar (vale por 30 minutos):</p>
         <p><a href="${url}">Entrar no StateSell</a></p>`,
        `Seu link para entrar (vale 30 min):\n\n${url}`,
      );
      return { ok: true };
    }),
});
