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
      className="fixed right-4 top-4 z-50 grid size-10 cursor-pointer place-items-center rounded-full border border-borda bg-cartao text-lg leading-none text-tinta"
    >
      {tema === null ? "" : escuro ? "☀️" : "🌙"}
    </button>
  );
}
