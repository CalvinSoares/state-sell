import { redirect } from "next/navigation";
import { RAMOS } from "@/content/ramos";
import { FAIXAS_TETO } from "@/src/shared/config/faixas-teto";
import { UFS } from "@/src/shared/config/ufs";
import { assinanteAtual } from "@/src/server/auth/assinante";
import { painelPorEmail } from "@/src/server/db/repositorios/assinante.repo";
import { municipioPorCodigo } from "@/src/server/ibge/municipios";
import { centavosParaFaixa } from "@/src/shared/config/faixas-teto";
import { Container } from "@/src/shared/components/ui";
import { FormularioPerfil } from "./_components/FormularioPerfil";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seu perfil",
  robots: { index: false, follow: false },
};

/** Edição do perfil — mesmas 3 perguntas do cadastro. Vale daqui pra frente. */
export default async function PerfilPage() {
  const email = await assinanteAtual();
  if (!email) redirect("/entrar");

  const dados = await painelPorEmail(email);
  if (!dados) redirect("/entrar");

  const municipios = dados.municipiosIbge ?? [];
  const codigoMunicipio = municipios[0];
  const muni = codigoMunicipio ? municipioPorCodigo(codigoMunicipio) : undefined;

  const ramos = RAMOS.map((r) => ({ slug: r.slug, rotulo: r.rotulo, ajuda: r.ajuda }));
  const faixas = FAIXAS_TETO.map((f) => ({ valor: f.valor, rotulo: f.rotulo }));

  return (
    <main className="py-12">
      <Container size="sm">
        <p className="m-0 text-suave">{email}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Mudar o que a gente olha</h1>
        <p className="mt-2 text-suave">
          Ramos, cidade e tamanho do pedido. Os avisos novos usam isso; o histórico fica como está.
        </p>
        <div className="mt-8">
          <FormularioPerfil
            ramos={ramos}
            faixas={faixas}
            ufs={[...UFS]}
            inicial={{
              uf: dados.uf ?? "SP",
              abrangencia: municipios.length > 0 ? "cidade" : "estado",
              codigoMunicipio,
              cidadeNome: muni?.nome ?? null,
              ramos: dados.ramos ?? [],
              teto: centavosParaFaixa(dados.tetoValorCentavos),
            }}
          />
        </div>
      </Container>
    </main>
  );
}
