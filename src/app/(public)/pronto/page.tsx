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
        <h1 className="text-2xl font-extrabold tracking-tight">
          Pronto. A partir de agora a gente olha por você.
        </h1>
        <p className="mt-4 text-lg text-suave">
          Todo dia a gente lê o que as prefeituras da sua região publicaram. Quando aparecer algo que
          serve para você, você recebe um e-mail.
        </p>
        <p className="mt-4 text-suave">
          Pode ser que passe uma semana sem nada — isso é normal e quer dizer que não apareceu nada
          que valesse o seu tempo. Todo sábado a gente manda um resumo, mesmo quando não teve nada,
          para você saber que está funcionando.
        </p>
      </Container>
    </main>
  );
}
