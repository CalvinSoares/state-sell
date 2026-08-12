import type { Metadata } from "next";
import { RAMOS } from "@/content/ramos";
import { SITE, urlAbsoluta, urlDoSite } from "@/src/shared/config/site";
import { Badge, Card, Container, LinkButton } from "@/src/shared/components/ui";

export const metadata: Metadata = {
  title: { absolute: SITE.tituloPadrao },
  description: SITE.descricao,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE.tituloPadrao,
    description: SITE.descricao,
    url: "/",
    type: "website",
  },
};

/** Landing. A promessa é saber, não faturar. Zero jargão. Ver contexto-produto.md. */
export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${urlDoSite()}/#organizacao`,
        name: SITE.nome,
        url: urlDoSite(),
        description: SITE.descricao,
        email: SITE.emailContato,
      },
      {
        "@type": "WebSite",
        "@id": `${urlDoSite()}/#site`,
        name: SITE.nome,
        url: urlDoSite(),
        description: SITE.descricao,
        inLanguage: SITE.idioma,
        publisher: { "@id": `${urlDoSite()}/#organizacao` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE.nome,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: urlAbsoluta("/"),
        description: SITE.descricao,
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
      },
    ],
  };

  return (
    <main className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="border-b border-borda bg-acento-suave">
        <Container className="py-16 md:py-24">
          <p className="text-sm font-extrabold uppercase tracking-wide text-acento">Prefeitura Quer</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
            A prefeitura da sua cidade quer comprar o que você vende — e você nunca soube.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-suave">
            Todo dia prefeituras compram marmita, impressão, limpeza, conserto. Por lei, boa parte
            disso é reservada pra micro e pequena empresa. A gente lê esses anúncios e manda e-mail
            quando sair algo do que você vende. Quem manda a proposta é você.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/cadastro" tamanho="lg">
              Quero ser avisado
            </LinkButton>
            <span className="text-sm text-suave">Uns 2 minutos. Sem cartão.</span>
          </div>
        </Container>
      </section>

      <Container className="mt-14">
        <ExemploEmail />

        <h2 className="mt-16 text-2xl font-bold">Como funciona</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          <Passo n={1} titulo="Você diz o que vende e onde">
            O que você faz, sua cidade (ou o estado inteiro) e o maior pedido que você dá conta.
          </Passo>
          <Passo n={2} titulo="A gente lê o que as prefeituras publicam">
            Pegamos as compras novas e separamos as que batem com o seu ramo e o seu tamanho.
          </Passo>
          <Passo n={3} titulo="Chega um e-mail quando serve">
            O que querem comprar, quanto, e até quando dá pra mandar o preço — sem PDF e sem
            juridiquês.
          </Passo>
        </ol>

        <h2 className="mt-16 text-2xl font-bold">Ramos que a gente acompanha</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {RAMOS.map((r) => (
            <li key={r.slug}>
              <Badge>{r.rotulo}</Badge>
            </li>
          ))}
        </ul>

        <Card className="mt-10 border-l-4 border-l-acento">
          <p className="m-0">
            A gente só avisa. Quem manda a proposta — e quem ganha ou perde — é você. Tem semana sem
            nada; no sábado mandamos um resumo do que rolou na sua região.
          </p>
        </Card>

        <div className="mt-12 text-center">
          <LinkButton href="/cadastro" tamanho="lg">
            Quero ser avisado
          </LinkButton>
        </div>

        <footer className="mt-16 border-t border-borda pt-6 text-sm text-suave">
          <p className="m-0">
            Prefeitura Quer é um serviço independente. <strong>Não temos vínculo</strong> com
            nenhuma prefeitura, governo ou órgão público — a gente só lê os anúncios oficiais, que
            são públicos, e te avisa.
          </p>
          <p className="mt-2">
            Já é assinante?{" "}
            <a className="text-acento" href="/entrar">
              Entrar
            </a>
            .
          </p>
          <p className="mt-2">
            <a className="text-acento" href="/privacidade">
              Privacidade
            </a>
          </p>
        </footer>
      </Container>
    </main>
  );
}

/** O próprio e-mail é o argumento de venda — mostrado como um "recibo". */
function ExemploEmail() {
  return (
    <figure className="overflow-hidden rounded-card border border-borda bg-cartao shadow-[var(--sombra)]">
      <div className="border-b border-borda bg-cartao px-5 py-3 text-sm text-suave">
        Um aviso de verdade fica assim:
      </div>
      <div className="p-5">
        <p className="m-0 text-lg font-bold">A Prefeitura de Sorocaba quer comprar marmita.</p>
        <p className="mt-2">400 refeições por mês, para a escola do Jardim Paulista.</p>
        <div className="mt-3 rounded-lg bg-acento-suave px-3.5 py-3 text-sm">
          <p className="m-0 font-extrabold text-acento-forte">Vale a pena olhar?</p>
          <ul className="mt-1.5 list-none space-y-1 p-0 text-acento-forte">
            <li>✓ Reservado para micro e pequena empresa</li>
            <li>✓ Prazo: faltam 3 dias</li>
            <li>✓ Cabe na sua faixa (por volta de R$ 38 mil)</li>
          </ul>
        </div>
        <div className="mt-3 rounded-lg border border-borda px-3.5 py-3 font-semibold">
          Prazo para proposta: quinta, 14/08 às 9h — faltam 3 dias.
        </div>
      </div>
    </figure>
  );
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="rounded-card border border-borda bg-cartao p-5">
      <span className="grid size-8 place-items-center rounded-full bg-acento-suave font-bold text-acento">
        {n}
      </span>
      <strong className="mt-3 block">{titulo}</strong>
      <p className="mt-1 text-suave">{children}</p>
    </li>
  );
}
