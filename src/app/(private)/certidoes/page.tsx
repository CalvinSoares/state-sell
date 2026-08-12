import Link from "next/link";
import { Container } from "@/src/shared/components/ui";
import { CofreCertidoes } from "./_components/CofreCertidoes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cofre de certidões",
  robots: { index: false, follow: false },
};

/** Cofre leve: datas de vencimento + lembretes. Sem PDF nesta onda. */
export default function CertidoesPage() {
  return (
    <main className="py-12">
      <Container size="md">
        <p className="m-0 text-sm">
          <Link className="text-acento" href="/painel">
            ← Seus avisos
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Cofre de certidões</h1>
        <p className="mt-2 text-suave">
          Guarde as datas de vencimento pra não esquecer no dia da disputa. A gente só lembra a data
          que você colocou.
        </p>
        <div className="mt-8">
          <CofreCertidoes />
        </div>
      </Container>
    </main>
  );
}
