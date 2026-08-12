import type { Metadata } from "next";
import { RAMOS } from "@/content/ramos";
import { FAIXAS_TETO } from "@/src/shared/config/faixas-teto";
import { UFS } from "@/src/shared/config/ufs";
import { Container } from "@/src/shared/components/ui";
import { FormularioCadastro } from "./_components/FormularioCadastro";

export const metadata: Metadata = {
  title: "Quero ser avisado",
  description:
    "Diz o que você vende e onde. Quando a prefeitura publicar algo do seu ramo, o e-mail chega.",
  alternates: { canonical: "/cadastro" },
  openGraph: {
    title: "Quero ser avisado",
    description:
      "Diz o que você vende e onde. Quando a prefeitura publicar algo do seu ramo, o e-mail chega.",
    url: "/cadastro",
  },
};

/**
 * Composição — sem lógica. Passa os dados estáticos (ramos, faixas, UFs) já
 * renderizados no servidor, para não haver pop-in de conteúdo no cliente.
 */
export default function CadastroPage() {
  const ramos = RAMOS.map((r) => ({ slug: r.slug, rotulo: r.rotulo, ajuda: r.ajuda }));
  const faixas = FAIXAS_TETO.map((f) => ({ valor: f.valor, rotulo: f.rotulo }));

  return (
    <main className="py-12">
      <Container size="md">
        <p className="text-sm font-extrabold uppercase tracking-wide text-acento">Prefeitura Quer</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Diz o que você vende e a gente avisa
        </h1>
        <p className="mb-10 mt-2 text-suave">
          Três perguntas. Sem jargão. Quando sair compra do seu ramo na sua região, o e-mail chega.
        </p>
        <FormularioCadastro ramos={ramos} faixas={faixas} ufs={[...UFS]} />
      </Container>
    </main>
  );
}
