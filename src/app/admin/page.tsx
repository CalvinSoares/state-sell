import Link from "next/link";
import { adminAtual } from "@/src/server/auth/admin";
import { Container } from "@/src/shared/components/ui";

const CARTOES = [
  { href: "/admin/rotular", titulo: "Rotular itens", desc: "A régua do casamento. Atalhos de teclado." },
  { href: "/admin/alertas", titulo: "Alertas", desc: "Enviados, pendentes e feedback." },
  { href: "/admin/ramos", titulo: "Ramos", desc: "Catálogo e progresso de rotulagem." },
  { href: "/admin/contratacoes", titulo: "Contratações", desc: "Busca livre para diagnóstico." },
  { href: "/admin/assinantes", titulo: "Assinantes", desc: "Perfil, entrega, simulação 30 dias." },
  { href: "/admin/jobs", titulo: "Jobs", desc: "Coleta: execuções, erros, cursores." },
];

export default async function AdminHome() {
  const email = await adminAtual();
  return (
    <main className="py-12">
      <Container size="md">
        <p className="m-0 text-suave">Backoffice · {email}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Bancada</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {CARTOES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-card border border-borda bg-cartao p-5 text-tinta no-underline transition-colors hover:border-acento"
            >
              <strong>{c.titulo}</strong>
              <p className="mt-1.5 text-sm text-suave">{c.desc}</p>
            </Link>
          ))}
        </div>
      </Container>
    </main>
  );
}
