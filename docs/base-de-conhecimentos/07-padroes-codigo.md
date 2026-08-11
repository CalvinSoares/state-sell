# Padrões de Código

> Todo código passa por este checklist antes de virar PR.

---

## Checklist pré-PR (obrigatório)

- [ ] **Zero `console.log`** — bloqueador. Usar o logger estruturado
- [ ] **Zero import não utilizado**
- [ ] **Zero `@ts-ignore` / `@ts-expect-error`** — resolver a tipagem
- [ ] **Zero `any`** em props, retorno de função e schema
- [ ] Lógica pesada fora de componente — em `.action.ts` ou em `src/server/`
- [ ] Nenhum `fetch` para o PNCP fora de `src/server/pncp/`
- [ ] Nenhum SQL solto fora de `src/server/db/repositorios/`
- [ ] Nenhum valor de corte legal fora de `src/shared/config/limites.ts`
- [ ] Strings e configs repetidas extraídas em constantes nomeadas
- [ ] `<Button>` do shadcn/ui, nunca `<button>` nativo
- [ ] Verifiquei `src/shared/` antes de criar util, hook ou componente novo
- [ ] `useEffect` com dependências corretas e propósito justificável em uma frase
- [ ] Código morto removido
- [ ] **Se mexi em `content/ramos/` ou em `casamento/`: a suíte de métricas rodou e a precisão não caiu**

---

## Princípios

| Princípio | Regra |
|---|---|
| Legibilidade | Nomes claros, funções pequenas, fluxo óbvio |
| Pureza | Regra de negócio pura e testável; I/O na borda |
| Simplicidade | A solução mais simples que funciona. Sem over-engineering |
| Consistência | Seguir o padrão existente, mesmo discordando dele |
| Comentários | Só o "porquê". O "o quê" o código já diz |

```ts
// ✘ ERRADO
const filtrarPorRamo = (itens: Item[], ramo: string) => {
  const resultado: Item[] = [];
  for (let i = 0; i < itens.length; i++) {
    if (itens[i].ramo === ramo) resultado.push(itens[i]);
  }
  return resultado;
};

// ✔ CERTO
const filtrarPorRamo = (itens: Item[], ramo: string) =>
  itens.filter((i) => i.ramo === ramo);
```

---

## Pureza — a regra que mais importa aqui

```ts
// ✘ ERRADO — I/O e tempo dentro da regra
export async function casar(item: Item) {
  const ramos = await db.select().from(ramosTable);   // I/O
  const agora = new Date();                           // tempo
  if (item.prazo < agora) return null;                // regra de seleção misturada
  ...
}

// ✔ CERTO — regra pura, dados entram por parâmetro
export function casar(texto: TextoDoItem, ramos: Ramo[]): Casamento[] { ... }

// ✔ CERTO — tempo entra como parâmetro quando a regra precisa dele
export function temPrazoSuficiente(encerramento: Date, agora: Date): boolean { ... }
```

Regra: se a função decide algo de negócio, ela recebe tudo que precisa por parâmetro. Quem busca é o job.

---

## Nomenclatura

| Tipo | Padrão | Exemplo |
|---|---|---|
| Boolean | `e` / `tem` / `pode` / `is` / `has` | `estaAberto`, `temPrazo`, `isLoading` |
| Handler | `handle` | `handleSubmit` |
| Callback em prop | `on` | `onSuccess` |
| Query tRPC | entidade + ação | `alerta.listar`, `perfil.obter` |
| Mutation tRPC | verbo + entidade | `criarAssinante`, `atualizarPerfil` |
| Job | verbo no infinitivo | `coletar`, `casar`, `alertar`, `enviar` |
| Tabela e coluna | `snake_case` em português | `item_contratacao.valor_total_centavos` |

**Domínio em português, framework em inglês.** `contratacao.valorTotalEstimado`, não `contract.totalEstimatedValue`. Ver ADR-006.

---

## Importações

```ts
// 1. externos
import { z } from "zod";

// 2. internos compartilhados (alias @/)
import { formatarMoeda } from "@/src/shared/utils/formatador";

// 3. locais da feature (relativos)
import { CartaoAlerta } from "./_components/CartaoAlerta";
```

---

## Formulários

```ts
// Sempre react-hook-form + Zod. O schema é a regra — não duplicar validação no handler.
const CadastroSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  municipiosIbge: z.array(z.string()).min(1, "Escolha pelo menos uma cidade"),
  ramos: z.array(z.string()).min(1, "Escolha o que você vende"),
  tetoValorCentavos: z.number().int().positive(),
});
```

Mensagem de erro em português de gente: `"Digite um e-mail válido"`, nunca `"Invalid email format"`.

---

## Loading / vazio / erro

```tsx
if (isLoading) return <EsqueletoDaLista />;
if (error) return <MensagemDeErro erro={error} />;
if (!dados?.length) return <EstadoVazio />;
return <Lista dados={dados} />;
```

Os quatro caminhos, sempre. Detalhe em `frontend/estados-de-tela.md`.

---

## Testes

| O quê | Cobertura esperada |
|---|---|
| `src/server/casamento/` | **Exaustiva.** É o coração e é puro — não há desculpa |
| `src/server/alerta/selecionar.ts` e `compor.ts` | Alta. Puras |
| `src/server/pncp/schemas.ts` | Fixture de resposta real do PNCP, incluindo campos nulos |
| Repositórios | Só o que tem regra (upsert, dedupe) |
| Componente | Só o que tem lógica não trivial |

Teste ao lado do arquivo: `casar.ts` → `casar.spec.ts`.

---

## Segurança

| Regra | Detalhe |
|---|---|
| Nenhum secret no cliente | Nada além de `NEXT_PUBLIC_APP_URL` |
| Rota de cron autenticada | `Authorization: Bearer ${CRON_SECRET}`, inclusive em preview |
| Nenhum dado pessoal em log | Nunca logar e-mail, telefone ou nome do assinante — usar o id |
| Nenhum dado pessoal em query string | Magic link com token de uso único e validade curta |
| Validar no servidor | Toda regra crítica em `protectedProcedure`, nunca só no cliente |
| Sem hardcode de credencial | `.env` sempre |

---

## Antes de mexer em rota, cache ou Server Action

Este projeto usa uma versão do Next.js com breaking changes em relação ao que a maioria conhece. **Ler o guia relevante em `node_modules/next/dist/docs/` antes de escrever.** Assumir a convenção de memória gera bug silencioso, especialmente em `params`, `searchParams` e revalidação.
