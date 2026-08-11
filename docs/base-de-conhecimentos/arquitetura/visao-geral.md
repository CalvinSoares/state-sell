# Visão Geral da Arquitetura

> Um app Next.js na Vercel. Um repositório, um deploy, um pipeline.
> Decisões formais em `decisoes-adr.md`. Árvore de pastas em `estrutura-pastas.md`.

---

## Camadas

```
┌──────────────────────────── Vercel — um projeto Next.js ────────────────────────────┐
│                                                                                     │
│  APRESENTAÇÃO                                                                       │
│   app/(public)/          landing, cadastro, trilha, política                        │
│   app/(private)/         painel do assinante: histórico, perfil, certidões          │
│                                                                                     │
│  BFF                                                                                │
│   app/api/trpc/[trpc]/   endpoint único tRPC — cadastro, perfil, feedback           │
│   app/api/cron/*         gatilhos agendados, protegidos por CRON_SECRET             │
│   app/api/webhook/*      eventos do Resend (bounce, complaint)                      │
│                                                                                     │
│  DOMÍNIO (server-only, sem React)                                                   │
│   src/server/pncp/       cliente HTTP + schemas Zod da resposta                     │
│   src/server/coleta/     orquestração do job, cursor, lotes                         │
│   src/server/casamento/  ⭐ funções puras — o coração testável                       │
│   src/server/alerta/     seleção, deduplicação, composição, envio                   │
│   src/server/db/         schema Drizzle + repositórios                              │
│                                                                                     │
│  CONTEÚDO                                                                           │
│   content/ramos/         catálogo de ramos em TypeScript, versionado                │
└─────────────────────────────────────────────────────────────────────────────────────┘
        │                        │                        │                  │
        ▼                        ▼                        ▼                  ▼
  Neon Postgres           API pública PNCP            Resend          Vercel Blob (Fase 3)
```

**Regra de acesso:** a página nunca chama o PNCP nem o banco diretamente. Sempre via tRPC. O job nunca importa componente React. `src/server/` é `server-only`.

---

## Fluxo ponta a ponta

```
  Vercel Cron
      │  (diário no v1; a cada 3–6h quando houver plano Pro)
      ▼
  /api/cron/coletar ──► para cada (uf, modalidade) com cursor pendente:
      │                    1. GET /contratacoes/proposta  (páginas de 50)
      │                    2. Zod valida → upsert contratacao (bruto preservado)
      │                    3. para cada contratação nova: GET .../itens  (concorrência 5)
      │                    4. upsert item_contratacao
      │                    5. salva cursor e retorna antes de 300s
      ▼
  /api/cron/casar ─────► itens sem classificação para a versão atual do catálogo:
      │                    casar(texto, ramos) → classificacao_item
      ▼
  /api/cron/alertar ───► para cada assinante ativo:
      │                    contratações com classificação em ramo do perfil
      │                    ∧ município no perfil
      │                    ∧ valor ≤ teto
      │                    ∧ prazo restante ≥ 24h
      │                    ∧ ainda sem alerta (UNIQUE assinante+contratacao)
      │                    → cria alerta pendente
      ▼
  /api/cron/enviar ────► envia pendentes via Resend, grava resend_id
      ▼
  E-mail no celular da Dona Cleide
```

**Por que quatro endpoints e não um:** cada etapa tem tempo, taxa de falha e frequência próprios. Separar permite reprocessar o casamento sem recoletar, reenviar sem reclassificar, e falhar em uma etapa sem perder as outras. Cada uma é idempotente.

---

## Ambientes

| Ambiente | Banco | E-mail | Cron |
|---|---|---|---|
| Local | Neon branch de dev ou Postgres em Docker | Resend em modo teste ou Mailpit | Rota chamada à mão com `CRON_SECRET` local |
| Preview (PR) | Neon branch efêmero | Modo teste — **nunca envia para endereço real** | Desligado |
| Produção | Neon principal | Resend com domínio verificado | Ativo |

**Trava de segurança:** o envio real só ocorre se `NODE_ENV === "production"` **e** `RESEND_MODE === "live"`. Em qualquer outro caso, o envio grava o e-mail renderizado no log estruturado e marca o alerta como enviado-simulado. Mandar e-mail de teste para assinante real é o erro mais caro possível neste produto.

---

## Segredos

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Neon |
| `RESEND_API_KEY` | Envio |
| `RESEND_MODE` | `live` \| `dry` |
| `CRON_SECRET` | Header `Authorization: Bearer` nas rotas de cron |
| `AUTH_SECRET` | Assinatura do magic link |
| `APP_URL` | Montagem de links absolutos no e-mail |

Nenhum secret no cliente. Nenhuma variável `NEXT_PUBLIC_*` além de `APP_URL`.

---

## Observabilidade mínima do v1

Não é Datadog. É o suficiente para saber se o produto está vivo:

| Sinal | Onde |
|---|---|
| Última coleta bem-sucedida, por `(uf, modalidade)` | Tabela `execucao_coleta` + página `/status` pública |
| Contratações novas por execução | `execucao_coleta.novas` |
| Alertas criados vs enviados vs falhados | Query no painel interno |
| Taxa de feedback negativo por ramo | `feedback_alerta` — dispara revisão do catálogo |
| Bounce e reclamação | Webhook do Resend → suprime o assinante automaticamente |

**Alarme que importa:** nenhuma coleta bem-sucedida em 36h. Sem coleta não há produto, e o silêncio parece funcionamento normal — é a falha mais perigosa deste sistema.

---

## O que este projeto deliberadamente não tem

| Não tem | Por quê |
|---|---|
| Microserviços | Um job e quatro tabelas. Não há o que distribuir |
| Fila distribuída | O cursor no Postgres é a fila. Reavaliar acima de ~10 mil assinantes |
| Multi-tenant | O usuário é pessoa física com um CNPJ |
| API pública | Ninguém pediu |
| Cache layer | O dado muda uma vez por dia |
| Embedding / LLM no casamento | Ver ADR-004 |
