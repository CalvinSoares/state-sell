# Roadmap de Melhorias

> Ordenado por impacto no que o produto promete: **avisar certo, no e-mail certo**.
> A Fase 1 do produto (núcleo) já está pronta e verificada ponta a ponta. Isto é o que vem depois.

---

## Fase 0 — Destravar (base para tudo)

Pequeno, rápido, habilita o resto.

- **0.1 — Magic link no console em dev.** Em `dry`, logar a URL do link de acesso, para testar o fluxo de assinante local sem e-mail. ✔
- **0.2 — Tema/contraste no `/admin` e `/painel`.** Mesmo bug já corrigido no cadastro (branco fixo + texto em variável = ilegível no dark). Rotular por horas exige tela confortável. ✔
- **0.3 — Revisar `/admin/rotular`.** Garantir usabilidade e adicionar o toggle "ver o palpite" (registrado em `viu_palpite`). ✔

## Fase 1 — Precisão do casamento (o coração)

A única métrica que faz alguém cancelar é o falso positivo. É aqui que o produto é bom ou vira spam.

- **1.1 — Loop de feedback.** O "não era pra mim" do e-mail/painel grava em `feedback_alerta` e volta para a fila de rotulagem como negativo. Faz a precisão melhorar sozinha com o uso. ✔
- **1.2 — Métrica por origem da amostra.** O gate de precisão vale sobre a fatia **aleatória** (representa o real), não sobre os casos difíceis. Relatório separado por origem. ✔
- **1.3 — Rotular de fato.** Trabalho manual do operador em `/admin/rotular`, ~60 itens/ramo. (Ferramenta entregue; execução é sua.)

**Critério de saída:** precisão ≥ 0,95 na amostra aleatória do conjunto rotulado, com pelo menos os 5 ramos cobertos.

## Fase 2 — Entregabilidade e operação

- **2.1 — Remetente configurável** (`RESEND_FROM`): use `onboarding@resend.dev` para testar sem domínio; troque para o domínio verificado no `live`. ✔
- **2.2 — Webhook do Resend** (`/api/webhook/resend`): valida assinatura Svix e suprime o assinante em bounce/reclamação. ✔
- **2.3 — `/status`** pública: última coleta ok, lidas 24h, alarme se > 36h. ✔
- **2.4 — Deep-link no edital**: monta o link direto da contratação no PNCP quando não há `linkSistemaOrigem`. ✔ (no e-mail e no painel)

## Auditoria de segurança (11/08/2026)

Rodada por agente lendo o código. **Corrigido:**

- **Login admin sem prova de posse** → agora exige `ADMIN_PASSWORD` (2º fator, comparação de tempo constante) além da allowlist.
- **Regex de cookie sem âncora** (admin) → ancorada.
- **`CRON_SECRET` comparação não-constante** → tempo constante.
- **Assinatura de token com fallback `"sem-segredo"`** → falha alto sem `AUTH_SECRET`.
- **Cursor avançava interrompido no meio da página** → só avança se a página fechou inteira.
- **Feedback não idempotente** (scanner de e-mail poluía dados) → idempotente por alerta.
- **E-mail duplicado sob concorrência** → reivindicação atômica `pendente→enviando` (`for update skip locked`).
- **`/api/cron/tick` sem isolamento** → cada etapa em try/catch.

**Corrigido depois (2ª leva):**

- **Rate limit** nas procedures públicas de e-mail (`criar`, `enviarLinkAcesso`): janela fixa atômica no Postgres (tabela `rate_limit`), 10/h por IP e 3/h por e-mail. Sem infra extra. ✔
- **Teto diário de alertas** agora desconta o que foi criado nas últimas 24h e exclui pares já alertados → o excedente eventualmente sai, em vez de ser descartado. ✔

**Corrigido (3ª leva):**

- **Audiência de token** (`aud`): admin, assinante e magic link agora têm claim de audiência; um token de uma audiência não vale para outra. ✔
- **GET com efeito colateral no `/feedback`**: GET só mostra um botão; o registro é no POST → scanner de e-mail não polui os dados. ✔

**Corrigido (4ª leva):**

- **Magic link de uso único**: cada link carrega um `jti`; o 1º clique consome (tabela `magic_usado`), o 2º falha. Link vazado não reautentica. ✔
- **N+1 do resumo semanal**: consultas agregadas ANTES do laço (perfis+e-mail, coletadas por região com `GROUP BY`, enviados por assinante, detalhes das aberturas em lote) — de ~4 queries por assinante para um punhado no total. ✔
- **Índices** em `contratacao(coletado_em)` e `(situacao_compra_id, data_encerramento_proposta)` para o caminho quente das candidatas e do resumo. ✔

**Pendente (decisão de produto / fase futura):**

- **CAPTCHA** no cadastro (o rate limit já mitiga o mail-bombing; CAPTCHA endurece mais).
- **`/verificar` continua GET** (magic link é clicado): ativação idempotente + uso único; risco baixo, mantido GET para não atritar o login.
- **Seleção de candidatas em memória** (perfis × candidatas): ok e limitado no volume atual; reavaliar com pré-filtro por região no banco quando a escala pedir.

## Conversão e produto (feito)

- **Prévia "o que já está aberto pra você"** no cadastro — mostra oportunidades reais no primeiro minuto. ✔
- **E-mail de alerta redesenhado** (tabelas, mobile-first) + descadastro com `List-Unsubscribe` (RFC 8058). ✔
- **Lembrete D-1**: quem já recebeu o alerta é avisado quando o prazo cai em até 36h ("Última chamada"). Reivindicação atômica (`lembrado_em`), no `tick` e em `/api/cron/lembrar`. ✔

## Fase 3.2 — Ramos (parcial)

Catálogo de **5 → 11 ramos**: + jardinagem, transporte, veterinária, material de
escritório, mobiliário, costura. `VERSAO_CATALOGO=2` (reclassifica tudo no
próximo `casar`). Precisão 1.00 / recall 1.00 nas fixtures-semente (11 ramos).
**Ainda precisam de rotulagem real** (~60 itens/ramo em `/admin/rotular`) para
validar precisão em produção — as definições são um ponto de partida.

## Fase 3 — Cobertura e escala

- **3.1 — Verificar fora do Sudeste** (PA/BA/CE) antes de prometer cobertura nacional.
- **3.2 — Ampliar de 5 para ~15 ramos.**
- **3.3 — CI** rodando testes + gate de precisão a cada push.
- **3.4 — Robustez do `tick`** (N+1 de itens em estado grande pode bater 300s; separar por UF se preciso).

## Fase 4 — Retenção

- **4.1 — Trilha "primeira licitação"** (gov.br, cadastro, certidões, envio da proposta). ✔
- **4.2 — Cofre de certidões** com aviso de vencimento (D-15 e D-3) + PDF privado (Vercel Blob). ✔

## Fase 5 — Receita

- **5.1 — Planos + cobrança** (Pix recorrente / Asaas).
- **5.2 — WhatsApp** (canal onde o público lê; custo por mensagem).

## Higiene contínua

- Reforçar o login admin (hoje só e-mail na allowlist, sem senha/link).
- Rate limit nos endpoints públicos.

---

*Marcações ✔ são atualizadas conforme as fases avançam.*
