# Estrutura de Pastas

> Mesma filosofia do Portal PAAS: separar apresentação, BFF e domínio; página não tem lógica; nada nasce em `shared/` sem ter sido usado duas vezes.

---

## Árvore

```
state-sell/
├── PLANEJAMENTO.md
├── docs/base-de-conhecimentos/        # esta documentação
│
├── content/
│   └── ramos/                         # ⭐ o catálogo — conteúdo, não código de infra
│       ├── index.ts                   # registro tipado de todos os ramos
│       ├── alimentacao.ts
│       ├── informatica.ts
│       ├── grafica.ts
│       ├── limpeza.ts
│       └── manutencao-predial.ts
│
├── fixtures/
│   └── rotulados/                     # ⭐ conjunto rotulado — GERADO por `pnpm rotulos:sync`
│       ├── alimentacao.json           #    a partir da tabela rotulo_manual (backoffice)
│       └── negativos.json             #    editar à mão aqui é errado — rotula-se em /admin/rotular
│
├── scripts/
│   └── rotulos-sync.ts                # banco → fixtures/rotulados/ (ver ADR-007)
│
└── src/
    ├── app/
    │   ├── (public)/
    │   │   ├── page.tsx               # landing
    │   │   ├── cadastro/              # as 3 perguntas
    │   │   ├── trilha/                # "primeira licitação" (Fase 3)
    │   │   └── status/                # página pública de saúde da coleta
    │   ├── (private)/
    │   │   ├── alertas/               # histórico
    │   │   ├── perfil/                # ramos, municípios, teto
    │   │   └── certidoes/             # cofre (Fase 3)
    │   ├── admin/                     # backoffice — allowlist de e-mail, 404 para os demais
    │   │   ├── rotular/               # ⭐ tela de rotulagem (Fase 1)
    │   │   ├── jobs/                  # execuções, cursores, rodar manual (Fase 1)
    │   │   ├── assinantes/            # lista, perfil, simulação
    │   │   ├── alertas/               # enviados e feedback (Fase 2)
    │   │   ├── ramos/                 # métricas por ramo, somente leitura (Fase 2)
    │   │   └── contratacoes/          # busca livre para diagnóstico (Fase 2)
    │   ├── api/
    │   │   ├── trpc/[trpc]/route.ts   # endpoint único do BFF
    │   │   ├── cron/
    │   │   │   ├── coletar/route.ts
    │   │   │   ├── casar/route.ts
    │   │   │   ├── alertar/route.ts
    │   │   │   ├── enviar/route.ts
    │   │   │   └── resumo-semanal/route.ts
    │   │   └── webhook/resend/route.ts
    │   └── layout.tsx
    │
    ├── server/                        # server-only — nunca importado pelo cliente
    │   ├── trpc/
    │   │   ├── trpc.ts                # initTRPC, publicProcedure, protectedProcedure
    │   │   ├── context.ts
    │   │   └── routers/
    │   │       ├── index.ts           # appRouter
    │   │       ├── input/             # schemas Zod de entrada
    │   │       ├── output/            # tipos de saída
    │   │       ├── assinante.router.ts
    │   │       ├── perfil.router.ts
    │   │       └── alerta.router.ts
    │   ├── pncp/
    │   │   ├── cliente.ts             # fetch com retry, backoff, timeout
    │   │   ├── schemas.ts             # Zod da resposta do PNCP
    │   │   └── mapeadores.ts          # resposta PNCP → modelo interno
    │   ├── coleta/
    │   │   ├── coletar.job.ts         # orquestração com cursor e orçamento de tempo
    │   │   └── cursor.ts
    │   ├── casamento/                 # ⭐ FUNÇÕES PURAS — sem I/O, sem Date, sem random
    │   │   ├── normalizar.ts
    │   │   ├── casar.ts
    │   │   ├── casar.spec.ts
    │   │   └── metricas.spec.ts       # gate de precisão contra fixtures/rotulados
    │   ├── alerta/
    │   │   ├── selecionar.ts          # quem recebe o quê — puro
    │   │   ├── compor.ts              # dados → conteúdo do e-mail — puro
    │   │   ├── enviar.action.ts       # I/O: Resend
    │   │   └── emails/                # templates React Email
    │   └── db/
    │       ├── index.ts               # conexão com pool
    │       ├── schema/                # Drizzle: um arquivo por tabela
    │       ├── migrations/
    │       └── repositorios/          # queries nomeadas, nunca SQL solto na rota
    │
    └── shared/
        ├── components/
        │   ├── ui/                    # shadcn/ui
        │   └── app/                   # componentes do produto reutilizados
        ├── config/
        │   └── limites.ts             # ⚠️ ÚNICA fonte dos valores de corte ME/EPP
        ├── constants/
        ├── hook/
        ├── lib/
        ├── schema/                    # Zod compartilhado cliente/servidor
        ├── types/
        └── utils/
            ├── data.ts                # prazo restante, dia da semana em português
            └── formatador.ts          # moeda, quantidade, unidade
```

---

## Estrutura padrão por página (obrigatória)

```
(pasta-da-page)/
├── _components/          # componentes exclusivos desta página
├── utils/
│   └── exemplo.utils.ts  # funções puras, constantes, colunas de tabela
├── hook/                 # singular
│   ├── exemplo.hook.ts   # queries tRPC, estado, efeitos
│   └── exemplo.action.ts # mutations, submit, lógica pesada
└── page.tsx              # composição — sem lógica
```

| Camada | Responsabilidade |
|---|---|
| `page.tsx` | Só orquestra componentes. Sem `useState`, sem `useEffect`, sem chamada tRPC direta |
| `_components/` | Só faz sentido nesta página. Se for reutilizado, sobe para `shared/components/app/` |
| `hook/*.hook.ts` | `useQuery` e estado derivado |
| `hook/*.action.ts` | `useMutation`, handlers de submit, invalidação de cache, toast |
| `utils/*.utils.ts` | Funções puras e constantes locais |

---

## Regra de localização

| O que criar | Onde |
|---|---|
| Página / rota | `src/app/(public)/` ou `src/app/(private)/` |
| Regra de casamento | `src/server/casamento/` — **sempre pura e sempre com teste** |
| Termos de um ramo | `content/ramos/<slug>.ts` |
| Descrição rotulada para teste | **`/admin/rotular`** — nunca editando `fixtures/` à mão |
| Tela do backoffice | `src/app/admin/` — mesmo padrão de página do resto |
| Chamada ao PNCP | `src/server/pncp/` — em nenhum outro lugar |
| Query ao banco | `src/server/db/repositorios/` |
| Router tRPC | `src/server/trpc/routers/` |
| Template de e-mail | `src/server/alerta/emails/` |
| Componente reutilizado 2+ vezes | `src/shared/components/app/` |
| Valor de corte legal | `src/shared/config/limites.ts` — **e em nenhum outro lugar** |

---

## Convenções de nome

| Tipo | Padrão |
|---|---|
| Componente React | `PascalCase.tsx` |
| Hook de dados | `nome.hook.ts` |
| Ação / mutation | `nome.action.ts` |
| Job agendado | `nome.job.ts` |
| Router tRPC | `nome.router.ts` |
| Schema Zod | `nome.schema.ts` |
| Teste | `nome.spec.ts`, ao lado do arquivo testado |
| Util | `kebab-case.ts` |
| Tabela e coluna do banco | `snake_case` em português |

---

## Antes de escrever a primeira linha

Este projeto usa uma versão do Next.js com breaking changes em relação ao que a maioria conhece. **Ler `node_modules/next/dist/docs/` do guia relevante antes de codar rota, cache, `params` ou Server Action.** A convenção mudou mais de uma vez; assumir de memória gera bug silencioso.
