"use client";

import { useEffect, useState } from "react";

type Tema = "light" | "dark";

/** Alterna claro/escuro e persiste em localStorage. Respeita o SO até o usuário escolher. */
export function ThemeToggle() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    const salvo = document.documentElement.dataset.theme as Tema | undefined;
    if (salvo === "light" || salvo === "dark") {
      setTema(salvo);
      return;
    }
    const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTema(prefereEscuro ? "dark" : "light");
  }, []);

  function alternar() {
    const novo: Tema = tema === "dark" ? "light" : "dark";
    setTema(novo);
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem("tema", novo);
    } catch {
      // localStorage indisponível (modo privado) — o tema vale só nesta sessão.
    }
  }

  const escuro = tema === "dark";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 50,
        width: 40,
        height: 40,
        borderRadius: 999,
        border: "1px solid var(--borda)",
        background: "var(--cartao)",
        color: "var(--tinta)",
        cursor: "pointer",
        fontSize: "1.1rem",
        lineHeight: 1,
      }}
    >
      {tema === null ? "" : escuro ? "☀️" : "🌙"}
    </button>
  );
}
