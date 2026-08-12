import { Badge, Card } from "@/src/shared/components/ui";

export type ItemSimulacao = {
  titulo: string;
  item: string;
  valor: string | null;
  prazo: string | null;
  exclusivo: boolean;
};

type Props = {
  dias: number;
  total: number;
  itens: ItemSimulacao[];
  /** "assinante" = 1ª pessoa; "admin" = visão de fora */
  contexto?: "assinante" | "admin";
};

/** Bloco "com o perfil de hoje, nos últimos N dias você teria recebido…". */
export function SimulacaoBloco({ dias, total, itens, contexto = "assinante" }: Props) {
  const ehAdmin = contexto === "admin";
  const titulo = ehAdmin
    ? `Com o perfil de hoje, nos últimos ${dias} dias teria recebido`
    : `Com o seu perfil de hoje, nos últimos ${dias} dias você teria recebido`;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold tracking-tight">{titulo}</h2>
      <p className="mt-1 text-sm text-suave">
        {ehAdmin
          ? "Simulação — não são avisos enviados de verdade."
          : "Isso é uma simulação com o perfil atual. Não muda o histórico de avisos."}
      </p>

      {total === 0 ? (
        <Card className="mt-4">
          <p className="m-0 font-semibold">Nada nesse período</p>
          <p className="mt-1.5 text-suave">
            {ehAdmin
              ? "Nenhuma compra coletada casou com este perfil na janela."
              : "Nas últimas semanas não apareceu compra que batesse com o que você vende na sua região. Acontece. Por isso existe o resumo de sábado."}
          </p>
        </Card>
      ) : (
        <>
          <p className="mt-3 text-sm text-suave">
            <strong className="text-tinta">{total}</strong>{" "}
            {total === 1 ? "aviso" : "avisos"}
            {itens.length < total ? ` · mostrando ${itens.length}` : ""}
          </p>
          <ul className="mt-3 grid list-none gap-3 p-0">
            {itens.map((o, i) => (
              <li key={i}>
                <Card className="border-l-4 border-l-acento">
                  <strong>{o.titulo}.</strong>
                  <p className="mt-1.5 text-suave">{o.item}</p>
                  {o.valor ? <p className="mt-0.5 text-suave">{o.valor}.</p> : null}
                  {o.exclusivo ? (
                    <p className="mt-1">
                      <Badge tom="acento">Exclusivo para micro e pequena empresa</Badge>
                    </p>
                  ) : null}
                  {o.prazo ? <p className="mt-1.5 font-semibold">Prazo: {o.prazo}</p> : null}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
