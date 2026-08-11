# Fluxos Críticos

> O que não pode quebrar, em ordem de gravidade.
> Cada item tem um teste automatizado ou está explicitamente marcado como verificação manual.

---

## P0 — quebra o produto

### 1. Alerta duplicado

**Sintoma:** a mesma pessoa recebe dois e-mails da mesma contratação.
**Custo:** perda de confiança imediata; parece robô quebrado.

| Teste | Tipo |
|---|---|
| `UNIQUE (assinante_id, contratacao_id)` existe na migration | integração |
| Rodar `/api/cron/alertar` duas vezes seguidas não cria linha nova | integração |
| Rodar `/api/cron/enviar` duas vezes não reenvia (`enviado_em IS NULL` no WHERE) | integração |
| Falha simulada entre resposta do Resend e commit não reenvia | integração |

### 2. E-mail real disparado fora de produção

**Custo:** assinante recebe lixo de teste; domínio queima.

| Teste | Tipo |
|---|---|
| `RESEND_MODE !== "live"` → nenhuma chamada HTTP ao Resend | unitário |
| `NODE_ENV !== "production"` → nenhuma chamada, mesmo com `RESEND_MODE=live` | unitário |
| Preview de PR não tem cron ativo | verificação manual no deploy |

### 3. Falso positivo acima do limite

**Custo:** cancelamento e reclamação de spam.

| Teste | Tipo |
|---|---|
| Precisão ≥ 0,95 por ramo no conjunto rotulado | unitário — **trava o CI** |
| Todo veto do catálogo tem exemplo negativo correspondente | unitário |
| Todo termo do catálogo é igual à sua própria normalização | unitário |

### 4. Coleta parada em silêncio

**Custo:** o produto morre sem sinal. Assinante acha que "não teve edital" quando o job está caído há uma semana.

| Teste | Tipo |
|---|---|
| `execucao_coleta` grava sucesso e falha | integração |
| `/status` mostra a última coleta por `(uf, modalidade)` | integração |
| Alarme quando nenhuma coleta bem-sucedida em 36h | operacional |
| Falha de schema Zod do PNCP **falha alto** e registra o payload | unitário |

---

## P1 — degrada a confiança

### 5. Prazo errado no e-mail

Timezone é a origem clássica: PNCP devolve `2026-08-13T23:59:00` sem offset.

| Teste | Tipo |
|---|---|
| Data sem offset é interpretada como `America/Sao_Paulo` | unitário |
| "faltam N dias" calculado com `agora` injetado, nunca `new Date()` interno | unitário |
| Virada de dia e horário de verão histórico | unitário |

### 6. Alerta acima do teto do assinante

Ganhar o que não se consegue cumprir gera multa e impedimento de licitar.

| Teste | Tipo |
|---|---|
| `valor_total_estimado > teto` nunca gera alerta | unitário |
| Valor nulo no PNCP não é tratado como zero | unitário |

### 7. Afirmação de exclusividade ME/EPP sem respaldo

| Teste | Tipo |
|---|---|
| A linha só aparece com `tipoBeneficio` correspondente | unitário |
| Item sem o campo não gera a linha | unitário |

### 8. Alerta sem tempo de agir

| Teste | Tipo |
|---|---|
| Prazo < 24h não gera alerta | unitário |
| Contratação com `situacao_compra_id ≠ 1` não gera alerta | unitário |

---

## P2 — atrito

### 9. Cadastro

| Verificação | Tipo |
|---|---|
| Submit duplo não cria dois assinantes | integração |
| E-mail já existente não é revelado | integração |
| Erro de servidor preserva o formulário preenchido | manual |
| Nenhum jargão sobreviveu na tela | revisão manual, todo PR que toca copy |

### 10. Descadastro

| Verificação | Tipo |
|---|---|
| Link funciona sem login, em um clique | integração |
| Assinante suprimido não recebe nem o resumo semanal | unitário |

### 11. Idempotência da coleta

| Verificação | Tipo |
|---|---|
| Rodar `coletar` duas vezes não duplica contratação nem item | integração |
| Interrupção por orçamento de tempo retoma do cursor | integração |
| Contratação já conhecida não dispara nova busca de itens | unitário |

---

## Massa de teste

Fixtures em `fixtures/pncp/`, capturadas de respostas reais e **congeladas** (sem chamar a API no CI):

| Arquivo | Contém |
|---|---|
| `contratacoes-abertas.json` | página real de `/contratacoes/proposta` |
| `itens-alimentacao.json` | itens reais, incluindo `tipoBeneficio` variado |
| `itens-nulos.json` | caso com `valorTotalHomologado: null`, `linkSistemaOrigem: "SEM PUBLICAÇÃO"` |
| `resposta-invalida.json` | payload com campo faltando — o teste garante que Zod rejeita |

**O CI nunca chama o PNCP.** Rede em teste é flakiness garantida e é falta de educação com uma API pública gratuita.

---

## Antes de cada deploy de produção

- [ ] Suíte completa passando, incluindo o gate de precisão
- [ ] `RESEND_MODE` conferido no ambiente de produção
- [ ] `CRON_SECRET` presente e diferente do de preview
- [ ] Migration aplicada antes do deploy do código que depende dela
- [ ] Se mexeu no template do e-mail: enviado para caixa própria no Gmail app, Gmail web e Outlook
- [ ] Se mexeu no catálogo: `VERSAO_CATALOGO` incrementada
