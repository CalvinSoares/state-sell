# Conjunto Rotulado — o ativo mais valioso do projeto

> Não é a base de código que vale. É esta pasta de descrições reais, marcadas à mão, que diz se o produto funciona.
> Se o repositório pegasse fogo, isto é o que dá mais trabalho para refazer.

---

## O que é

Descrições **reais**, colhidas do PNCP, cada uma marcada à mão com o ramo correto — ou com `null`, quando não é de ramo nenhum.

```
fixtures/rotulados/
├── alimentacao.json          # positivos + negativos difíceis do ramo
├── informatica.json
├── grafica.json
├── limpeza.json
├── manutencao-predial.json
└── negativos.json            # o que não é de nenhum ramo do catálogo
```

> ⚠️ **Estes arquivos são gerados, não editados à mão.** Rotula-se em `/admin/rotular`; o script `pnpm rotulos:sync` lê a tabela `rotulo_manual` e reescreve esta pasta. Ver `../backoffice.md` e ADR-007.
>
> O motivo de o arquivo existir mesmo assim: o CI precisa ser determinístico e offline, e o diff da régua precisa aparecer no PR junto com a mudança de catálogo.

```jsonc
// fixtures/rotulados/alimentacao.json
[
  {
    "descricaoItem": "Fornecimento de refeições transportadas tipo quentinha, embaladas individualmente",
    "objetoCompra": "AQUISIÇÃO DE REFEIÇÕES PRONTAS PARA A REDE MUNICIPAL DE ENSINO",
    "unidadeMedida": "unidade",
    "ramoEsperado": "alimentacao",
    "origem": "01572597000101-1-000158/2026",
    "nota": "caso canônico — é literalmente a marmita da Dona Cleide"
  },
  {
    "descricaoItem": "Fogão industrial 6 bocas com forno, alta pressão",
    "objetoCompra": "AQUISIÇÃO DE EQUIPAMENTOS PARA COZINHA DA ESCOLA MUNICIPAL",
    "ramoEsperado": null,
    "origem": "...",
    "nota": "NEGATIVO DIFÍCIL — cheio de vocabulário de cozinha, é compra de equipamento"
  }
]
```

---

## Por que os negativos valem mais que os positivos

Positivo que falha custa **um alerta perdido** — a pessoa nem percebe.
Negativo que falha custa **um alerta errado** — e três desses fazem a pessoa marcar spam, o que derruba a reputação do domínio de envio e afeta *todos* os assinantes.

Por isso a regra: **para cada ramo, no mínimo 8 negativos difíceis.** Negativo difícil é o que compartilha vocabulário com o ramo e mesmo assim não é dele:

| Ramo | Negativo difícil |
|---|---|
| alimentação | fogão industrial, freezer, câmara fria, utensílio, manutenção de coifa |
| informática | serviço de impressão (é gráfica), tinta para impressora, mobiliário para laboratório |
| gráfica | aquisição de impressora (é informática), papel A4 (é escritório) |
| limpeza | equipamento de lavanderia, contratação de mão de obra terceirizada com dedicação exclusiva |
| manutenção predial | material de construção para obra nova de grande porte |

---

## Como rotular

O material bruto já está no banco: é o que o job de coleta trouxe. Não há colheita separada.

1. Abrir `/admin/rotular` e escolher o ramo
2. A fila vem priorizada: casos perto do limiar, feedback negativo de assinante, itens não classificados e **20% de amostra aleatória**
3. Marcar com atalho de teclado. Itens de texto idêntico são agrupados — marca-se o bloco de uma vez
4. `?` pula o que você não sabe decidir. **Não chutar** — item chutado corrompe a régua
5. `pnpm rotulos:sync` → os arquivos são reescritos → commitar junto com a mudança de catálogo

**Ler e marcar é trabalho humano, e é assim de propósito.** Rótulo gerado por LLM é régua gerada pelo que se quer medir — não mede nada. Por isso a tela tem **modo cego**: ela não mostra o palpite do robô, para o seu rótulo não ser contaminado por ele.

**Meta v1:** ~200 registros por ramo dos cinco iniciais, sendo ao menos 25% negativos. Com a deduplicação por texto, isso costuma sair em 50–70 decisões reais por ramo.

---

## Como o teste usa

```ts
// src/server/casamento/metricas.spec.ts
describe("métricas do casamento", () => {
  for (const ramo of ramos) {
    it(`${ramo.slug}: precisão ≥ 0,95`, () => {
      const { precisao, recall, falsosPositivos } = avaliar(ramo, carregarRotulados(ramo.slug));

      // gate duro
      expect(precisao).toBeGreaterThanOrEqual(0.95);

      // relatório, sem gate — recall baixo é aceito conscientemente
      reportar({ ramo: ramo.slug, precisao, recall, falsosPositivos });
    });
  }
});
```

O output do teste lista **cada falso positivo com o texto original** — não só o número. Sem isso não dá para corrigir o catálogo.

---

## Métricas

| Métrica | Definição | Gate |
|---|---|---|
| Precisão | classificados corretamente ÷ total classificado | **≥ 0,95 — trava o CI** |
| Recall | classificados corretamente ÷ total que era do ramo | ≥ 0,60 — só reporta |
| Falso positivo | classificou como do ramo e não era | listado item a item |
| Falso negativo | era do ramo e não classificou | listado, sem gate |

**A assimetria é a decisão de produto mais importante do repositório.** Não relaxar o gate de precisão para subir volume de alerta.

---

## Ciclo de manutenção — semanal

1. Abrir `/admin/alertas` filtrando por feedback negativo da semana
2. Em cada um, **"transformar em caso de teste"** — o item entra na fila de rotulagem marcado como negativo
3. Ajustar `excluir` do ramo em `content/ramos/` até o teste passar
4. `pnpm rotulos:sync` e incrementar `VERSAO_CATALOGO`
5. Publicar — `/api/cron/casar` reprocessa sozinho na próxima execução

**Sem o passo 2 a correção não é permanente.** Termo adicionado sem teste volta a quebrar no próximo ajuste, e ninguém vai lembrar por que ele estava lá.

---

## Regra de ouro

> Catálogo e conjunto rotulado **sobem no mesmo commit**. Sempre.
