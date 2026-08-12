import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/src/shared/components/ui";
import { SITE, urlAbsoluta } from "@/src/shared/config/site";

export const metadata: Metadata = {
  title: "Privacidade",
  description:
    "Como o Prefeitura Quer trata seus dados: o que guardamos, para quê, com quem e como você para de receber ou pede exclusão.",
  alternates: { canonical: "/privacidade" },
  openGraph: {
    title: "Privacidade",
    description:
      "Como o Prefeitura Quer trata seus dados: o que guardamos, para quê, com quem e como você para de receber ou pede exclusão.",
    url: "/privacidade",
  },
};

/**
 * Política de privacidade / LGPD — texto em português claro.
 * Reflete o que o código faz hoje (cadastro, e-mail, descadastro, terceiros).
 */
export default function PrivacidadePage() {
  return (
    <main className="pb-16 pt-10">
      <Container size="md">
        <p className="m-0 font-semibold text-acento">
          <Link href="/" className="text-acento no-underline">
            {SITE.nome}
          </Link>
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Privacidade</h1>
        <p className="mt-2 text-suave">
          Última atualização: {SITE.privacidadeAtualizadaEm}. Em português, sem juridiquês
          desnecessário — mas com o que a lei brasileira (LGPD) pede que a gente diga.
        </p>

        <div className="mt-10 space-y-9 text-[1.05rem] leading-relaxed text-tinta">
          <Secao titulo="Em uma frase">
            <p>
              A gente guarda o mínimo para te avisar quando a prefeitura quer comprar o que você
              vende — e você pode parar a qualquer momento.
            </p>
          </Secao>

          <Secao titulo="Quem é responsável pelos seus dados">
            <p>
              O serviço <strong>{SITE.nome}</strong> é quem decide por que e como seus dados são
              usados (na lei isso se chama <em>controlador</em>).
            </p>
            <p>
              Contato para assuntos de privacidade:{" "}
              <a href={`mailto:${SITE.emailContato}`}>{SITE.emailContato}</a>.
            </p>
            <p className="text-suave">
              Somos um serviço independente. Não temos vínculo com prefeitura, governo ou órgão
              público — só lemos anúncios oficiais que já são públicos.
            </p>
          </Secao>

          <Secao titulo="Que dados a gente coleta">
            <p>No cadastro, você nos passa:</p>
            <ul>
              <li>
                <strong>E-mail</strong> — para enviar os avisos e o link de acesso (sem senha)
              </li>
              <li>
                <strong>Onde você atende</strong> — estado e, se quiser, a cidade (código IBGE)
              </li>
              <li>
                <strong>O que você vende</strong> — o ramo que você escolheu
              </li>
              <li>
                <strong>O maior pedido que você dá conta</strong> — uma faixa de valor, para não te
                avisar de coisa grande demais
              </li>
            </ul>
            <p>Também podem existir, conforme o uso do serviço:</p>
            <ul>
              <li>Histórico dos avisos que enviamos e se você clicou em “não era pra mim”</li>
              <li>
                Se você usar o cofre: tipo de certidão, a <strong>data de vencimento</strong> que
                você informou (para lembretes) e, se enviar, o <strong>PDF</strong> do documento
                (arquivo privado — só você baixa quando estiver logado)
              </li>
              <li>Registros técnicos de entrega de e-mail (envio ok, bounce, reclamação de spam)</li>
              <li>
                Cookie de sessão quando você entra no painel (só para manter você logado)
              </li>
              <li>
                Preferência de tema claro/escuro no seu aparelho (fica só no navegador, não no nosso
                banco)
              </li>
              <li>
                Dados mínimos de proteção contra abuso (por exemplo, quantos e-mails pedimos por
                hora a partir do mesmo lugar)
              </li>
            </ul>
            <p>
              <strong>Não pedimos CNPJ, cartão nem telefone</strong> para te avisar. O cofre de
              certidões é opcional: você pode guardar a data e o PDF; a gente não lê o conteúdo do
              arquivo automaticamente.
            </p>
          </Secao>

          <Secao titulo="Para que usamos">
            <ul>
              <li>Enviar avisos de compras públicas que batem com o seu perfil</li>
              <li>Mandar o resumo semanal (para você saber que o serviço está de olho)</li>
              <li>Deixar você entrar no painel pelo link do e-mail</li>
              <li>Melhorar o acerto dos avisos com o feedback “não era pra mim”</li>
              <li>
                Lembrar, se você pediu, que a data de uma certidão que você informou está perto
                (15 dias e 3 dias antes)
              </li>
              <li>Parar de enviar se o e-mail voltar (bounce) ou se houver reclamação de spam</li>
              <li>Proteger o serviço contra abuso e fraude</li>
            </ul>
            <p>
              Base legal principal: o seu <strong>consentimento</strong> ao se cadastrar e pedir
              para ser avisado — e a execução desse serviço que você pediu. Você pode retirar o
              consentimento a qualquer momento (veja abaixo).
            </p>
          </Secao>

          <Secao titulo="Com quem compartilhamos">
            <p>
              Não vendemos sua lista. Só usamos empresas que precisam rodar o serviço, sob contrato
              e com o mínimo necessário:
            </p>
            <ul>
              <li>
                <strong>Resend</strong> — envio dos e-mails
              </li>
              <li>
                <strong>Neon</strong> — banco de dados
              </li>
              <li>
                <strong>Vercel</strong> — hospedagem do site
              </li>
            </ul>
            <p>
              Parte dessa infraestrutura fica fora do Brasil. Quando isso acontece, seguimos as
              regras da LGPD sobre transferência internacional (contrato com o fornecedor e
              salvaguardas adequadas).
            </p>
            <p>
              Anúncios de compras que a gente lê vêm de fontes públicas (como o PNCP). Isso não é
              “seu” dado — é informação oficial já aberta.
            </p>
          </Secao>

          <Secao titulo="Por quanto tempo guardamos">
            <ul>
              <li>
                Enquanto sua conta estiver ativa e você quiser receber avisos, mantemos o perfil
                necessário para o serviço funcionar
              </li>
              <li>
                Se você pedir para parar de receber, marcamos o e-mail como <em>suprimido</em>:
                paramos de enviar e não reativamos sozinhos
              </li>
              <li>
                Se você pedir a exclusão completa dos seus dados, apagamos o que for possível e
                legal — respondemos pelo e-mail de contato
              </li>
              <li>
                Podemos guardar o mínimo por um tempo curto se a lei ou a segurança do serviço
                exigirem (por exemplo, prova de que paramos de enviar após uma reclamação)
              </li>
            </ul>
          </Secao>

          <Secao titulo="Como parar de receber ou exercer seus direitos">
            <p>Você pode, a qualquer momento:</p>
            <ul>
              <li>
                <strong>Parar os avisos</strong> — pelo link “Parar de receber” em todo e-mail, ou
                pelo botão de descadastro do seu cliente de e-mail (List-Unsubscribe)
              </li>
              <li>
                <strong>Ver o que te enviamos</strong> — entrando no{" "}
                <Link href="/entrar">painel</Link>
              </li>
              <li>
                <strong>Corrigir ou atualizar o perfil</strong> — pelo painel, quando a edição
                estiver disponível, ou pedindo pelo e-mail de contato
              </li>
              <li>
                <strong>Pedir acesso, portabilidade ou exclusão</strong> — escreva para{" "}
                <a href={`mailto:${SITE.emailContato}`}>{SITE.emailContato}</a> com o e-mail da
                conta. Respondemos em até 15 dias
              </li>
              <li>
                <strong>Reclamar à ANPD</strong> — a Autoridade Nacional de Proteção de Dados, se
                achar que algo está errado
              </li>
            </ul>
            <p className="text-suave">
              O descadastro pelo link do e-mail para o envio na hora. A exclusão completa do cadastro
              (apagar o registro) é feita sob pedido, para não misturar com um clique acidental.
            </p>
          </Secao>

          <Secao titulo="Segurança">
            <p>
              Usamos acesso restrito ao banco, links de entrada assinados (sem senha guardada aqui) e
              envio de e-mail por provedor profissional. Nenhum sistema é à prova de tudo — se
              soubermos de incidente que te afete, avisamos como a lei manda.
            </p>
          </Secao>

          <Secao titulo="Crianças e adolescentes">
            <p>
              O serviço é feito para quem tem negócio e quer vender para a prefeitura. Não é
              direcionado a menores de 18 anos.
            </p>
          </Secao>

          <Secao titulo="Mudanças nesta página">
            <p>
              Se mudarmos o que coletamos ou para quê, atualizamos esta página e a data no topo.
              Versão atual:{" "}
              <a href={urlAbsoluta("/privacidade")}>{urlAbsoluta("/privacidade")}</a>.
            </p>
          </Secao>
        </div>

        <p className="mt-12 text-sm text-suave">
          <Link href="/">← Voltar ao início</Link>
          {" · "}
          <Link href="/cadastro">Quero ser avisado</Link>
        </p>
      </Container>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold tracking-tight">{titulo}</h2>
      <div className="space-y-3 [&_a]:text-acento [&_li]:mt-1.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
