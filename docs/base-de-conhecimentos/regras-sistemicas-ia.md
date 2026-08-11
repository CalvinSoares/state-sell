# Regras Sistêmicas — comportamento obrigatório neste projeto

> ⭐ Leitura obrigatória em toda interação com o código deste repositório.
> Vale para pessoa e para IA.

---

## Prioridades institucionais (sempre nesta ordem)

1. **Precisão do alerta** — falso positivo cancela assinatura e queima domínio
2. **Confiabilidade da coleta** — sem coleta não há produto, e o silêncio parece normal
3. **Clareza para quem lê** — zero jargão em qualquer texto visível
4. **Rastreabilidade** — todo alerta explica por que chegou
5. **Regra de negócio**
6. **Consistência de UX**
7. **Viabilidade técnica**
8. **Estética**

---

## Invariantes que não podem ser quebrados

### Dado

- O `bruto` do PNCP é **sempre** gravado. Reprocessamento nunca depende de re-consulta
- Valor monetário em **centavos**, `bigint`. Nunca `float`, nunca `number` de ponto flutuante
- Data com timezone explícito. O PNCP devolve horário local sem offset — normalizar para `America/Sao_Paulo` na borda
- Toda resposta de terceiro passa por Zod **antes** de tocar o banco. Mudança de contrato falha alto, nunca em silêncio
- `numero_controle_pncp` é a chave natural da contratação. `(contratacao_id, numero_item)` é a do item

### Alerta

- **Um alerta por assinante por contratação.** Garantido por `UNIQUE` no banco, não por checagem em memória
- Nunca alertar com menos de 24h de prazo
- Máximo 5 alertas por assinante por dia
- `enviado_em` gravado na mesma transação do retorno do provedor de e-mail
- Bounce forte ou reclamação → supressão automática e permanente
- **Nunca** enviar e-mail real fora de produção (`RESEND_MODE`)

### Casamento

- `casar()` é **pura**: sem I/O, sem `Date`, sem `Math.random`, sem env
- Veto é absoluto e não é ponderado
- Nenhuma alteração de catálogo entra sem exemplo correspondente em `fixtures/rotulados/`
- Precisão < 0,95 no conjunto rotulado **trava o CI**
- Nunca inferir exclusividade ME/EPP a partir do valor — `tipoBeneficio` existe

### Legal

- Os valores de corte de ME/EPP e de dispensa mudam por lei e decreto. Fonte única: `src/shared/config/limites.ts`, com a norma e a data de conferência no comentário. **Nunca** espalhar constante
- O produto não dá consultoria jurídica. A trilha explica processo; não opina sobre recurso, impugnação ou enquadramento

---

## Metodologia obrigatória antes de codar

### 1. Análise
- Qual etapa do fluxo é afetada: coleta, casamento, seleção, envio, ou interface?
- Onde nasce o dado? PNCP, banco ou catálogo?
- O que já existe e pode ser reaproveitado?

### 2. Reuso
Antes de criar: existe util, hook, componente, schema ou repositório parecido? `src/shared/` e `src/server/db/repositorios/` primeiro.

### 3. Validação de contrato
- O campo do PNCP que você quer usar **existe mesmo**? Confirmar em `backend-contexto/fonte-pncp.md` ou por chamada real
- O que acontece quando ele vier `null`? (`linkSistemaOrigem` vem `"SEM PUBLICAÇÃO"`; `valorTotalHomologado` vem `null`)
- A alteração muda o resultado do casamento? Se sim, a suíte de métricas precisa rodar

### 4. Implementação
- Regra pura em `src/server/casamento/` ou `src/server/alerta/selecionar.ts` — sempre testável sem banco
- I/O isolado em `.action.ts`, `cliente.ts` ou repositório
- `page.tsx` só compõe

### 5. Validação
- Loading, vazio, erro, sucesso
- O job continua idempotente?
- Algum texto visível ao usuário ganhou jargão?

---

## Quando faltar contexto

Não responder genericamente. Deve:
- Explicitar a premissa
- Delimitar o risco
- Apontar a fonte de verdade provável
- **Nunca inventar campo, endpoint ou comportamento do PNCP**

Se o campo não foi verificado, marcar ⚠️ na documentação e verificar com uma chamada real antes de depender dele.

---

## O que nunca fazer

```
✘ Inventar campo ou endpoint do PNCP
✘ Persistir resposta de terceiro sem validar com Zod
✘ Descartar o payload bruto
✘ Enviar e-mail real fora de produção
✘ Enviar alerta sem checar o UNIQUE de deduplicação
✘ Alertar com menos de 24h de prazo
✘ Inferir exclusividade ME/EPP pelo valor
✘ Hardcodar valor de corte legal fora de config/limites.ts
✘ Colocar I/O, Date ou random dentro de casar()
✘ Mudar limiar de casamento sem medir antes e depois
✘ Adicionar termo ao catálogo sem exemplo rotulado
✘ Usar jargão do portal em texto visível ao usuário
✘ Prometer faturamento, contrato ganho ou resultado
✘ Anexar PDF ao e-mail
✘ Opinar sobre matéria jurídica
✘ Logar e-mail, telefone ou qualquer dado pessoal do assinante
✘ console.log em qualquer lugar
```

---

## Formato de resposta para tarefas de feature

1. **Objetivo** — o que muda e por quê
2. **Diagnóstico** — o que existe hoje e o que dá para reaproveitar
3. **Origem do dado** — PNCP, banco ou catálogo; qual campo exatamente
4. **Fluxo** — passo a passo do comportamento
5. **Regras** — negócio, UX e legais envolvidas
6. **Estados** — loading, vazio, erro, sucesso, sem permissão
7. **Riscos** — falso positivo, contrato do terceiro, entregabilidade, timeout
8. **Critérios de aceite** — testáveis
9. **Implementação** — arquivos e testes
10. **Premissas** — o que foi assumido e precisa ser confirmado
