import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/src/shared/components/ui";
import { EntrarForm } from "./_components/EntrarForm";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta com um link enviado por e-mail. Sem senha.",
  alternates: { canonical: "/entrar" },
  openGraph: {
    title: "Entrar",
    description: "Acesse sua conta com um link enviado por e-mail. Sem senha.",
    url: "/entrar",
  },
};

/** Login do assinante por magic link. Público. */
export default function EntrarPage() {
  return (
    <main className="py-20">
      <Container size="sm">
        <h1 className="text-2xl font-extrabold tracking-tight">Entrar</h1>
        <p className="mt-2 text-suave">
          Digite seu e-mail e a gente manda um link de acesso. Sem senha.
        </p>
        <div className="mt-6">
          <EntrarForm />
        </div>
        <p className="mt-6 text-sm text-suave">
          Ainda não tem cadastro?{" "}
          <Link className="text-acento" href="/cadastro">
            Comece aqui
          </Link>
          .
        </p>
        <p className="mt-3 text-sm text-suave">
          <Link className="text-acento" href="/privacidade">
            Privacidade
          </Link>
        </p>
      </Container>
    </main>
  );
}
