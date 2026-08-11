/** Entrada do backoffice. Pública (o middleware libera só esta rota). */
export default function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  return (
    <main style={{ maxWidth: 420, margin: "6rem auto", padding: "0 1.25rem" }}>
      <h1 style={{ fontSize: "1.4rem" }}>Backoffice</h1>
      <p style={{ color: "var(--suave)" }}>Acesso restrito.</p>
      <form
        method="post"
        action="/admin/api/entrar"
        style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginTop: "1rem" }}
      >
        <input
          type="email"
          name="email"
          required
          placeholder="seu e-mail"
          autoComplete="email"
          style={{ padding: ".7rem", borderRadius: 8, border: "1px solid var(--borda)" }}
        />
        <button
          type="submit"
          style={{
            padding: ".7rem",
            borderRadius: 8,
            border: 0,
            background: "var(--acento)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </form>
      <ErroEntrada searchParams={searchParams} />
    </main>
  );
}

async function ErroEntrada({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  if (!erro) return null;
  return (
    <p style={{ color: "#b3261e", marginTop: "1rem" }}>
      Não foi possível entrar. Verifique o e-mail.
    </p>
  );
}
