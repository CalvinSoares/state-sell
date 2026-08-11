# Base de Conhecimentos — StateSell

> Documentação viva do projeto. Atualizar sempre que evoluírem funcionalidades, contratos ou padrões.

---

## Princípio Fundamental

> **"O produto é um e-mail que chega na hora certa.
> Tudo que não faz esse e-mail ser mais certo, mais rápido ou mais confiável é distração."**

E o corolário, que vale para toda decisão de casamento e de copy:

> **"Alerta perdido a pessoa não percebe. Alerta errado faz ela cancelar.
> Precisão vale mais que cobertura."**

---

## Estrutura

```
base-de-conhecimentos/
├── README.md                         ← este arquivo
│
├── contexto-produto.md               ← ⭐ LEITURA OBRIGATÓRIA — o problema, o usuário, a promessa
├── regras-sistemicas-ia.md           ← ⭐ LEITURA OBRIGATÓRIA — invariantes, metodologia, o que nunca fazer
├── backoffice.md                     ← área interna: rotulagem, assinantes, jobs, diagnóstico
├── 07-padroes-codigo.md              ← checklist de PR
│
├── arquitetura/
│   ├── visao-geral.md                → camadas, fluxo ponta a ponta, ambientes
│   ├── decisoes-adr.md               → decisões registradas (Vercel, Postgres, dicionário vs embedding)
│   └── estrutura-pastas.md           → árvore do projeto e regra de localização
│
├── backend-contexto/
│   ├── fonte-pncp.md                 → contrato real da API (verificado por chamada)
│   └── coleta-e-jobs.md              → cron, cursor, lotes, idempotência
│
├── regras-de-negocio/
│   ├── cadastro-do-assinante.md      → as 3 perguntas, sem jargão
│   ├── catalogo-de-ramos.md          → como escrever um ramo (spec de qualidade)
│   ├── casamento.md                  → o coração técnico: regra de decisão e limiares
│   ├── alertas-e-envio.md            → composição do e-mail, deduplicação, supressão
│   ├── cofre-de-certidoes.md         → Fase 3
│   └── planos-e-cobranca.md          → Fase 4
│
├── frontend/
│   ├── padrao-por-pagina.md          → estrutura obrigatória por feature
│   └── estados-de-tela.md            → loading, empty, error, success
│
├── dados/
│   └── verificacao-de-viabilidade.md → achados empíricos que sustentam o plano
│
└── testes/
    ├── conjunto-rotulado.md          → o ativo mais valioso do projeto
    └── fluxos-criticos.md            → o que não pode quebrar
```

---

## Por Onde Começar

| Precisa de... | Vá para... |
|---|---|
| Entender por que o projeto existe | `contexto-produto.md` |
| Saber o que nunca fazer | `regras-sistemicas-ia.md` |
| Consumir a API do PNCP | `backend-contexto/fonte-pncp.md` |
| Mexer no job de coleta | `backend-contexto/coleta-e-jobs.md` |
| Adicionar ou corrigir um ramo | `regras-de-negocio/catalogo-de-ramos.md` + `testes/conjunto-rotulado.md` |
| Rotular itens / investigar um assinante | `backoffice.md` |
| Mudar limiar de casamento | `regras-de-negocio/casamento.md` |
| Alterar o texto do e-mail | `regras-de-negocio/alertas-e-envio.md` |
| Criar uma page | `frontend/padrao-por-pagina.md` |
| Abrir PR | `07-padroes-codigo.md` |

---

## Regra de Atualização

| Mudou... | Atualizar |
|---|---|
| Contrato ou endpoint do PNCP | `backend-contexto/fonte-pncp.md` |
| Frequência, cursor ou lote da coleta | `backend-contexto/coleta-e-jobs.md` |
| Termos de um ramo | o arquivo do ramo + `testes/conjunto-rotulado.md` |
| Telas ou regras da área interna | `backoffice.md` |
| Limiar, peso ou veto do casamento | `regras-de-negocio/casamento.md` |
| Copy ou estrutura do e-mail | `regras-de-negocio/alertas-e-envio.md` |
| Decisão de infra ou stack | `arquitetura/decisoes-adr.md` (novo ADR, nunca editar ADR aceito) |
| Limite de valor ME/EPP | `src/shared/config/limites.ts` + `regras-de-negocio/casamento.md` |

---

*Mantida por: Calvin Soares*
