# Planos e Cobrança — Fase 4

> **Status: planejado, não implementado.** O v1 é inteiramente gratuito e sem cartão.

---

## A conta que o usuário faz

Assinatura de R$25/mês = R$300 no ano. Um contrato ganho de R$38 mil paga a assinatura por mais de cem anos.

Ninguém precisa ser convencido com gráfico. **O primeiro e-mail que faz sentido é o argumento de venda** — a pessoa lê e pensa "isso acontece desde sempre e eu nunca soube?".

Por isso a ordem é: entregar valor primeiro, cobrar depois. Cartão no cadastro mataria o produto.

---

## Planos

| | Grátis | Pago — R$19 a R$29/mês |
|---|---|---|
| Ramos | 1 | Vários |
| Região | 1 município | Estado inteiro ou lista de municípios |
| Alertas por e-mail | ✅ | ✅ |
| Resumo semanal | ✅ | ✅ |
| Histórico no painel | 30 dias | Completo |
| Cofre de certidões | ❌ | ✅ |
| WhatsApp | ❌ | ✅ |
| Trilha "primeira licitação" | ✅ | ✅ |

**A trilha fica no grátis de propósito.** É o que faz a pessoa conseguir participar da primeira vez — e quem participa uma vez entende para que serve o pago.

---

## Meio de pagamento

Avaliar **Asaas** contra **Stripe** no início da Fase 4. Critérios, nesta ordem:

1. **Pix recorrente / assinatura via Pix** — o público é MEI brasileiro; cartão de crédito é barreira real
2. Taxa sobre ticket baixo (R$19–29) — percentual fixo mínimo pesa muito nessa faixa
3. Cobrança por boleto como alternativa
4. Facilidade de cancelamento sem contato humano

Não decidir agora. A escolha depende de qual meio os primeiros 100 assinantes efetivamente usam.

---

## Regras de cobrança

| Regra | Motivo |
|---|---|
| Cancelamento em um clique, sem falar com ninguém | Retenção por atrito é como se perde reputação |
| Ao cancelar, a conta vira grátis — não é apagada | A pessoa volta quando aparecer edital |
| Sem cobrança retroativa e sem multa | |
| Aviso antes de cada renovação | |
| Falha de pagamento não corta na hora | Rebaixa para o grátis depois de tentativas e aviso |
| Nunca guardar dado de cartão | O provedor guarda. O produto guarda o id da assinatura |

---

## WhatsApp — a decisão que muda o custo

É onde esse público realmente lê. Mas a API oficial cobra por mensagem, o que transforma um custo fixo próximo de zero em custo variável por assinante.

**Só entra depois de receita**, e só no plano pago. Antes disso, o e-mail já entrega o produto.

⚠️ Regras de janela de conversa e template aprovado da API oficial mudam com frequência. Confirmar o vigente antes de desenhar o fluxo — não planejar em cima de memória.

---

## O que nunca fazer

```
✘ Pedir cartão antes de a pessoa receber o primeiro alerta útil
✘ Prometer contrato, faturamento ou "ROI garantido"
✘ Cobrar por alerta ou por sucesso — o produto é aviso, não intermediação
✘ Dificultar cancelamento
✘ Cobrar de quem não recebeu nenhum alerta no ciclo
```

A última é uma escolha de produto, não de generosidade: cobrar por um mês silencioso é o gatilho mais óbvio de cancelamento e de reclamação pública que este modelo tem.
