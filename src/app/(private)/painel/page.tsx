import { redirect } from "next/navigation";
import { assinanteAtual } from "@/src/server/auth/assinante";
import { painelPorEmail } from "@/src/server/db/repositorios/assinante.repo";
import { alertasDoAssinante } from "@/src/server/db/repositorios/alerta.repo";
import { regiaoLabel } from "@/src/server/ibge/municipios";
import { Container } from "@/src/shared/components/ui";
import { PainelView } from "@/src/shared/components/app/PainelView";

export const dynamic = "force-dynamic";

/** Área do assinante. O middleware garante sessão; aqui só compõe. */
export default async function PainelPage() {
  const email = await assinanteAtual();
  if (!email) redirect("/entrar");

  const dados = await painelPorEmail(email);
  if (!dados) redirect("/entrar");

  const alertas = dados.id ? await alertasDoAssinante(dados.id) : [];

  return (
    <main className="py-12">
      <Container size="md">
        <p className="m-0 text-suave">{email}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Seus avisos</h1>
        <PainelView
          regiao={regiaoLabel(dados.municipiosIbge, dados.uf)}
          ramos={dados.ramos ?? []}
          alertas={alertas}
          agora={new Date()}
          contexto="assinante"
        />
      </Container>
    </main>
  );
}
