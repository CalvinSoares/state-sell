import { RAMOS } from "@/content/ramos";

/** Landing. Sem jargão — a promessa é saber, não faturar. */
export default function LandingPage() {
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 1.25rem" }}>
      <p style={{ color: "var(--acento)", fontWeight: 600, margin: 0 }}>StateSell</p>
      <h1 style={{ fontSize: "2.2rem", lineHeight: 1.2, marginTop: ".5rem" }}>
        A prefeitura da sua cidade quer comprar o que você vende — e você nunca soube.
      </h1>
      <p style={{ fontSize: "1.15rem", color: "var(--suave)" }}>
        Todo dia prefeituras compram marmita, impressão, limpeza, conserto. Por lei, boa parte
        dessas compras é reservada para o negócio pequeno. A gente lê os anúncios por você e te
        avisa quando aparecer algo que serve. Você vai saber; disputar é com você.
      </p>

      <a
        href="/cadastro"
        style={{
          display: "inline-block",
          background: "var(--acento)",
          color: "#fff",
          padding: ".8rem 1.4rem",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 600,
          marginTop: ".5rem",
        }}
      >
        Quero ser avisado
      </a>

      <h2 style={{ marginTop: "3rem", fontSize: "1rem", color: "var(--suave)" }}>
        Alguns do que a gente já acompanha
      </h2>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", listStyle: "none", padding: 0 }}>
        {RAMOS.map((r) => (
          <li
            key={r.slug}
            style={{
              border: "1px solid var(--borda)",
              borderRadius: 999,
              padding: ".35rem .8rem",
              fontSize: ".9rem",
            }}
          >
            {r.rotulo}
          </li>
        ))}
      </ul>
    </main>
  );
}
