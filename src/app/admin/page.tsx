import Link from "next/link";
import { adminAtual } from "@/src/server/auth/admin";

const CARTOES = [
  { href: "/admin/rotular", titulo: "Rotular itens", desc: "A régua do casamento. Atalhos de teclado." },
  { href: "/admin/jobs", titulo: "Jobs", desc: "Coleta: execuções, erros, cursores." },
  { href: "/admin/assinantes", titulo: "Assinantes", desc: "Perfil, entrega, feedback." },
];

export default async function AdminHome() {
  const email = await adminAtual();
  return (
    <main style={{ maxWidth: 720, margin: "3rem auto", padding: "0 1.25rem" }}>
      <p style={{ color: "var(--suave)", margin: 0 }}>Backoffice · {email}</p>
      <h1 style={{ fontSize: "1.6rem", marginTop: ".25rem" }}>Bancada</h1>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", marginTop: "1.5rem" }}>
        {CARTOES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            style={{
              border: "1px solid var(--borda)",
              borderRadius: 12,
              padding: "1.1rem",
              textDecoration: "none",
              color: "var(--tinta)",
            }}
          >
            <strong>{c.titulo}</strong>
            <p style={{ color: "var(--suave)", margin: ".35rem 0 0", fontSize: ".9rem" }}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
