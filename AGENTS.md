# StateSell — instruções para agentes

Avisa o pequeno negócio quando a prefeitura dele quer comprar exatamente o que ele vende.

## Antes de qualquer coisa

1. `PLANEJAMENTO.md` — o plano e a stack
2. `docs/base-de-conhecimentos/contexto-produto.md` — por que o projeto existe
3. `docs/base-de-conhecimentos/regras-sistemicas-ia.md` — invariantes e o que nunca fazer
4. `docs/base-de-conhecimentos/README.md` — índice do resto

## As três regras que resumem o projeto

1. **Precisão acima de cobertura.** Alerta perdido a pessoa não percebe; alerta errado faz ela cancelar. Precisão < 0,95 no conjunto rotulado trava o CI.
2. **Zero jargão em texto visível.** "A prefeitura quer comprar marmita", nunca "Dispensa Eletrônica nº 127/2026".
3. **Nunca inventar campo do PNCP.** O contrato verificado está em `docs/base-de-conhecimentos/backend-contexto/fonte-pncp.md`. Se não está lá, confirmar com chamada real antes de depender.

## Next.js

Esta versão do Next.js tem breaking changes em relação ao que a maioria conhece. Ler o guia relevante em `node_modules/next/dist/docs/` antes de escrever rota, cache, `params` ou Server Action.
