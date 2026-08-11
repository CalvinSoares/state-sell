import { Button, Container, Input } from "@/src/shared/components/ui";

/** Entrada do backoffice. Pública (o middleware libera só esta rota). */
export default function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  return (
    <main className="py-24">
      <Container size="sm">
        <h1 className="text-xl font-extrabold tracking-tight">Backoffice</h1>
        <p className="mt-2 text-suave">Acesso restrito.</p>
        <form method="post" action="/admin/api/entrar" className="mt-4 flex flex-col gap-3">
          <Input type="email" name="email" required placeholder="seu e-mail" autoComplete="email" />
          <Input
            type="password"
            name="senha"
            required
            placeholder="senha"
            autoComplete="current-password"
          />
          <Button type="submit">Entrar</Button>
        </form>
        <ErroEntrada searchParams={searchParams} />
      </Container>
    </main>
  );
}

async function ErroEntrada({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  if (!erro) return null;
  return <p className="mt-4 text-erro">Não foi possível entrar. Verifique o e-mail.</p>;
}
