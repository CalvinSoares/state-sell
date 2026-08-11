# Catálogo de Ramos

> O catálogo é **o produto**. O resto é encanamento.
> Um ramo bem escrito leva uma tarde. Um ramo mal escrito faz assinante marcar spam.

---

## O tipo

```ts
// src/shared/types/ramo.ts
export type Ramo = {
  /** identificador estável — nunca renomear depois de publicado */
  slug: string;

  /** como a pessoa vê no cadastro e no e-mail. Português de gente. */
  rotulo: string;

  /** frase curta que aparece no cadastro para desambiguar */
  ajuda: string;

  /** termos que, se aparecerem, contam a favor */
  termos: string[];

  /** termos que sozinhos já bastam para classificar (peso alto) */
  termosFortes?: string[];

  /** se algum aparecer, o item NÃO é deste ramo — veto absoluto */
  excluir: string[];

  /** casa, mas exige estrutura acima de um negócio de uma pessoa */
  alertaDeEscala?: string[];

  /** unidades de medida típicas — sinal fraco de confirmação */
  unidadesEsperadas?: string[];
};
```

---

## Exemplo real

```ts
// content/ramos/alimentacao.ts
import type { Ramo } from "@/src/shared/types/ramo";

export const alimentacao: Ramo = {
  slug: "alimentacao",
  rotulo: "Alimentação / marmitaria",
  ajuda: "Você prepara e entrega comida: marmita, coffee break, merenda, lanche.",

  termosFortes: [
    "refeicao transportada",
    "refeicoes transportadas",
    "quentinha",
    "marmita",
    "alimentacao escolar",
    "generos alimenticios preparados",
    "coffee break",
    "kit lanche",
  ],

  termos: [
    "refeicao",
    "refeicoes",
    "merenda",
    "nutricao escolar",
    "fornecimento de alimentacao",
    "preparo de refeicoes",
    "cardapio",
    "lanche",
    "salgados",
    "bolo",
  ],

  // veto: compra de equipamento e de insumo cru não é serviço de comida pronta
  excluir: [
    "equipamento de cozinha",
    "utensilio",
    "freezer",
    "fogao industrial",
    "camara fria",
    "coifa",
    "balcao termico",
    "louca",
    "talher",
    "manutencao de equipamento",
  ],

  // casa, mas exige estrutura muito acima de MEI
  alertaDeEscala: [
    "unidades hospitalares",
    "presidio",
    "sistema prisional",
    "hospital regional",
  ],

  unidadesEsperadas: ["unidade", "refeicao", "kit", "porcao"],
};
```

> **Termos são escritos já normalizados**: minúsculos, sem acento, sem pontuação. A normalização do texto do PNCP usa exatamente a mesma função (`normalizar.ts`), e há um teste que garante que todo termo do catálogo é igual à sua própria normalização — erro de acento em termo é bug silencioso e caro.

---

## Spec de qualidade — um ramo só entra no catálogo se

- [ ] Tem **pelo menos 5 `termosFortes`** colhidos de descrições reais do PNCP, não inventados
- [ ] Tem **pelo menos 5 `excluir`** — a lista de veto é o que separa catálogo de busca por palavra-chave
- [ ] Tem **no mínimo 20 exemplos rotulados** em `fixtures/rotulados/<slug>.json`, sendo **pelo menos 8 negativos difíceis** (o que quase casa e não é)
- [ ] Passa o gate de precisão da suíte (`metricas.spec.ts`)
- [ ] O `rotulo` e a `ajuda` foram lidos em voz alta e não contêm jargão
- [ ] Nenhum termo com menos de 4 caracteres (`"tv"`, `"pc"` geram ruído — usar a forma por extenso)
- [ ] Nenhum termo que seja subpalavra comum de outro contexto (`"cabo"` casa "cabo eleitoral", "Cabo Frio")

---

## Como escrever um ramo, na prática

1. **Colher, não inventar.** Puxar 200 itens reais do PNCP com uma busca larga e ler.
   ```bash
   curl -s "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=20260701&dataFinal=20260731&codigoModalidadeContratacao=8&uf=SP&pagina=1&tamanhoPagina=50"
   ```
2. **Marcar à mão.** Cada descrição vira uma linha em `fixtures/rotulados/<slug>.json` com o rótulo correto (ou `null`).
3. **Escrever os termos** a partir do que apareceu, não do que você imagina que apareceria.
4. **Escrever os vetos** a partir dos falsos positivos que a primeira versão produzir. Esta etapa não é opcional.
5. **Rodar a suíte** e olhar a matriz de erro item a item.
6. **Iterar até a precisão passar do gate.** Se o recall ficar baixo, tudo bem — publica assim mesmo e melhora depois.

---

## Os 5 ramos do v1

Escolhidos por volume observado no PNCP cruzado com incidência de MEI:

| slug | rótulo | por que entra |
|---|---|---|
| `alimentacao` | Alimentação / marmitaria | Maior volume municipal recorrente (merenda) |
| `informatica` | Informática e equipamentos | Alto volume; descrição CATMAT bem estruturada |
| `grafica` | Gráfica e impressos | Recorrente, valores baixos, muito MEI |
| `limpeza` | Limpeza e higiene | Recorrente e previsível |
| `manutencao-predial` | Pequenos reparos e manutenção | Elétrica, hidráulica, pintura — território de autônomo |

Fase 2 amplia para ~15: costura/uniformes, jardinagem, transporte/fretamento, obra pequena, mobiliário, eventos, brindes, som e iluminação, veterinária, material de escritório.

---

## Evolução do catálogo

| Gatilho | Ação |
|---|---|
| Assinante clica "não era pra mim" | Vira registro em `feedback_alerta`. **Revisão semanal obrigatória** |
| Falso positivo confirmado | Adicionar termo em `excluir` **+ o exemplo em `fixtures` como negativo** — sem o teste, a correção não é permanente |
| Falso negativo relatado | Adicionar termo, checar se não derruba a precisão |
| Qualquer mudança em `content/ramos/` | Incrementar `VERSAO_CATALOGO` → reprocessamento automático na próxima execução de `/api/cron/casar` |

**Regra dura:** nenhuma alteração no catálogo é aceita sem um teste correspondente em `fixtures/rotulados/`. O catálogo e o conjunto rotulado sobem no mesmo commit.
