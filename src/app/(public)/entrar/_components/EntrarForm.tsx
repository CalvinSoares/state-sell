"use client";

import { useState } from "react";
import { api } from "@/src/shared/trpc/cliente";
import { Button, Card, Input } from "@/src/shared/components/ui";

/** Pede o link de acesso. Resposta sempre igual — nunca revela se o e-mail existe. */
export function EntrarForm() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const { mutate, isPending } = api.cadastro.enviarLinkAcesso.useMutation({
    onSuccess: () => setEnviado(true),
  });

  if (enviado) {
    return (
      <Card className="border-l-4 border-l-acento">
        <p className="m-0">
          Se esse e-mail tiver cadastro, o link de acesso já está a caminho. Confira sua caixa de
          entrada.
        </p>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email && !isPending) mutate({ email });
      }}
      className="flex flex-col gap-3"
    >
      <Input
        type="email"
        placeholder="seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enviando…" : "Mandar link de acesso"}
      </Button>
    </form>
  );
}
