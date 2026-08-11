# Decisões de Arquitetura (ADR)

> Uma decisão por registro. **ADR aceito não se edita** — se mudou, escreva um novo que o substitua e marque o antigo como `Substituído por ADR-XXX`.
> Formato: contexto → decisão → consequências → o que faria a gente mudar de ideia.

---

## ADR-001 — Um único app Next.js na Vercel

**Status:** Aceito — 10/08/2026

**Contexto.** O sistema precisa de: job agendado, banco, casamento de texto, envio de e-mail, landing e painel. A pergunta era se isso exige backend separado, e se front e back cabem no mesmo deploy.

**Decisão.** Um projeto Next.js (App Router) na Vercel, com tRPC como BFF, Vercel Cron para agendamento e Neon Postgres como banco.

**Consequências.**
- Um repositório, um deploy, tipos compartilhados de ponta a ponta sem duplicação de contrato.
- Fica preso aos limites de cron e duração de função da Vercel — ambos verificados e compatíveis (ADR-002).
- Jobs longos precisam ser escritos em lotes com cursor, não como varredura única. Isso é bom por outras razões: torna a coleta retomável.

**O que nos faria mudar de ideia.** Job que não caiba em 300s mesmo em lotes; necessidade de conexão persistente; volume que torne o custo de função maior que o de um contêiner.

---

## ADR-002 — Vercel Cron diário no v1, sem gatilho externo

**Status:** Aceito — 10/08/2026

**Contexto.** O plano Hobby da Vercel limita cron a **1× por dia** com precisão de ±59 min; o Pro permite 1× por minuto. A hipótese inicial do projeto era que a janela de proposta tinha mediana de 3 dias — o que tornaria a coleta diária inaceitável e justificaria um Cloudflare Worker.

**A hipótese foi medida e é falsa.** Em amostra de 300 dispensas abertas em SP: mediana de **6 dias corridos** entre publicação e encerramento, mínimo de 4, e **nenhuma** com janela ≤ 3 dias (`../dados/verificacao-de-viabilidade.md`).

**Decisão.** Cron diário no plano Hobby para o v1. Migrar para Pro com execução a cada 3h quando houver receita ou quando o volume de assinantes justificar.

**Consequências.**
- Custo de infra do v1: zero.
- Pior caso, o alerta chega ~1 dia após a publicação — consome ~1/6 da janela de decisão. Aceitável, não ideal.
- O código do job **não pode assumir a frequência**. Ele é dirigido por cursor e por `dataPublicacaoPncp`, não por "o que mudou desde ontem".

**Escape hatch, se a frequência apertar antes da receita.** Upstash QStash (free tier) ou um Cloudflare Worker de 10 linhas fazendo `fetch()` autenticado em `/api/cron/coletar`. O gatilho é externo e descartável; **a lógica não sai do repositório**.

---

## ADR-003 — Postgres (Neon), não SQLite/D1

**Status:** Aceito — 10/08/2026

**Contexto.** O esboço original previa Cloudflare D1. Ao decidir por Vercel (ADR-001), D1 deixaria o banco em outro provedor.

**Decisão.** Neon Postgres, com Drizzle ORM e migrations versionadas.

**Por quê.**
- `unaccent` e índice de texto para **triagem barata de candidatos** antes do casamento fino em TypeScript.
- `jsonb` para o payload bruto do PNCP — reprocessamento sem re-consulta.
- `UNIQUE` composto e transações reais para garantir "um alerta por assinante por contratação".
- Free tier suficiente para as primeiras centenas de assinantes; branch por PR facilita preview.

**Consequências.** Conexão serverless exige pooling (driver HTTP do Neon ou pooler). Nunca abrir conexão direta por invocação sem pool.

---

## ADR-004 — Dicionário determinístico, não embedding

**Status:** Aceito — 10/08/2026

**Contexto.** O casamento entre "refeições transportadas tipo quentinha" e "eu vendo marmita" é o problema central. Duas famílias de solução: catálogo de termos escrito à mão, ou similaridade semântica por embedding.

**Decisão.** Catálogo tipado, versionado no repositório e coberto por testes. Embedding fica fora do v1.

**Por quê.**
- **Explicável.** Dá para dizer à assinante exatamente por que aquele alerta chegou — e isso é metade da confiança no produto.
- **Determinístico.** Mesmo texto, mesmo resultado, sempre. Testável com conjunto rotulado e gate no CI.
- **Custo zero** e sem latência de inferência.
- **Melhora por contribuição**: cada feedback negativo vira um termo em `excluir`, com teste que prova a correção.
- A verificação empírica mostrou descrições legíveis em português ou padrão CATMAT — exatamente o terreno onde dicionário funciona.

**Consequências.** Recall limitado à cauda longa que o catálogo cobre. **Isso é aceito conscientemente**: alerta perdido a pessoa não percebe; alerta errado faz ela cancelar.

**O que nos faria mudar de ideia.** Se, com catálogo maduro, a análise de itens **não classificados** mostrar volume relevante de oportunidades reais sendo perdidas. Aí embedding entra como **segunda opinião sobre o que o dicionário não pegou** — nunca como substituto, e nunca com poder de disparar alerta sozinho no v1.

---

## ADR-005 — Autenticação por magic link, sem senha

**Status:** Aceito — 10/08/2026

**Contexto.** O público é MEI que não gerencia senha e cujo canal principal já é o e-mail.

**Decisão.** Login por link enviado por e-mail. Sem senha, sem OAuth social no v1.

**Consequências.** Uma superfície de ataque a menos e nenhum hash de senha para vazar. Depende inteiramente da entregabilidade do e-mail — o que reforça a prioridade de SPF/DKIM/DMARC desde o dia 1. Link com validade curta e uso único.

---

## ADR-007 — Rotulagem no backoffice, régua em arquivo

**Status:** Aceito — 10/08/2026

**Contexto.** O conjunto rotulado é a régua que trava o CI (ADR-004). A primeira proposta era rotular em CSV/JSON à mão. Rotular em planilha é lento, não acumula, não dá para priorizar o que rotular, e o arquivo morre numa pasta.

A alternativa — uma tela de rotulagem no backoffice — cria uma tensão: se os rótulos vivem só no Postgres, o CI passa a depender do banco de produção, a régua fica invisível no code review e não há histórico de quem mudou o quê.

**Decisão.** Rotula-se no backoffice (`/admin/rotular`, tabela `rotulo_manual`). Um script local (`pnpm rotulos:sync`) lê o banco e escreve `fixtures/rotulados/*.json`. **O teste lê o arquivo, nunca o banco.**

**Consequências.**
- A tela pode ser boa de verdade: atalho de teclado, deduplicação por hash de texto, fila priorizada, progresso.
- O diff dos fixtures aparece no PR — a mudança da régua é revisável junto com a mudança do catálogo.
- CI continua determinístico e offline.
- Custo: uma etapa manual (`sync` + commit) entre rotular e o teste valer. É deliberado — a régua não deve mudar sem alguém decidir que muda.

**Detalhes que fazem parte da decisão.**
- Chave por `hash_texto` normalizado: um rótulo vale para todo texto idêntico, inclusive futuro. ~200 itens brutos viram ~60 decisões.
- **Modo cego por padrão** — a tela não mostra o palpite do robô. Ver a sugestão enviesa o rótulo e a régua passa a medir a si mesma. O toggle existe e fica registrado em `viu_palpite`.
- **20% da fila é amostra aleatória**, e a métrica de gate é a dessa fatia. Rotular só caso difícil produz uma precisão que não representa o que a assinante recebe.

---

## ADR-006 — Nomes de domínio em português

**Status:** Aceito — 10/08/2026

**Contexto.** O domínio é inteiramente brasileiro: contratação, dispensa, ramo, certidão, ME/EPP. Não existe tradução natural de "dispensa eletrônica" ou "contratação" que não perca precisão.

**Decisão.** Tabelas, colunas, tipos de domínio e funções de negócio em português. Termos de framework e infraestrutura permanecem em inglês (`page.tsx`, `useQuery`, `handleSubmit`).

**Consequências.** Código lê como o domínio fala. Evita o vaivém mental "supplier ↔ fornecedor" no meio de uma regra sutil. Não misturar: `contratacao.valorTotalEstimado`, nunca `contratacao.totalEstimatedValue`.
