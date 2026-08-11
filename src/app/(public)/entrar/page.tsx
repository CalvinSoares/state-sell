import { EntrarForm } from "./_components/EntrarForm";

/** Login do assinante por magic link. Público. */
export default function EntrarPage() {
  return (
    <main style={{ maxWidth: 440, margin: "5rem auto", padding: "0 1.25rem" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Entrar</h1>
      <p style={{ color: "var(--suave)" }}>
        Digite seu e-mail e a gente manda um link de acesso. Sem senha.
      </p>
      <EntrarForm />
      <p style={{ color: "var(--suave)", fontSize: ".9rem", marginTop: "1.5rem" }}>
        Ainda não tem cadastro? <a href="/cadastro">Comece aqui</a>.
      </p>
    </main>
  );
}
