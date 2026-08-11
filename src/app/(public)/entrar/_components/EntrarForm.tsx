"use client";

import { useState } from "react";
import { api } from "@/src/shared/trpc/cliente";

/** Pede o link de acesso. Resposta sempre igual — nunca revela se o e-mail existe. */
export function EntrarForm() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const { mutate, isPending } = api.cadastro.enviarLinkAcesso.useMutation({
    onSuccess: () => setEnviado(true),
  });

  if (enviado) {
    return (
      <div style={{ ...cartao, borderLeft: "3px solid var(--acento)" }}>
        <p style={{ margin: 0 }}>
          Se esse e-mail tiver cadastro, o link de acesso já está a caminho. Confira sua caixa de
          entrada.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email && !isPending) mutate({ email });
      }}
      style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}
    >
      <input
        type="email"
        placeholder="seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        style={{
          padding: ".7rem",
          borderRadius: 8,
          border: "1px solid var(--borda)",
          background: "var(--cartao)",
          color: "var(--tinta)",
          fontSize: "1rem",
        }}
      />
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: ".75rem",
          borderRadius: 8,
          border: 0,
          background: "var(--acento)",
          color: "#fff",
          fontWeight: 700,
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Enviando…" : "Mandar link de acesso"}
      </button>
    </form>
  );
}

const cartao: React.CSSProperties = {
  background: "var(--cartao)",
  border: "1px solid var(--borda)",
  borderRadius: 12,
  padding: "1rem 1.15rem",
};
