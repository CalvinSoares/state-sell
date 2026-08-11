import Link from "next/link";

type Props = {
  /** rótulo da página atual (o último "nível") */
  atual: string;
  /** volta para uma página intermediária antes da Bancada, se houver */
  paiHref?: string;
  paiRotulo?: string;
};

/** Navegação do backoffice: "voltar" para a Bancada (e um nível intermediário). */
export function AdminNav({ atual, paiHref, paiRotulo }: Props) {
  return (
    <nav className="mb-5 flex items-center gap-1.5 text-sm text-suave">
      <Link href="/admin" className="text-acento no-underline">
        ← Bancada
      </Link>
      {paiHref && paiRotulo ? (
        <>
          <span>/</span>
          <Link href={paiHref} className="text-acento no-underline">
            {paiRotulo}
          </Link>
        </>
      ) : null}
      <span>/</span>
      <span>{atual}</span>
    </nav>
  );
}
