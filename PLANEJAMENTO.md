# Planejamento — StateSell

> Avisa o pequeno negócio quando a prefeitura dele quer comprar exatamente o que ele vende.

**Status:** Fase 1 implementada (núcleo ponta a ponta) — falta ligar em banco real e verificar em produção. Fase 0 parcial (ver `docs/base-de-conhecimentos/dados/verificacao-de-viabilidade.md`).
**Última atualização:** 11/08/2026

---

## 1. Objetivo

Transformar o dado público de compras governamentais — hoje tecnicamente aberto e praticamente inacessível — em **um e-mail decidível em trinta segundos** para quem tem negócio de uma pessoa só.

**A promessa é achar oportunidade, não ganhar contrato.** A frase que se sustenta é: *"você vai saber; disputar é com você."*

---

## 2. Precisa de backend? Sim — mas é pequeno

O produto tem quatro responsabilidades de servidor, e nenhuma delas exige um backend separado:

| Responsabilidade | Por que precisa de servidor |
|---|---|
| Coleta agendada do PNCP | Roda sem usuário presente, algumas vezes por dia |
| Persistência | Assinantes, contratações coletadas, alertas já enviados (deduplicação) |
| Casamento ramo × item | Código puro, mas roda no job de coleta |
| Envio de e-mail | Precisa de secret (Resend API key) — nunca no cliente |

O que **não** existe: API pública para terceiros, multi-tenant, ledger, fila distribuída, microserviços. Não construir infraestrutura para problema que ainda não temos.

---

## 3. Dá para subir tudo junto na Vercel? Sim — e é a recomendação

**Stack: um único app Next.js (App Router) na Vercel.** Um repositório, um deploy, um pipeline.

```
┌──────────────────────── Vercel (um projeto Next.js) ────────────────────────┐
│                                                                             │
│  app/(public)/        landing + cadastro (RSC, estático quando possível)     │
│  app/(private)/       painel do assinante (histórico, perfil, certidões)     │
│  app/admin/           backoffice: rotulagem, assinantes, jobs, diagnóstico   │
│  app/api/trpc/        BFF tipado (tRPC) — cadastro, perfil, feedback         │
│  app/api/cron/*       endpoints acionados por Vercel Cron                    │
│                                                                             │
│  src/server/          jobs, repositórios, casamento, envio                   │
│  content/ramos/       catálogo de ramos em TypeScript (o coração do produto) │
└─────────────────────────────────────────────────────────────────────────────┘
             │                          │                        │
             ▼                          ▼                        ▼
      Neon Postgres            API pública PNCP              Resend
      (free tier)              (sem autenticação)            (e-mail)
```

### Por que isso funciona (números verificados hoje)

| Restrição da Vercel | Valor real | Impacto |
|---|---|---|
| Cron no plano Hobby | **1× por dia**, precisão ±59 min | Aceitável no MVP — ver abaixo |
| Cron no plano Pro | 1× por minuto, precisão por minuto | US$20/mês quando houver receita |
| Duração máxima de função (Hobby) | **300s**, com Fluid Compute | Suficiente para coleta em lotes |
| Duração máxima (Pro) | 800s (1800s em beta) | Folga grande |

**A decisão depende da janela de prazo, e ela foi medida:** em amostra de 300 dispensas eletrônicas abertas em SP, a mediana entre publicação no PNCP e encerramento do prazo de proposta é de **6 dias corridos** (p25 = 5 dias, mínimo observado = 4 dias). O pressuposto inicial de "mediana de 3 dias" estava pessimista.

Consequência: **coleta diária já entrega o produto**. Coleta a cada 3–6 horas é conforto, não requisito. Isso derruba a necessidade de Cloudflare Worker no v1 e permite começar inteiramente no free tier da Vercel.

### Escape hatch, se a frequência virar problema

Se em algum momento for preciso rodar de hora em hora antes de justificar o plano Pro, o gatilho externo é trivial e **não move a lógica de lugar**:

- **Upstash QStash** (free tier ~500 mensagens/dia) ou um Cloudflare Worker de 10 linhas fazendo `fetch()` no endpoint `/api/cron/coletar` da Vercel, com header de segredo.
- A lógica continua 100% no repositório Next. O gatilho é descartável.

### O que foi descartado, e por quê

| Alternativa | Por que não |
|---|---|
| Cloudflare Workers + D1 para tudo | Dois deploys, dois modelos mentais, dois lugares para debugar. Ganho real (frequência de cron) não se justifica com janela mediana de 6 dias. |
| Backend separado (Nest/Fastify) | Nada aqui justifica um segundo runtime. Duplicaria tipos e deploy. |
| Cloudflare D1 (SQLite) | Postgres dá `unaccent` + índices de texto para a triagem de candidatos, e adaptadores maduros. D1 economiza nada que importe aqui. |
| Supabase para tudo (auth + db + storage) | Viável. Neon foi escolhido por integração nativa com Vercel; storage entra só na Fase 3 (R2 ou Vercel Blob). Decisão reversível. |

Registro formal em `docs/base-de-conhecimentos/arquitetura/decisoes-adr.md`.

---

## 4. Stack definitiva do v1

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Next.js (App Router) | Ler `node_modules/next/dist/docs/` antes de codar — a versão instalada tem breaking changes |
| Hospedagem | Vercel | Hobby no v1, Pro quando houver receita |
| Banco | Neon Postgres | Free tier; `unaccent` habilitado |
| ORM | Drizzle | Migrations versionadas no repo, tipos derivados do schema |
| BFF | tRPC | Mesmo padrão do Portal PAAS — nunca acoplar page a serviço externo |
| Validação | Zod | Fronteira de entrada **e** parsing da resposta do PNCP |
| Agendamento | Vercel Cron (`vercel.json`) | Endpoints protegidos por `CRON_SECRET` |
| E-mail | Resend + React Email | Domínio próprio com SPF/DKIM/DMARC desde o dia 1 |
| Auth | Magic link por e-mail | Sem senha. O e-mail já é a identidade do produto |
| UI | Tailwind + shadcn/ui | `<Button>` do shadcn, nunca `<button>` nativo |
| Testes | Vitest | Casamento é a suíte que trava o CI |
| Pagamento (Fase 4) | Asaas ou Stripe | Público é MEI brasileiro — avaliar Pix recorrente |

---

## 5. Modelo de dados (v1)

Tabelas em `src/server/db/schema/`. Nomes em português — o domínio é português e traduzir só adiciona atrito.

```
assinante            id, email(unique), nome, telefone, status, plano, criado_em, verificado_em
perfil_busca         id, assinante_id, uf, municipios_ibge[], ramos[], teto_valor_centavos, ativo
                     └─ v1: exatamente um perfil por assinante

contratacao          id, numero_controle_pncp(unique), cnpj_orgao, ano, sequencial,
                     modalidade_id, objeto_compra, informacao_complementar,
                     valor_total_estimado_centavos, uf, codigo_ibge, municipio_nome,
                     orgao_razao_social, unidade_nome, data_publicacao_pncp,
                     data_abertura_proposta, data_encerramento_proposta,
                     situacao_compra_id, link_sistema_origem, bruto(jsonb), coletado_em

item_contratacao     id, contratacao_id, numero_item, descricao, material_ou_servico,
                     quantidade, unidade_medida, valor_unitario_estimado_centavos,
                     valor_total_centavos, tipo_beneficio_id, tipo_beneficio_nome, bruto(jsonb)

classificacao_item   id, item_id, ramo_slug, score, termos_casados[], versao_catalogo, criado_em

alerta               id, assinante_id, contratacao_id, ramo_slug, item_id_principal,
                     status(pendente|enviado|falhou|suprimido), motivo_supressao,
                     enviado_em, resend_id, aberto_em, clicado_em
                     └─ UNIQUE (assinante_id, contratacao_id)   ← a garantia de não duplicar

feedback_alerta      id, alerta_id, util(bool), motivo, criado_em   ← alimenta o catálogo

certidao             id, assinante_id, tipo, emitida_em, vence_em, arquivo_key,
                     lembrete_15d_em, lembrete_3d_em                (Fase 3)

execucao_coleta      id, iniciada_em, terminada_em, uf, modalidade_id, paginas_lidas,
                     novas, atualizadas, erros, status
cursor_coleta        chave(uf:modalidade), ultima_pagina, ultima_data_processada, atualizado_em

rotulo_manual        id, hash_texto(unique), descricao_item, objeto_compra,
                     ramo_esperado(nullable), origem_amostra, viu_palpite, nota,
                     rotulado_por, rotulado_em          ← alimentado por /admin/rotular
log_admin            id, admin_email, acao, entidade, entidade_id, criado_em
```

**Invariantes** (detalhe em `regras-sistemicas-ia.md`):
- `bruto` guarda a resposta original do PNCP. Nunca depender de re-consulta para reprocessar.
- `UNIQUE (assinante_id, contratacao_id)` em `alerta` é a única defesa contra alerta duplicado. Nada de checagem em memória.
- Valor monetário sempre em centavos, `bigint`. Nunca `float`.
- Data com timezone explícito. O PNCP devolve horário local sem offset — normalizar para `America/Sao_Paulo` na borda.

---

## 6. Fases

### Fase 0 — Verificação (1 tarde) — **parcialmente concluída**

| Pergunta | Resposta obtida | Status |
|---|---|---|
| Cidade pequena publica? | 101 municípios distintos em amostra de 300 dispensas SP, incluindo Trabiju (~1.600 hab) | ✅ verificado |
| A descrição do item é legível? | Sim — português corrido ou padrão CATMAT com atributos | ✅ verificado |
| Qual a janela real de prazo? | Mediana 6 dias corridos; 73% ≤ 7 dias; 0% ≤ 3 dias | ✅ verificado |
| Exclusividade ME/EPP é inferida ou é dado? | **É dado**: `tipoBeneficio` no item. 42% dos itens amostrados são "Participação exclusiva para ME/EPP" | ✅ verificado |
| Contratos e limites da API | Endpoints e paginação confirmados por chamada real; rate limit não documentado | ⚠️ rate limit a observar em produção |

Falta fechar: a rotulagem inicial — que passa a ser feita em `/admin/rotular` depois do passo 4 da Fase 1, não em planilha (ADR-007).

### Fase 1 — Núcleo (o produto inteiro é isto)

1. Scaffold Next + Drizzle + Neon + migrations
2. Cliente PNCP com Zod na fronteira, retry e paginação (`src/server/pncp/`)
3. Job de coleta com cursor e lotes (`app/api/cron/coletar`)
4. **Backoffice mínimo** — `/admin/rotular`, `/admin/jobs`, `/admin/assinantes`
5. Rotulagem dos 5 ramos iniciais pela tela + `pnpm rotulos:sync`
6. Catálogo de **5 ramos** com maior volume: alimentação, informática, gráfica, limpeza/higiene, manutenção predial
7. Motor de casamento — funções puras, sem data e sem aleatoriedade dentro
8. **Suíte do conjunto rotulado com gate de precisão no CI** — o ativo mais valioso do projeto
9. Landing + cadastro em 3 perguntas (sem jargão)
10. Template de e-mail + envio + deduplicação
11. Resumo semanal de sábado

> **A ordem importa.** A coleta (3) vem antes do backoffice (4) porque a tela de rotulagem trabalha em cima do que o job já trouxe — não há colheita separada de amostra. E a rotulagem (5) vem antes do catálogo (6): escrever termo antes de ler dado real é inventar vocabulário.

**Critério de saída:** 20 assinantes reais recebendo alerta, precisão medida ≥ 0,95 na amostra aleatória do conjunto rotulado, zero alerta duplicado.

### Fase 2 — Confiança

- Botão "não era pra mim" no e-mail → `feedback_alerta` → revisão semanal do catálogo
- Painel web do assinante: histórico de alertas, favoritos, editar perfil
- Backoffice completo: `/admin/alertas`, `/admin/ramos`, `/admin/contratacoes`, simulação "o que essa pessoa teria recebido"
- Catálogo até 15 ramos
- Página de status pública (última coleta, contratações lidas)

### Fase 3 — Retenção (o que separa isto de um agregador)

- Trilha "primeira licitação" — passo a passo em português: gov.br prata/ouro, cadastro no sistema de compras, envio de proposta
- **Cofre de certidões com aviso de vencimento** (CND federal, FGTS, trabalhista, municipal) — lembrete em D-15 e D-3
- Upload de arquivo (Vercel Blob ou R2)

### Fase 4 — Receita

- Plano gratuito: 1 ramo + 1 município
- Plano pago (R$19–29/mês): múltiplos ramos, estado inteiro, cofre de certidões, WhatsApp
- WhatsApp via API oficial (custo por mensagem — só entra com receita)

---

## 7. Riscos e o que fazer com cada um

| Risco | Mitigação |
|---|---|
| **Falso positivo mata o produto** | Três alertas errados e a pessoa marca spam — perde-se ela e a reputação do domínio. Métrica de precisão trava o CI; teto de alertas por assinante por dia; botão de feedback em todo e-mail |
| Dependência de terceiro (PNCP) | Guardar `bruto` de tudo. Contrato validado por Zod na borda: mudança de schema falha alto e explícito, não silenciosamente |
| Promessa mal calibrada | Copy nunca sugere faturamento. "Você vai saber; disputar é com você" |
| Consultoria jurídica | Trilha explica processo. Não opinar sobre recurso, impugnação ou enquadramento |
| Reputação de domínio | SPF/DKIM/DMARC no dia 1, domínio dedicado para envio, supressão automática em bounce/reclamação |
| Limite ME/EPP muda por decreto | Nunca constante espalhada — `src/shared/config/limites.ts`, uma fonte, comentada com a norma vigente e a data de conferência |

---

## 8. Onde está cada coisa

| Preciso de... | Leia |
|---|---|
| Entender o produto | `docs/base-de-conhecimentos/contexto-produto.md` |
| Regras que a IA deve seguir sempre | `docs/base-de-conhecimentos/regras-sistemicas-ia.md` |
| Contrato do PNCP | `docs/base-de-conhecimentos/backend-contexto/fonte-pncp.md` |
| Como o job roda | `docs/base-de-conhecimentos/backend-contexto/coleta-e-jobs.md` |
| Regra do casamento | `docs/base-de-conhecimentos/regras-de-negocio/casamento.md` |
| Escrever um ramo novo | `docs/base-de-conhecimentos/regras-de-negocio/catalogo-de-ramos.md` |
| Rotular itens / operar o robô | `docs/base-de-conhecimentos/backoffice.md` |
| Criar uma página | `docs/base-de-conhecimentos/frontend/padrao-por-pagina.md` |
| Padrões de código / checklist de PR | `docs/base-de-conhecimentos/07-padroes-codigo.md` |
| Dados reais da verificação | `docs/base-de-conhecimentos/dados/verificacao-de-viabilidade.md` |
