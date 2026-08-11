import { FormularioCadastro } from "./_components/FormularioCadastro";

/** Composição — sem lógica. As 3 perguntas vivem no formulário. */
export default function CadastroPage() {
  return (
    <main style={{ maxWidth: 600, margin: "3rem auto", padding: "0 1.25rem" }}>
      <p style={{ color: "var(--acento)", fontWeight: 600, margin: 0 }}>Prefeitura Quer</p>
      <h1 style={{ fontSize: "1.8rem", marginTop: ".25rem" }}>Dois minutos e a gente começa a olhar por você</h1>
      <p style={{ color: "var(--suave)", marginBottom: "2.5rem" }}>
        Três perguntas. Sem jargão. A promessa é: você vai saber quando a prefeitura quiser comprar o
        que você vende.
      </p>
      <FormularioCadastro />
    </main>
  );
}
