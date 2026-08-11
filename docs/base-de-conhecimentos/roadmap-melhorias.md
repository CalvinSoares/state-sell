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

- **2.1 — Envio real.** Domínio verificado no Resend (ou `onboarding@resend.dev` para si), teste no Gmail/celular, virar `live`.
- **2.2 — Webhook do Resend.** Bounce/reclamação → suprimir assinante automaticamente. Protege a reputação do domínio.
- **2.3 — `/status` + alarme de coleta parada.** Coleta morta em silêncio parece funcionamento normal — a falha mais perigosa.
- **2.4 — Deep-link no edital.** Montar o link direto da contratação no PNCP quando `linkSistemaOrigem = "SEM PUBLICAÇÃO"`.

## Fase 3 — Cobertura e escala

- **3.1 — Verificar fora do Sudeste** (PA/BA/CE) antes de prometer cobertura nacional.
- **3.2 — Ampliar de 5 para ~15 ramos.**
- **3.3 — CI** rodando testes + gate de precisão a cada push.
- **3.4 — Robustez do `tick`** (N+1 de itens em estado grande pode bater 300s; separar por UF se preciso).

## Fase 4 — Retenção

- **4.1 — Trilha "primeira licitação"** (gov.br, cadastro, certidões, envio da proposta).
- **4.2 — Cofre de certidões** com aviso de vencimento (D-15 e D-3).

## Fase 5 — Receita

- **5.1 — Planos + cobrança** (Pix recorrente / Asaas).
- **5.2 — WhatsApp** (canal onde o público lê; custo por mensagem).

## Higiene contínua

- Reforçar o login admin (hoje só e-mail na allowlist, sem senha/link).
- Rate limit nos endpoints públicos.

---

*Marcações ✔ são atualizadas conforme as fases avançam.*
