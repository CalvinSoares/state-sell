import { z } from "zod";
import { RAMOS } from "@/content/ramos";
import { FAIXAS_TETO, type FaixaTeto } from "@/src/shared/config/faixas-teto";
import { UFS } from "@/src/shared/config/ufs";

const SLUGS = RAMOS.map((r) => r.slug) as [string, ...string[]];
const FAIXAS = FAIXAS_TETO.map((f) => f.valor) as [FaixaTeto, ...FaixaTeto[]];

const perfilCampos = {
  uf: z.enum(UFS),
  abrangencia: z.enum(["cidade", "estado"]),
  codigoMunicipio: z.string().optional(),
  ramos: z.array(z.enum(SLUGS)).min(1, "Escolha o que você vende"),
  teto: z.enum(FAIXAS),
};

function comCidadeObrigatoria<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (v: { abrangencia: string; codigoMunicipio?: string }) =>
      v.abrangencia !== "cidade" || Boolean(v.codigoMunicipio),
    { message: "Escolha a sua cidade", path: ["codigoMunicipio"] },
  );
}

/** Campos de perfil (sem e-mail) — cadastro e edição compartilham. */
export const PerfilSchema = comCidadeObrigatoria(z.object(perfilCampos));

export const CadastroSchema = comCidadeObrigatoria(
  z.object({
    ...perfilCampos,
    email: z.string().email("Digite um e-mail válido"),
    nome: z.string().optional(),
  }),
);

export type PerfilInput = z.infer<typeof PerfilSchema>;

export { SLUGS, FAIXAS };
