# Verificação de Viabilidade — achados empíricos

> **Data da coleta:** 10/08/2026
> **Método:** chamadas reais à API pública de consulta do PNCP (`https://pncp.gov.br/api/consulta`), sem autenticação.
> **Amostra:** 300 contratações de modalidade 8 (Dispensa) com período de proposta em aberto em SP + itens de 40 dessas contratações (180 itens).
>
> Estes números sustentam decisões do `PLANEJAMENTO.md`. Se forem refeitos, **atualizar aqui e revisar as decisões que dependem deles.**

---

## 1. Volume disponível

Contratações com período de recebimento de proposta **em aberto** no momento da consulta:

| Modalidade | Brasil | SP | MG |
|---|---:|---:|---:|
| 8 — Dispensa | 3.397 | 604 | 347 |
| 6 — Pregão Eletrônico | 18.021 | 3.735 | 2.237 |

**Leitura:** há volume de sobra. O gargalo nunca será "falta de edital" — será precisão do casamento.

**Consequência de arquitetura:** o job não pode varrer tudo a cada execução. Precisa de cursor e de processamento incremental por `(uf, modalidade)`. Ver `backend-contexto/coleta-e-jobs.md`.

---

## 2. Cobertura municipal — ✅ o produto funciona fora de capital

Na amostra de 300 dispensas abertas em SP: **101 municípios distintos**.

| Município | Ocorrências |
|---|---:|
| São Paulo | 79 |
| São José do Rio Preto | 11 |
| Caraguatatuba | 9 |
| São José dos Campos | 8 |
| Salto | 7 |
| São Carlos | 6 |
| Ribeirão Preto | 6 |
| Santos | 6 |
| *(outros 93 municípios)* | 1–5 cada |

Entre os órgãos publicando: **Município de Trabiju** (~1.600 habitantes), com dispensa de R$ 93 mil para gêneros alimentícios da agricultura familiar.

**Leitura:** cidade pequena publica, e publica bem. A hipótese pessimista ("só funciona em capital") foi derrubada. A concentração em São Paulo capital (26%) é em boa parte autarquia estadual e universidade (USP), não prefeitura — o que reforça a cauda longa municipal.

**Ressalva honesta:** a amostra é de SP. Repetir para pelo menos um estado do Norte/Nordeste antes de prometer cobertura nacional.

---

## 3. Janela de prazo — ✅ e melhor que o esperado

Distância entre `dataPublicacaoPncp` e `dataEncerramentoProposta`, em dias corridos:

| Métrica | Valor |
|---|---:|
| Mínimo | 4 dias |
| p25 | 5 dias |
| **Mediana** | **6 dias** |
| p75 | 8 dias |
| Máximo | 64 dias |
| % com janela ≤ 3 dias | **0%** |
| % com janela ≤ 7 dias | 73% |

**Leitura:** o pressuposto inicial de "mediana de três dias" estava pessimista. Nenhuma contratação da amostra tinha janela ≤ 3 dias.

**Consequência de arquitetura — esta é a decisão mais afetada:**

- Coleta **diária** já entrega o produto (perde no máximo ~17% da janela).
- Coleta a cada 3–6h é conforto, não requisito.
- Portanto: **Vercel Cron no plano Hobby (1×/dia) é suficiente para o v1.** Não é necessário Cloudflare Worker, nem plano Pro no lançamento.
- Ainda assim, entregar o e-mail no mesmo dia importa: com mediana de 6 dias, um dia de atraso consome 1/6 do tempo de decisão da pessoa.

---

## 4. Faixa de valor — ✅ é território de MEI

`valorTotalEstimado` das contratações da amostra:

| Métrica | Valor |
|---|---:|
| Mediana | R$ 9.360 |
| % ≤ R$ 80.000 | **94%** |

**Leitura:** dispensa eletrônica é, de fato, compra miúda. O filtro por teto do assinante vai barrar pouco — o que é bom: significa que quase tudo que casa por ramo é elegível por tamanho.

---

## 5. Exclusividade ME/EPP — ✅ é dado, não inferência

Em 180 itens de 40 contratações, a distribuição de `tipoBeneficioNome`:

| Valor | Itens | % |
|---|---:|---:|
| **Participação exclusiva para ME/EPP** | 75 | 42% |
| Sem benefício | 64 | 36% |
| Não se aplica | 41 | 23% |

**Leitura:** este é o achado mais valioso da verificação. A frase "Exclusivo para micro e pequena empresa" no e-mail **não precisa ser deduzida do valor** — vem carimbada no item. Isso remove uma classe inteira de erro e permite uma afirmação forte no e-mail sem risco.

**Consequência de produto:** `tipo_beneficio_id` é campo de primeira classe no schema e critério de ordenação — item exclusivo ME/EPP tem prioridade de alerta sobre item sem benefício.

---

## 6. Qualidade da descrição — ✅ o dicionário funciona

As descrições vêm em dois formatos, ambos tratáveis:

**Formato A — português corrido** (mais comum no `objetoCompra`):

```
AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS DA AGRICULTURA FAMILIAR PARA ALIMENTAÇÃO ESCOLAR
Aquisição de material de informática
Contratação de serviços de manutenção em tapeçaria, para reforma de cadeiras da Biblioteca
Contratação de serviços técnicos especializados em acústica e isolamento sonoro
```

**Formato B — nome simples ou padrão CATMAT com atributos** (no `descricao` do item):

```
ALFACE CRESPA/LISA/MIMOSA/AMERICANA
BANANA NANICA
MANDIOCA DESCASCADA
Switch quantidade portas: 24, tipo portas: gigabit ethernet, velocidade porta: 1000 mbps
Teclado Microcomputador tipo: multimidia, tipo conector: usb, conectividade: sem fio
Estabilizador Tensão tensão alimentação entrada: 115/127/220, quantidade tomadas saída: 6
```

**Leitura:** não é sopa de código interno. É português legível ou nome de produto com atributos separados por `:` — ambos casam bem com dicionário de termos após normalização (minúscula, sem acento, limite de palavra).

**Consequências de implementação:**
- Casar contra `descricao` do item **e** `objetoCompra` do cabeçalho — são complementares. "ALFACE CRESPA" sozinho não diz merenda; `objetoCompra` diz.
- O formato CATMAT justifica cortar o texto no primeiro `:` de atributo ao extrair o "nome do produto" para exibição no e-mail.
- Casos como "manutenção em tapeçaria" mostram que a cauda longa é real: o catálogo nunca vai cobrir tudo, e tudo bem. **Recall parcial é aceitável; precisão não.**

---

## 7. O que ainda falta verificar

| Pergunta | Como responder | Bloqueia o quê |
|---|---|---|
| Rate limit real da API | Observar em produção com backoff; nada documentado no manual | Concorrência do job |
| Cobertura fora do Sudeste | Repetir a amostra para PA, BA, CE | Promessa de cobertura nacional |
| Conjunto rotulado de alimentação | Ler 200 itens à mão e marcar o rótulo correto | Início da Fase 1 (é a linha de base da precisão) |
| Formato canônico do link público do edital | Abrir `https://pncp.gov.br/app/editais/{cnpj}/{ano}/{sequencial}` no navegador (é SPA — `curl` não resolve) | Botão "Ver o edital" do e-mail |
| Estabilidade de `numeroControlePNCP` | Reconsultar a mesma contratação em dias diferentes | Chave de deduplicação |

---

## Como reproduzir

```bash
curl -s "https://pncp.gov.br/api/consulta/v1/contratacoes/proposta?dataFinal=20260930&codigoModalidadeContratacao=8&uf=SP&pagina=1&tamanhoPagina=50" -H "accept: application/json"
```

```bash
curl -s "https://pncp.gov.br/api/pncp/v1/orgaos/01572597000101/compras/2026/158/itens" -H "accept: application/json"
```
