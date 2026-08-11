# Coleta e Jobs

> Quatro jobs independentes e idempotentes. Cada um pode rodar duas vezes sem estragar nada, e pode falhar sem levar os outros junto.

---

## Agendamento

`vercel.json`:

```jsonc
{
  "crons": [
    { "path": "/api/cron/coletar",        "schedule": "0 9 * * *"  },
    { "path": "/api/cron/casar",          "schedule": "20 9 * * *" },
    { "path": "/api/cron/alertar",        "schedule": "40 9 * * *" },
    { "path": "/api/cron/enviar",         "schedule": "0 10 * * *" },
    { "path": "/api/cron/resumo-semanal", "schedule": "0 12 * * 6" }
  ]
}
```

> **Plano Hobby:** máximo 1 execução por dia por cron, precisão ±59 min. As etapas são espaçadas para dar folga, mas **nenhuma delas depende da anterior ter terminado** — cada uma trabalha em cima do estado do banco. Se a coleta atrasar, o casamento pega no dia seguinte.
>
> **Ao migrar para Pro:** `0 */3 * * *` na coleta e nas seguintes. O código não muda.

**Toda rota de cron exige** `Authorization: Bearer ${CRON_SECRET}`. Sem header válido → 401, sem exceção, inclusive em preview.

---

## `/api/cron/coletar`

Responsabilidade: trazer contratações abertas e seus itens para o banco. **Não classifica, não envia nada.**

### Orçamento de tempo

A função tem 300s. O job trabalha com **orçamento explícito**:

```ts
const ORCAMENTO_MS = 240_000; // 300s menos margem de segurança
const inicio = Date.now();
const temTempo = () => Date.now() - inicio < ORCAMENTO_MS;
```

Quando o tempo acaba, salva o cursor e retorna `200` com o resumo do que foi feito. **Não é falha — é o desenho.** A próxima execução continua de onde parou.

### Cursor

Uma linha por combinação `(uf, modalidade)`:

```
cursor_coleta
  chave                    'SP:8'
  ultima_pagina            7
  ultima_data_processada   2026-08-10
  atualizado_em            2026-08-10T09:04:12-03:00
```

O laço percorre as combinações em ordem de **cursor mais antigo primeiro** — assim nenhuma UF fica sem coleta porque outra é grande demais.

### Passos

1. Para a combinação atual, `GET /contratacoes/proposta` com `tamanhoPagina=50` a partir de `ultima_pagina`
2. Valida com Zod. **Falha de schema aborta a combinação e registra erro** — não silencia, não adivinha
3. `upsert` de `contratacao` por `numero_controle_pncp`, gravando `bruto`
4. Para cada contratação **nova** (não para as já conhecidas): `GET .../itens`, concorrência máxima **5**, `upsert` em `item_contratacao`
5. Atualiza cursor. Se `paginasRestantes === 0`, zera a página e avança a data
6. Grava `execucao_coleta` com contagens

### Regras

| Regra | Motivo |
|---|---|
| `upsert` por `numero_controle_pncp`, nunca `insert` cego | Rodar duas vezes não pode duplicar |
| Buscar itens só de contratação nova | O N+1 é o custo dominante; contratação já coletada não muda de item |
| `bruto` sempre gravado | Reprocessar sem re-consultar. O PNCP pode mudar ou cair |
| Descartar `situacaoCompraId !== 1` | O que não está divulgado não gera alerta |
| Retry com backoff exponencial + jitter, máx. 3 | Rate limit não é documentado |
| Timeout de 20s por requisição | Uma requisição travada não pode comer o orçamento |
| Nunca `Promise.all` sobre a lista inteira | Estoura conexões e file descriptors |

---

## `/api/cron/casar`

Responsabilidade: classificar itens ainda não classificados **na versão atual do catálogo**.

```sql
SELECT i.* FROM item_contratacao i
LEFT JOIN classificacao_item c
  ON c.item_id = i.id AND c.versao_catalogo = $versaoAtual
WHERE c.id IS NULL
```

`versao_catalogo` é a chave do reprocessamento: ao publicar um catálogo novo, **todos os itens são reavaliados automaticamente** na próxima execução, sem migration e sem script manual.

O casamento em si é função pura (`src/server/casamento/casar.ts`) — sem I/O, sem `Date`, sem aleatoriedade. O job só lê, chama e grava. Ver `../regras-de-negocio/casamento.md`.

---

## `/api/cron/alertar`

Responsabilidade: decidir **quem recebe o quê**. Cria linhas `alerta` com status `pendente`. Não envia.

Para cada assinante ativo, uma contratação entra se:

| Critério | Fonte |
|---|---|
| Tem item classificado em ramo do perfil, com `score ≥ LIMIAR` | `classificacao_item` |
| Município (ou UF, conforme o perfil) bate | `contratacao.codigo_ibge` |
| `valor_total_estimado ≤ teto` do assinante | `perfil_busca.teto_valor_centavos` |
| Faltam **≥ 24h** para `data_encerramento_proposta` | Alerta que chega sem tempo de agir é pior que nenhum |
| `situacao_compra_id = 1` | Ainda válido |
| Não existe alerta para `(assinante, contratacao)` | `UNIQUE` no banco — a única defesa que importa |

**Teto diário:** máximo **5 alertas por assinante por dia**. Excedente fica pendente para o dia seguinte, priorizado por (1) exclusividade ME/EPP, (2) prazo mais curto, (3) score mais alto. Caixa de entrada inundada é indistinguível de spam.

---

## `/api/cron/enviar`

Responsabilidade: só I/O. Pega `alerta` pendente, renderiza, envia pelo Resend, grava `resend_id` e `enviado_em`.

| Regra | Motivo |
|---|---|
| Marcar `enviado_em` **na mesma transação** do retorno do Resend | Sem isso, uma falha entre envio e gravação reenvia o mesmo e-mail |
| Falha de envio → `status = falhou` com o erro, sem retry infinito | Retry em loop queima reputação de domínio |
| Assinante com bounce forte ou reclamação → `suprimido` | Webhook do Resend faz isso automaticamente |
| Se `RESEND_MODE !== "live"`, não envia — grava o render no log | Trava contra disparo acidental em preview |

---

## `/api/cron/resumo-semanal`

Sábado. Vai para **todos** os assinantes ativos, inclusive quem não recebeu nada na semana — é justamente para quem não recebeu nada que ele existe: mostra que o serviço está vivo e que o silêncio foi por falta de oportunidade, não por defeito.

Conteúdo: o que chegou na semana, quantas contratações foram lidas na região da pessoa, e o que está com prazo aberto e ainda dá tempo.

---

## Idempotência — o resumo

| Job | O que garante que rodar 2× não estraga |
|---|---|
| `coletar` | `upsert` por `numero_controle_pncp` e por `(contratacao_id, numero_item)` |
| `casar` | `LEFT JOIN` com `versao_catalogo` só pega o não classificado |
| `alertar` | `UNIQUE (assinante_id, contratacao_id)` |
| `enviar` | `enviado_em IS NULL` no `WHERE`, transação no marcador |

---

## Quando isto deixar de servir

O desenho aguenta confortavelmente a ordem de alguns milhares de assinantes. Sinais de que chegou a hora de repensar:

- Coleta não fecha o ciclo de todas as UFs em 24h mesmo com o orçamento cheio
- `enviar` não vaza a fila de pendentes em uma execução
- Necessidade de alerta em minutos, não em horas

A evolução natural nessa ordem: (1) plano Pro com cron de hora em hora, (2) paralelizar por UF em invocações separadas, (3) fila real (QStash ou Vercel Workflows). **Nada disso antes do sinal.**
