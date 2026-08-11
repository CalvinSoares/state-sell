import type { Metadata } from "next";
import { RAMOS } from "@/content/ramos";
import { FAIXAS_TETO } from "@/src/shared/config/faixas-teto";
import { UFS } from "@/src/shared/config/ufs";
import { Container } from "@/src/shared/components/ui";
import { FormularioCadastro } from "./_components/FormularioCadastro";

export const metadata: Metadata = {
  title: "Começar a ser avisado",
  description:
    "Em dois minutos você diz o que vende e onde. A gente passa a olhar as compras das prefeituras por você.",
  alternates: { canonical: "/cadastro" },
  openGraph: {
    title: "Começar a ser avisado",
    description:
      "Em dois minutos você diz o que vende e onde. A gente passa a olhar as compras das prefeituras por você.",
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
          Dois minutos e a gente começa a olhar por você
        </h1>
        <p className="mb-10 mt-2 text-suave">
          Três perguntas. Sem jargão. A promessa é: você vai saber quando a prefeitura quiser comprar
          o que você vende.
        </p>
        <FormularioCadastro ramos={ramos} faixas={faixas} ufs={[...UFS]} />
      </Container>
    </main>
  );
}
