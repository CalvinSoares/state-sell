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
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".4rem",
        fontSize: ".9rem",
        color: "var(--suave)",
        marginBottom: "1.25rem",
      }}
    >
      <Link href="/admin" style={{ color: "var(--acento)", textDecoration: "none" }}>
        ← Bancada
      </Link>
      {paiHref && paiRotulo ? (
        <>
          <span>/</span>
          <Link href={paiHref} style={{ color: "var(--acento)", textDecoration: "none" }}>
            {paiRotulo}
          </Link>
        </>
      ) : null}
      <span>/</span>
      <span>{atual}</span>
    </nav>
  );
}
