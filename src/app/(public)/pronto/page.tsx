/** Confirmação pós-cadastro. Calibra a expectativa: a promessa é saber, não faturar. */
export default function ProntoPage() {
  return (
    <main style={{ maxWidth: 560, margin: "5rem auto", padding: "0 1.25rem" }}>
      <h1 style={{ fontSize: "1.6rem" }}>Pronto. A partir de agora a gente olha por você.</h1>
      <p style={{ fontSize: "1.05rem", color: "var(--suave)" }}>
        Todo dia a gente lê o que as prefeituras da sua região publicaram. Quando aparecer algo que
        serve para você, você recebe um e-mail.
      </p>
      <p style={{ color: "var(--suave)" }}>
        Pode ser que passe uma semana sem nada — isso é normal e quer dizer que não apareceu nada que
        valesse o seu tempo. Todo sábado a gente manda um resumo, mesmo quando não teve nada, para
        você saber que está funcionando.
      </p>
    </main>
  );
}
