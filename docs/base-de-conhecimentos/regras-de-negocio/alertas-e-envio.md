# Alertas e Envio

> O produto inteiro é este e-mail. Se ele for longo, feio ou errado, não existe produto.
> Critério de aceite do texto: **decidível em trinta segundos, no celular, à noite, cansada.**

---

## Anatomia do e-mail

```
Assunto:  A Prefeitura de Sorocaba quer comprar marmita — prazo até quinta

──────────────────────────────────────────────

A Prefeitura de Sorocaba quer comprar marmita.

400 refeições transportadas por mês, para a EMEI Jardim Paulista.

Vale a pena olhar?
✓ Reservado para micro e pequena empresa
✓ Prazo: faltam 3 dias
✓ Cabe na sua faixa (por volta de R$ 38 mil)

[Se o cofre tem certidão ≤15d:]
Sua CND federal vence em 8 dias. Renove antes de disputar. [Ver certidões]

Prazo para proposta: quinta, 14/08, às 9h — faltam 3 dias.

     [ Ver o edital ]      [ Como enviar minha proposta ]

──────────────────────────────────────────────
Esse aviso chegou porque você vende alimentação em Sorocaba.
Não era pra mim  ·  Mudar o que eu vendo  ·  Parar de receber
```

### De onde vem cada linha

| Linha | Origem |
|---|---|
| "A Prefeitura de Sorocaba" | `orgaoEntidade.razaoSocial` + `unidadeOrgao.municipioNome`, humanizados |
| "quer comprar marmita" | `ramo.rotulo` do casamento — **nunca** `objetoCompra` cru |
| "400 refeições transportadas por mês" | `quantidade` + `unidadeMedida` + `descricao` do item de maior valor |
| "para a EMEI Jardim Paulista" | `unidadeOrgao.nomeUnidade` |
| Bloco "Vale a pena olhar?" | 3 sinais: `tipoBeneficio` (só afirma exclusividade se o dado diz) · prazo em dias · valor × `teto_valor_centavos` do perfil |
| Aviso de certidão | cofre (`certidao`) com vencimento ≤15d ou vencida — amarrado ao alerta |
| "quinta, 14/08, às 9h — faltam 3 dias" | `dataEncerramentoProposta` em `America/Sao_Paulo` |
| "Ver o edital" | `linkSistemaOrigem`, ou a página do PNCP quando vier `"SEM PUBLICAÇÃO"` |
| "porque você vende alimentação em Sorocaba" | `termosCasados` do casamento — a explicação |

---

## Regras de texto

| Regra | Certo | Errado |
|---|---|---|
| Zero jargão | "quer comprar marmita" | "Dispensa Eletrônica nº 127/2026 — modalidade 8" |
| Prazo com dia da semana **e** contagem | "quinta, 14/08, às 9h — faltam 3 dias" | "14/08/2026 09:00" |
| Valor por extenso e arredondado | "por volta de R$ 38 mil no ano" | "R$ 38.412,57" |
| Só afirmar o que o dado sustenta | "Exclusivo para micro e pequena empresa" (com `tipoBeneficio`) | a mesma frase deduzida do valor |
| Sem promessa de resultado | "a gente só avisa; quem manda a proposta é você" | "aumente seu faturamento" |
| Sem anexo | link | PDF do edital anexado |
| Um alerta, um e-mail | | digest com cinco oportunidades misturadas |

**Quando faltar dado:** omitir a linha. Nunca escrever "não informado" — cada linha ausente é uma linha a menos para ler.

**Quando `escala = true`** (casou com `alertaDeEscala`): incluir aviso honesto —
> *"Atenção: esse pedido é para unidades hospitalares. Confira se sua estrutura dá conta antes de participar."*

---

## Assunto

Fórmula: `A {órgão} quer comprar {ramo} — prazo até {dia da semana}`

- Máximo ~60 caracteres para não cortar no celular
- Sem emoji, sem `[ALERTA]`, sem CAPS, sem "urgente", sem "!!!" — vocabulário de spam
- Nunca o mesmo assunto duas vezes seguidas para o mesmo assinante

---

## Deduplicação e volume

| Regra | Implementação |
|---|---|
| Nunca dois e-mails da mesma contratação para a mesma pessoa | `UNIQUE (assinante_id, contratacao_id)` no banco |
| Máximo 5 alertas por assinante por dia | Excedente fica pendente para o dia seguinte |
| Prioridade do excedente | (1) exclusivo ME/EPP · (2) prazo mais curto · (3) score mais alto |
| Nunca alertar com menos de 24h de prazo | Alerta sem tempo de agir é pior que nenhum: gera frustração e ensina a ignorar |

---

## Resumo semanal — sábado

Vai para **todos** os assinantes ativos, inclusive (e principalmente) quem não recebeu nada:

```
Essa semana em Sorocaba

A gente leu 312 compras publicadas na sua região.
Tem 3 compras ainda abertas na sua região; nenhuma do seu ramo dentro
do seu limite. A gente só avisa quando bate — isso é confiança, não silêncio.

Ainda dá tempo:
· Prefeitura de Votorantim — coffee break — prazo até terça
```

Quem não recebeu nada precisa ver que o serviço está vivo. **Silêncio sem explicação é indistinguível de defeito.** Preferir contraste região × ramo a “nada aconteceu”.

---

## Entregabilidade — não é detalhe

| Item | Regra |
|---|---|
| Domínio | Dedicado ao envio, com SPF, DKIM e DMARC configurados **antes do primeiro envio** |
| Aquecimento | Começar com dezenas de e-mails/dia, subir gradualmente |
| Descadastro | Link em todo e-mail, um clique, sem login, sem "tem certeza?" |
| Bounce forte | Webhook do Resend → assinante `suprimido` automaticamente |
| Reclamação de spam | Supressão imediata e permanente. Nunca reenviar |
| Feedback negativo | "Não era pra mim" → `feedback_alerta` → revisão semanal do catálogo |
| Sem imagem pesada | Texto e HTML simples. Imagem em e-mail transacional atrapalha entrega e não é vista |

**Meta operacional:** taxa de reclamação abaixo de 0,1%. Acima disso, parar o envio e revisar o catálogo antes de qualquer coisa.

---

## Trava contra disparo acidental

O envio real só acontece com `NODE_ENV === "production"` **e** `RESEND_MODE === "live"`. Em qualquer outro caso o e-mail renderizado vai para o log estruturado e o alerta é marcado como simulado.

Mandar e-mail de teste para assinante real é o erro mais caro possível neste produto — custa a pessoa e custa o domínio.

---

## Checklist antes de mexer no template

- [ ] Li o texto em voz alta e não tropecei em nenhuma palavra
- [ ] Nenhum termo do portal do governo sobreviveu
- [ ] Toda afirmação tem um campo do PNCP por trás
- [ ] Cabe em uma tela de celular sem rolar até o botão
- [ ] Os dois botões têm rótulo de verbo, não de substantivo
- [ ] O link de descadastro funciona sem login
- [ ] Testado no Gmail app, Gmail web e Outlook
