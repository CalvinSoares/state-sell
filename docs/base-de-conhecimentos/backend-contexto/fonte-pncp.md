# Fonte de Dados — PNCP

> Contrato **verificado por chamada real em 10/08/2026**. Onde algo não foi verificado, está marcado com ⚠️.
> O PNCP é terceiro: mudança de contrato nos derruba. Toda resposta passa por Zod na borda e o payload original é gravado em `bruto`.

---

## Bases

| Base | Uso | Autenticação |
|---|---|---|
| `https://pncp.gov.br/api/consulta` | Consulta de contratações (listagens) | Nenhuma |
| `https://pncp.gov.br/api/pncp` | Itens, arquivos e detalhes de uma contratação | Nenhuma |

⚠️ Duas bases distintas. `/api/consulta/v1/orgaos/.../itens` retorna **404** — itens só existem em `/api/pncp`.

---

## 1. Contratações com proposta em aberto — a consulta principal

```
GET /api/consulta/v1/contratacoes/proposta
```

| Parâmetro | Obrigatório | Formato / limites |
|---|---|---|
| `dataFinal` | **sim** | `AAAAMMDD` |
| `codigoModalidadeContratacao` | **sim** | inteiro — ver tabela abaixo |
| `pagina` | **sim** | inteiro, começa em 1 |
| `tamanhoPagina` | não | **mínimo 10, máximo 50** neste endpoint |
| `uf` | não | sigla (`SP`) |
| `codigoMunicipioIbge` | não | código IBGE |
| `cnpj` | não | CNPJ do órgão |
| `codigoUnidadeAdministrativa` | não | |

> ⚠️ **`codigoModalidadeContratacao` é obrigatório.** Não existe "todas as modalidades". O job precisa iterar explicitamente sobre as modalidades de interesse.
>
> ⚠️ **`tamanhoPagina=500` retorna 400** (`"Tamanho de página inválido"`) e `tamanhoPagina=2` retorna 400 (`"must be greater than or equal to 10"`). Neste endpoint o teto real é **50** — diferente do que o manual sugere.

### Envelope de resposta

```jsonc
{
  "data": [ /* contratações */ ],
  "totalRegistros": 604,
  "totalPaginas": 13,
  "numeroPagina": 1,
  "paginasRestantes": 12,
  "empty": false
}
```

### Campos que consumimos

| Campo | Uso no produto |
|---|---|
| `numeroControlePNCP` | Chave natural. Formato `CNPJ-1-SEQUENCIAL/ANO` (ex.: `01572597000101-1-000158/2026`) |
| `orgaoEntidade.cnpj` / `.razaoSocial` | Chave para buscar itens; nome do órgão no e-mail |
| `anoCompra` / `sequencialCompra` | Chave para buscar itens |
| `objetoCompra` | Texto do cabeçalho — entra no casamento |
| `informacaoComplementar` | Texto adicional — entra no casamento com peso menor |
| `valorTotalEstimado` | Filtro pelo teto do assinante; exibido no e-mail |
| `unidadeOrgao.municipioNome` / `.codigoIbge` / `.ufSigla` | Filtro geográfico e texto do e-mail |
| `unidadeOrgao.nomeUnidade` | "para a EMEI Jardim Paulista" no e-mail |
| `dataPublicacaoPncp` | Marco da coleta e cálculo da janela |
| `dataAberturaProposta` / `dataEncerramentoProposta` | **Prazo no e-mail.** Pode haver meses entre publicação e abertura |
| `modalidadeId` / `modalidadeNome` | Interno. **Nunca exibido ao usuário** |
| `situacaoCompraId` / `situacaoCompraNome` | Descartar o que não está `1 — Divulgada no PNCP` |
| `linkSistemaOrigem` | Link do sistema do órgão. Pode vir `"SEM PUBLICAÇÃO"` — tratar |
| `srp` | Registro de preço — muda a natureza do compromisso, sinalizar na trilha |

⚠️ Datas vêm sem offset (`2026-08-13T23:59:00`). Interpretar como `America/Sao_Paulo` na borda e persistir com timezone.

---

## 2. Itens de uma contratação — onde está o que se compra

```
GET /api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens
```

Retorna **array puro** (sem envelope de paginação).

```jsonc
[
  {
    "numeroItem": 1,
    "descricao": "ALFACE CRESPA/LISA/MIMOSA/AMERICANA",
    "materialOuServico": "M",            // M = Material, S = Serviço
    "materialOuServicoNome": "Material",
    "valorUnitarioEstimado": 4.97,
    "valorTotal": 6212.50,
    "quantidade": 1250.0,
    "unidadeMedida": "maco.",
    "itemCategoriaId": 3,
    "criterioJulgamentoNome": "Menor preço",
    "situacaoCompraItemNome": "Em andamento",
    "tipoBeneficio": 5,
    "tipoBeneficioNome": "Não se aplica",
    "orcamentoSigiloso": false,
    "temResultado": false
  }
]
```

### `tipoBeneficio` — o campo mais importante do produto

Valores observados na amostra:

| `tipoBeneficioNome` | Frequência na amostra |
|---|---:|
| Participação exclusiva para ME/EPP | 42% |
| Sem benefício | 36% |
| Não se aplica | 23% |

É daqui que sai a linha **"Exclusivo para micro e pequena empresa"** do e-mail. **Não inferir exclusividade a partir do valor** — o dado existe.

⚠️ Os códigos numéricos completos (1–5) não foram confirmados um a um. Persistir `tipoBeneficio` **e** `tipoBeneficioNome`, e decidir pela string normalizada até confirmar a tabela oficial.

### Custo desta chamada

É um N+1: uma requisição por contratação nova. Com ~1.500 novas/dia no Brasil, são ~1.500 requisições/dia — barato, mas exige concorrência limitada e retry. Ver `coleta-e-jobs.md`.

---

## 3. Arquivos da contratação

```
GET /api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos
```

```jsonc
[{ "url": "...", "titulo": "PNCP.pdf", "tipoDocumentoNome": "Outros Documentos", "statusAtivo": true }]
```

**Não baixar nem anexar PDF ao e-mail.** O e-mail leva link. Anexo aumenta peso, risco de spam e não é lido no celular.

---

## 4. Contratações por data de publicação (alternativa)

```
GET /api/consulta/v1/contratacoes/publicacao
  ?dataInicial=AAAAMMDD&dataFinal=AAAAMMDD&codigoModalidadeContratacao=N&pagina=1
```

Mesmo envelope. Útil para **backfill histórico** e para montar o conjunto rotulado. Não é a consulta do job diário — o job quer o que está aberto agora, não o que foi publicado.

---

## 5. Modalidades

| Código | Nome | Usamos? |
|---|---|---|
| 8 | Dispensa | ✅ v1 — é o degrau de entrada |
| 6 | Pregão — Eletrônico | ✅ v1 — maior volume, mas exige mais estrutura do fornecedor |
| demais | Concorrência, Concurso, Leilão, Diálogo Competitivo, Inexigibilidade… | ❌ fora do escopo |

⚠️ Tabela completa em `codigoModalidadeContratacao` do manual oficial. Confirmar antes de ampliar.

---

## 6. Regras de consumo

| Regra | Motivo |
|---|---|
| Validar toda resposta com Zod antes de persistir | Mudança de contrato precisa falhar alto, não silenciosamente |
| Gravar `bruto` (jsonb) de contratação e item | Reprocessar sem depender de re-consulta. O terceiro pode sumir |
| Nunca inventar endpoint ou campo | Se falta dado, marcar a lacuna e declarar a premissa |
| Backoff exponencial com jitter | Rate limit não documentado — descobrir com educação, não com força |
| `User-Agent` identificável | Ser um consumidor rastreável e educado da API pública |
| Timeout por requisição (≤ 20s) | O job tem orçamento total de 300s |
| Nenhum dado pessoal na query string | Não há dado pessoal aqui, mas a regra vale para todo o projeto |

---

## Referências

- Manual das APIs de Consulta PNCP — `https://www.gov.br/pncp/pt-br/central-de-conteudo/manuais`
- PNCP em Dados Abertos — `https://www.gov.br/pncp/pt-br/acesso-a-informacao/dados-abertos`
- Achados empíricos — `../dados/verificacao-de-viabilidade.md`
