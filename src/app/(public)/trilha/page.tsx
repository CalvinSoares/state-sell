import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/src/shared/components/ui";
import { SITE } from "@/src/shared/config/site";

export const metadata: Metadata = {
  title: "Como participar da primeira vez",
  description:
    "Passo a passo em português: conta gov.br, cadastro, certidões, ler o edital e enviar a proposta. Só processo — sem juridiquês.",
  alternates: { canonical: "/trilha" },
  openGraph: {
    title: "Como participar da primeira vez",
    description:
      "Passo a passo em português: conta gov.br, cadastro, certidões, ler o edital e enviar a proposta.",
    url: "/trilha",
  },
};

const PASSOS = [
  {
    titulo: "Conta gov.br",
    corpo: [
      "A maioria dos sistemas de compra pede login com a conta gov.br.",
      "Existem níveis (bronze, prata, ouro). Para participar de compras, em geral você precisa de prata ou ouro.",
      "Prata e ouro costumam pedir reconhecimento facial no app ou validação em banco. O caminho muda com o tempo — siga o que o próprio gov.br mostrar na hora.",
    ],
  },
  {
    titulo: "Cadastro no sistema de compras",
    corpo: [
      "Cada prefeitura ou órgão usa um sistema (portal) para receber propostas. O link do aviso aponta para o certo.",
      "Na primeira vez, você se cadastra como fornecedor com o CNPJ do seu negócio e os dados básicos.",
      "Tenha em mãos: CNPJ, endereço, e-mail e telefone. Alguns pedem documentos na hora; outros só depois.",
    ],
  },
  {
    titulo: "As certidões",
    corpo: [
      "Quase toda compra pede certidões “em dia” — documentos que mostram que você não tem pendência fiscal ou trabalhista.",
      "As mais comuns: federal (Receita/PGFN), FGTS, trabalhista (CNDT), e às vezes estadual ou municipal.",
      "Elas vencem. Anote a data que está no papel. Se estiver perto de vencer no dia da disputa, renove antes — certidão vencida costuma desclassificar na hora.",
      "Onde tirar e quanto demora mudam por órgão. Comece pelos sites oficiais de cada certidão.",
    ],
  },
  {
    titulo: "Ler um edital sem se perder",
    corpo: [
      "Ignore o juridiquês no começo. Olhe nesta ordem:",
      "1) O que querem comprar — combina com o que você entrega?",
      "2) Quanto — cabe na sua estrutura?",
      "3) Até quando — dá tempo de montar a proposta?",
      "4) Quem pode participar — às vezes é exclusivo para micro e pequena empresa.",
      "Se algo parecer caso de advogado ou contador (recurso, enquadramento, impugnação), é caso para eles — a gente não opina nisso.",
    ],
  },
  {
    titulo: "Enviar a proposta",
    corpo: [
      "No sistema do órgão, você entra na disputa, manda o preço (e os documentos pedidos) dentro do prazo.",
      "A sessão eletrônica tem horário. Entre com folga; deixe o cadastro e as certidões prontos antes.",
      "Depois do encerramento, o sistema mostra a classificação. Se você ganhou, vêm as etapas de homologação e contrato — o edital e o próprio portal explicam o próximo passo.",
    ],
  },
  {
    titulo: "Ganhei — e agora?",
    corpo: [
      "Em geral: assinar o contrato (ou instrumento equivalente), entregar o que foi pedido, emitir a nota e acompanhar o pagamento.",
      "Prazos de entrega e forma de faturamento estão no edital ou no contrato. Leia com calma antes de assinar.",
      "Dúvida jurídica ou tributária: contador ou advogado. O Prefeitura Quer avisa da compra; mandar proposta e cumprir é com você.",
    ],
  },
];

/** Trilha estática "primeira licitação". Só processo — sem opinião jurídica. */
export default function TrilhaPage() {
  return (
    <main className="pb-16 pt-10">
      <Container size="md">
        <p className="m-0 font-semibold text-acento">
          <Link href="/" className="text-acento no-underline">
            {SITE.nome}
          </Link>
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Como participar da primeira vez
        </h1>
        <p className="mt-2 text-suave">
          Passo a passo em português. Explica o processo — não substitui contador nem advogado.
        </p>

        <ol className="mt-10 grid list-none gap-8 p-0">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="rounded-card border border-borda bg-cartao p-5">
              <h2 className="m-0 text-xl font-bold tracking-tight">
                <span className="text-acento">{i + 1}.</span> {p.titulo}
              </h2>
              <div className="mt-3 space-y-2 text-suave">
                {p.corpo.map((par, j) => (
                  <p key={j} className="m-0">
                    {par}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-card border border-borda bg-acento-suave px-5 py-4 text-sm">
          <strong className="text-tinta">Só processo:</strong>{" "}
          <span className="text-suave">
            esta página não fala se “vale a pena” entrar, nem sobre recurso, impugnação ou
            enquadramento. Pergunta jurídica → contador ou advogado.
          </span>
        </div>

        <p className="mt-10 text-sm text-suave">
          <Link href="/cadastro">Quero ser avisado</Link>
          {" · "}
          <Link href="/">Voltar ao início</Link>
        </p>
      </Container>
    </main>
  );
}
