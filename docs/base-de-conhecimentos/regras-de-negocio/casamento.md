# Casamento — o coração técnico

> É aqui que o projeto é ganho ou perdido.
> **Alerta perdido a pessoa não percebe. Alerta errado faz ela cancelar.**
> Toda escolha abaixo é enviesada para precisão, conscientemente.

---

## Contrato

```ts
// src/server/casamento/casar.ts — FUNÇÃO PURA
// sem I/O, sem Date, sem Math.random, sem leitura de env

export type TextoDoItem = {
  descricaoItem: string;      // "ALFACE CRESPA/LISA/MIMOSA/AMERICANA"
  objetoCompra: string;       // "AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS..."
  informacaoComplementar?: string;
  unidadeMedida?: string;
};

export type Casamento = {
  ramo: string;
  score: number;              // 0..1
  termosCasados: string[];    // por que este alerta chegou — vai para o e-mail
  vetado: boolean;
  termosVetados: string[];
  escala: boolean;            // casou, mas exige estrutura grande
};

export function casar(texto: TextoDoItem, ramos: Ramo[]): Casamento[];
```

`termosCasados` não é telemetria — é a **explicação** que sustenta a confiança do produto. Guardar sempre.

---

## Normalização (`normalizar.ts`)

Aplicada **igualmente** ao texto do PNCP e aos termos do catálogo:

1. minúsculas
2. remove diacríticos (`NFD` + remoção de combining marks) — `refeições` → `refeicoes`
3. troca pontuação e `/` por espaço — `CRESPA/LISA` → `crespa lisa`
4. colapsa espaços

Casamento sempre por **limite de palavra**, nunca `includes` cru: `"cabo"` não pode casar dentro de `"cabotagem"`. Termos multi-palavra casam como sequência contígua.

**Teste obrigatório:** todo termo do catálogo é igual à sua própria normalização. Um acento esquecido em `content/ramos/` é um termo morto e silencioso.

---

## Onde o texto entra

| Fonte | Peso | Por quê |
|---|---|---|
| `descricao` do item | **1,0** | É onde está o que se compra de verdade |
| `objetoCompra` do cabeçalho | **0,6** | Dá o contexto que o item sozinho não dá — "ALFACE" só vira merenda pelo cabeçalho |
| `informacaoComplementar` | **0,3** | Frequentemente repete o objeto; sinal fraco |
| `unidadeMedida` | confirmação | Nunca classifica sozinha; só reforça |

A verificação empírica mostrou por que os dois primeiros são necessários juntos: itens vêm ora como nome nu (`BANANA NANICA`), ora como CATMAT com atributos (`Switch quantidade portas: 24, ...`). O cabeçalho desambigua o primeiro caso.

---

## Regra de decisão

```
1. VETO — se qualquer termo de `excluir` aparecer em qualquer fonte:
     vetado = true, score = 0. Encerra. Veto é absoluto e não é ponderado.

2. PONTUAÇÃO
     termoForte em descricaoItem       → +0,60
     termoForte em objetoCompra        → +0,40
     termo comum em descricaoItem      → +0,25
     termo comum em objetoCompra       → +0,15
     unidadeMedida esperada            → +0,05
     score = min(1, soma)

3. LIMIAR
     score ≥ 0,60  → classifica
     score <  0,60 → não classifica (mas grava, para análise de recall)

4. ESCALA
     termo de `alertaDeEscala` presente → escala = true
     não bloqueia, mas rebaixa a prioridade e muda o texto do e-mail

5. AMBIGUIDADE
     se 2+ ramos passam do limiar e a diferença de score < 0,15
     → nenhum alerta. Item ambíguo vai para a fila de revisão do catálogo
```

**Por que o item 5:** ambiguidade não resolvida por regra não deve virar dois e-mails nem um chute. Vira trabalho de catálogo.

---

## Filtros que rodam depois do casamento

Casamento diz *"é deste ramo"*. Estes dizem *"serve para esta pessoa"* — e ficam em `alerta/selecionar.ts`, não em `casar.ts`:

| Filtro | Regra |
|---|---|
| Geográfico | `codigo_ibge` na lista do perfil, ou UF quando o plano permite |
| Teto | `valor_total_estimado ≤ teto_valor_centavos` do assinante |
| Prazo | faltam ≥ 24h para `data_encerramento_proposta` |
| Situação | `situacao_compra_id = 1` (Divulgada no PNCP) |
| Duplicação | `UNIQUE (assinante_id, contratacao_id)` |
| Volume | máximo 5 alertas por assinante por dia |

> **Sobre o teto:** ganhar licitação que você não consegue cumprir gera multa e impedimento de licitar. O teto não é conveniência — é proteção. Nunca "arredondar para cima" para aumentar volume de alerta.

> **Sobre exclusividade ME/EPP:** não é filtro no v1, é **prioridade e informação**. O item traz `tipoBeneficio`; item exclusivo ME/EPP sobe na fila e ganha a linha "Exclusivo para micro e pequena empresa" no e-mail. Não usar valor para inferir exclusividade — o dado existe.

---

## Métricas e o gate do CI

Medidas contra `fixtures/rotulados/`:

| Métrica | Definição | Gate v1 |
|---|---|---|
| **Precisão** | dos que classificamos, quantos estavam certos | **≥ 0,95 — trava o CI** |
| Recall | dos que eram do ramo, quantos pegamos | ≥ 0,60 — só reporta |
| Falso positivo por ramo | absoluto | reportado por ramo no output do teste |

**A assimetria é deliberada.** Precisão é gate porque falso positivo cancela assinatura e queima domínio; recall é relatório porque alerta perdido é invisível para a pessoa. Se um PR sobe recall e derruba precisão abaixo de 0,95, ele não entra.

---

## Ajuste de limiar — protocolo

Mexer em peso ou limiar sem medir é chute. O protocolo:

1. Rodar a suíte e anotar precisão/recall **atuais** por ramo
2. Alterar **um** parâmetro
3. Rodar de novo e comparar item a item, não só o agregado
4. Se a precisão cair, reverter — mesmo com recall melhor
5. Registrar o número novo aqui, com data e motivo

| Data | Parâmetro | De → Para | Precisão | Recall | Motivo |
|---|---|---|---|---|---|
| — | limiar | — → 0,60 | — | — | valor inicial, a calibrar com o primeiro conjunto rotulado |

---

## O que nunca fazer no casamento

```
✘ Chamar banco, HTTP ou ler env dentro de casar()
✘ Usar Date.now() ou Math.random() — quebra reprodutibilidade e teste
✘ includes() sem limite de palavra
✘ Ponderar veto — veto é absoluto
✘ Classificar por valor da contratação ("é barato, deve ser MEI")
✘ Inferir exclusividade ME/EPP a partir do valor — o campo existe
✘ Adicionar termo sem adicionar exemplo no conjunto rotulado
✘ Alterar limiar "no olho" para aumentar volume de alerta
✘ Usar LLM ou embedding no caminho de decisão do v1 (ver ADR-004)
```
