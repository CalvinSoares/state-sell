import type { Metadata } from "next";
import { Container } from "@/src/shared/components/ui";

export const metadata: Metadata = {
  title: "Cadastro concluído",
  robots: { index: false, follow: false },
};

/** Confirmação pós-cadastro. Calibra a expectativa: a promessa é saber, não faturar. */
export default function ProntoPage() {
  return (
    <main className="py-20">
      <Container size="md">
        <h1 className="text-2xl font-extrabold tracking-tight">Pronto. Cadastro confirmado.</h1>
        <p className="mt-4 text-lg text-suave">
          Quando sair uma compra na sua região que bata com o que você vende, a gente manda e-mail.
        </p>
        <p className="mt-4 text-suave">
          Pode passar uma semana sem nada — às vezes não aparece o que cabe no seu limite. No sábado
          chega um resumo do que a gente viu, mesmo sem aviso no meio da semana.
        </p>
      </Container>
    </main>
  );
}
