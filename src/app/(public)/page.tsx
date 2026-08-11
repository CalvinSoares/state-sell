import Link from "next/link";
import { RAMOS } from "@/content/ramos";

/** Landing. A promessa é saber, não faturar. Zero jargão. Ver contexto-produto.md. */
export default function LandingPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3.5rem 1.25rem 5rem" }}>
      <p style={{ color: "var(--acento)", fontWeight: 700, margin: 0, letterSpacing: ".02em" }}>
        StateSell
      </p>

      <h1 style={{ fontSize: "2.3rem", lineHeight: 1.15, marginTop: ".5rem" }}>
        A prefeitura da sua cidade quer comprar o que você vende — e você nunca soube.
      </h1>

      <p style={{ fontSize: "1.15rem", color: "var(--suave)", maxWidth: 620 }}>
        Todo dia prefeituras compram marmita, impressão, limpeza, conserto. Por lei, boa parte
        dessas compras é reservada para o negócio pequeno. A gente lê os anúncios por você e avisa
        quando aparecer algo que serve. <strong style={{ color: "var(--tinta)" }}>Você vai saber;
        disputar é com você.</strong>
      </p>

      <Botao href="/cadastro">Quero ser avisado</Botao>
      <p style={{ color: "var(--suave)", fontSize: ".9rem", marginTop: ".6rem" }}>
        Leva 2 minutos. Sem cartão. Sem juridiquês.
      </p>

      {/* Exemplo concreto — o próprio e-mail é o argumento de venda */}
      <ExemploEmail />

      {/* Como funciona */}
      <h2 style={h2}>Como funciona</h2>
      <ol style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}>
        <Passo n={1} titulo="Você diz o que vende e onde">
          Três perguntas em português. O que você faz, sua cidade (ou o estado inteiro) e o maior
          pedido que você dá conta.
        </Passo>
        <Passo n={2} titulo="A gente vigia os anúncios por você">
          Várias vezes ao dia lemos as compras que as prefeituras publicam e separamos as que
          combinam com o seu negócio.
        </Passo>
        <Passo n={3} titulo="Chega um e-mail quando serve">
          Curto, decidível em trinta segundos: o que querem comprar, quanto, e até quando você pode
          mandar seu preço.
        </Passo>
      </ol>

      {/* Ramos */}
      <h2 style={h2}>Alguns do que a gente já acompanha</h2>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", listStyle: "none", padding: 0 }}>
        {RAMOS.map((r) => (
          <li key={r.slug} style={chip}>
            {r.rotulo}
          </li>
        ))}
      </ul>

      {/* Honestidade — reduz frustração e cancelamento */}
      <div style={{ ...cartao, marginTop: "2.5rem" }}>
        <p style={{ margin: 0 }}>
          <strong>Para ser honesto:</strong> a gente te mostra a oportunidade — quem disputa e
          vence é você. Tem semana que não aparece nada, e tudo bem: no sábado mandamos um resumo
          para você saber que o serviço está de olho.
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
        <Botao href="/cadastro">Começar agora</Botao>
      </div>
    </main>
  );
}

function ExemploEmail() {
  return (
    <figure
      style={{
        ...cartao,
        margin: "2.5rem 0 0",
        borderLeft: "3px solid var(--acento)",
      }}
    >
      <figcaption style={{ color: "var(--suave)", fontSize: ".8rem", marginBottom: ".75rem" }}>
        Um aviso de verdade fica assim:
      </figcaption>
      <p style={{ fontWeight: 700, margin: 0 }}>A Prefeitura de Sorocaba quer comprar marmita.</p>
      <p style={{ margin: ".5rem 0 0" }}>400 refeições por mês, para a escola do Jardim Paulista.</p>
      <p style={{ margin: ".15rem 0 0" }}>Valor estimado: por volta de R$ 38 mil no ano.</p>
      <p style={{ margin: ".15rem 0 0" }}>Exclusivo para micro e pequena empresa.</p>
      <p style={{ margin: ".75rem 0 0", fontWeight: 600 }}>
        Prazo para proposta: quinta, 14/08 às 9h — faltam 3 dias.
      </p>
    </figure>
  );
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li style={{ ...cartao, display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      <span
        style={{
          flex: "0 0 auto",
          width: 32,
          height: 32,
          borderRadius: 999,
          background: "var(--acento-suave)",
          color: "var(--acento)",
          fontWeight: 700,
          display: "grid",
          placeItems: "center",
        }}
      >
        {n}
      </span>
      <span>
        <strong>{titulo}</strong>
        <p style={{ color: "var(--suave)", margin: ".25rem 0 0" }}>{children}</p>
      </span>
    </li>
  );
}

function Botao({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        background: "var(--acento)",
        color: "#fff",
        padding: ".85rem 1.5rem",
        borderRadius: 10,
        textDecoration: "none",
        fontWeight: 700,
        marginTop: "1.25rem",
      }}
    >
      {children}
    </Link>
  );
}

const h2: React.CSSProperties = { marginTop: "3rem", fontSize: "1.35rem" };

const cartao: React.CSSProperties = {
  background: "var(--cartao)",
  border: "1px solid var(--borda)",
  borderRadius: 14,
  padding: "1.1rem 1.25rem",
};

const chip: React.CSSProperties = {
  border: "1px solid var(--borda)",
  background: "var(--cartao)",
  borderRadius: 999,
  padding: ".4rem .85rem",
  fontSize: ".9rem",
};
