# Padrão por Página

> Estrutura obrigatória para toda feature. Mesma filosofia do Portal PAAS.

---

## Estrutura

```
(pasta-da-page)/
├── _components/
│   └── MeuComponente.tsx     # exclusivo desta página
├── utils/
│   └── exemplo.utils.ts      # funções puras, constantes, colunas
├── hook/                     # singular
│   ├── exemplo.hook.ts       # queries tRPC, estado, efeitos
│   └── exemplo.action.ts     # mutations, submit, lógica pesada
└── page.tsx                  # composição — sem lógica
```

---

## `page.tsx` — só composição

- **Sem** `useState`, `useEffect`, `useQuery` ou `useMutation`
- Pode receber `params` / `searchParams` e repassar
- Pode ter Suspense e error boundary

```tsx
// ✔ CERTO
export default function AlertasPage() {
  return (
    <PaginaTemplate
      titulo="Seus avisos"
      subtitulo="Tudo que a gente encontrou para você"
    >
      <FiltrosDeAlerta />
      <ListaDeAlertas />
    </PaginaTemplate>
  );
}
```

---

## `hook/*.hook.ts` — queries e estado

```ts
export function useListaDeAlertas() {
  const { filtros, setFiltro } = useBusca({ parser: filtrosDeAlerta });

  const { data, isLoading, error } = api.alerta.listar.useQuery(filtros);

  return { alertas: data?.itens ?? [], total: data?.total ?? 0, filtros, setFiltro, isLoading, error };
}
```

Ao mudar qualquer filtro que não seja paginação, **voltar para a página 1**.

---

## `hook/*.action.ts` — mutations

```ts
export function useFeedbackDeAlerta() {
  const utils = api.useUtils();

  const { mutate, isPending } = api.alerta.registrarFeedback.useMutation({
    onSuccess: () => {
      toast.success("Obrigado — isso ajuda a gente a acertar mais");
      utils.alerta.listar.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return { registrarNaoEraPraMim: (id: string) => mutate({ alertaId: id, util: false }), isPending };
}
```

---

## `utils/*.utils.ts` — puras

Formatações locais, constantes da feature, definição de colunas. Nada de I/O.

---

## Regras de componentização

1. Componente com menos de 300 linhas — se passar, extrair
2. Uma responsabilidade por componente
3. Props tipadas, nunca `any`
4. Sem lógica de negócio no JSX
5. Sem `console.log`

---

## Quando subir para `shared/`

| Situação | Ação |
|---|---|
| Componente usado em 2+ páginas | `src/shared/components/app/` |
| Hook usado em 2+ páginas | `src/shared/hook/` |
| Util usada em 2+ páginas | `src/shared/utils/` |
| Schema Zod reutilizado | `src/shared/schema/` |

Nada nasce em `shared/`. Sobe depois do segundo uso real.

---

## Linguagem da interface

Este é o requisito de produto mais fácil de quebrar sem perceber.

| Escreva | Nunca escreva |
|---|---|
| "Seus avisos" | "Alertas de oportunidades licitatórias" |
| "O que você vende" | "Ramo de atuação / CNAE" |
| "Até onde você atende" | "Abrangência geográfica" |
| "O maior pedido que você dá conta" | "Teto de contratação" |
| "A prefeitura quer comprar marmita" | "Dispensa eletrônica nº 127/2026" |
| "Prazo: quinta, 14/08 às 9h — faltam 3 dias" | "Encerramento: 14/08/2026 09:00" |

**Teste da tela:** leia em voz alta imaginando a Dona Cleide ouvindo. Se ela pararia para perguntar o que uma palavra quer dizer, a tela está errada.

---

## Anti-padrões

```tsx
// ✘ mutation dentro do componente
export function BotaoFeedback() {
  const { mutate } = api.alerta.registrarFeedback.useMutation();  // ERRADO
}

// ✘ lógica no page.tsx
export default function Page() {
  const [aberto, setAberto] = useState(false);        // ERRADO
  const { data } = api.alerta.listar.useQuery();      // ERRADO
}

// ✘ button nativo
<button onClick={handle}>Enviar</button>              // ERRADO — usar <Button>

// ✘ jargão vazando na interface
<span>Modalidade: Dispensa (8)</span>                 // ERRADO
```
