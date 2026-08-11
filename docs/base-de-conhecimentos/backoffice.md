# Backoffice

> Área interna em `/admin`, no mesmo app Next. Não é produto — é a bancada de trabalho de quem opera o robô.
> **A tela mais importante é a de rotulagem.** As outras existem para responder perguntas quando algo parece errado.

---

## Acesso

- Mesmo magic link do produto, com allowlist de e-mails em `ADMIN_EMAILS`
- `/admin/*` protegido por middleware — e-mail fora da allowlist recebe **404**, não 403 (não confirmar que a área existe)
- Toda ação que muda estado grava em `log_admin` (quem, o quê, quando)

---

## A decisão que estrutura tudo: onde mora a verdade dos rótulos

O conjunto rotulado é a **régua** que trava o CI. Isso cria uma tensão:

| | Prós | Contras |
|---|---|---|
| Só no banco | Rotular é fácil, dado acumula | CI não roda determinístico; a régua fica invisível no code review; sem histórico de quem mudou o quê |
| Só em arquivo | Determinístico, versionado, revisável em PR | Rotular vira edição de JSON à mão — que é o problema que estamos resolvendo |

**Decisão (ADR-007): rotula no banco, publica em arquivo.**

```
  /admin/rotular ──► tabela rotulo_manual (Postgres)
                            │
                            │  pnpm rotulos:sync   (script local, rodado por você)
                            ▼
                     fixtures/rotulados/*.json   ──► commit ──► CI lê o arquivo
```

O banco é onde você trabalha. O arquivo é o que vale. O teste **nunca** lê o banco — CI que depende de banco de produção é CI que quebra sozinho.

O `sync` roda local, gera o diff dos fixtures, e você commita junto com a mudança de catálogo. O diff no PR mostra exatamente quais rótulos entraram — que é a revisão que importa.

---

## `/admin/rotular` — a tela principal

### Layout

```
┌───────────────────────────────────────────────────────────────────┐
│  Rotular itens                        alimentacao: 47/200 ▓▓▓░░░░ │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ABOBRINHA BRASILEIRA EXTRA IN NATURA, APRESENTANDO BOA           │
│  QUALIDADE, TAMANHO E COLORAÇÃO UNIFORMES                         │
│                                                                   │
│  Objeto:  AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS (HORTIFRUTI) DA       │
│           AGRICULTURA FAMILIAR PARA ALIMENTAÇÃO ESCOLAR           │
│                                                                   │
│  Prefeitura de Salto · R$ 12.400 · 1.250 maço · exclusivo ME/EPP  │
│                                                                   │
│  ⚠ mais 38 itens quase idênticos — rotular o bloco inteiro        │
│                                                                   │
│  [1] alimentação   [2] informática   [3] gráfica   [4] limpeza    │
│  [5] manutenção    [0] nenhum        [?] pular     [N] anotar     │
│                                                                   │
│                                          ← voltar   ver o edital ↗ │
└───────────────────────────────────────────────────────────────────┘
```

### Regras da tela

| Regra | Motivo |
|---|---|
| **Atalho de teclado para cada ramo** (`1`–`9`, `0` = nenhum) | A mão não sai do teclado. É a diferença entre 40 minutos e duas horas |
| **Modo cego por padrão** — não mostra o que o robô achou | Ver a sugestão enviesa o rótulo, e a régua passa a medir a si mesma. Existe um toggle "ver o palpite", desligado por padrão e **registrado no rótulo** |
| **Agrupamento por similaridade** | "ABACATE" aparece em 40 prefeituras. Rotula o bloco de uma vez |
| **`?` pula sem rotular** | Item que você não sabe decidir não pode ser chutado. Vai para a fila "em dúvida" |
| **`N` abre campo de nota** | A nota é o que explica a decisão para você mesmo daqui a seis meses |
| **Desfazer o último** | Errar de tecla é inevitável |
| **Link para o edital real** | Quando o texto não basta, abrir a fonte |
| Progresso por ramo, com a meta de 200 visível | Trabalho sem fim aparente não é terminado |

### Deduplicação — o que torna isso viável

A chave do rótulo é `hash_texto` = hash de `normalizar(descricaoItem + objetoCompra)`.

Consequência: **rotular "ABACATE / gêneros alimentícios agricultura familiar" uma vez vale para todas as prefeituras que publicarem o mesmo texto** — inclusive as futuras. Na prática, 200 itens brutos viram algo em torno de 60 decisões reais.

### Como a fila é priorizada

Rotular na ordem que chegou desperdiça o seu tempo. A fila mistura quatro fontes:

| Fonte | Peso | Por quê |
|---|---|---|
| Score perto do limiar (0,45–0,75) | 40% | É onde a regra está insegura — cada rótulo aqui vale por dez |
| Item que gerou feedback negativo de assinante | 20% | Erro real, com custo já pago |
| Frequente e não classificado por ramo nenhum | 20% | Provável ramo faltando no catálogo |
| **Amostra aleatória** | **20%** | **Não negociável** — ver abaixo |

**Por que a amostra aleatória é obrigatória:** se você só rotula caso difícil, a precisão medida não representa a realidade — ela mede o desempenho no pior cenário possível e some com os casos fáceis, que são a maioria do que a pessoa recebe. Cada rótulo guarda `origem_amostra`, e a suíte reporta a métrica **separada por origem**. A métrica que vale como gate é a da amostra aleatória.

---

## `/admin/assinantes`

Lista com busca. Por assinante:

| Bloco | Conteúdo |
|---|---|
| Perfil | ramos, municípios, teto, plano, status, data de cadastro |
| Entrega | alertas enviados, abertos, clicados; bounces; reclamações |
| Feedback | todo "não era pra mim" com o item que causou |
| **Simulação** | *"o que essa pessoa teria recebido nos últimos 30 dias"* — roda a seleção contra o histórico já coletado |

A simulação é a ferramenta de diagnóstico mais útil do backoffice: responde "por que ela não recebeu nada?" com evidência, em vez de palpite. Usa dado que já está no banco.

**Privacidade:** e-mail parcialmente mascarado na listagem, revelado só ao abrir o registro. Nunca exportar lista de assinantes por botão — se precisar, é query no banco, com intenção deliberada.

---

## `/admin/alertas`

O que foi enviado, com filtro por período, ramo, assinante e status.

| Coluna | Serve para |
|---|---|
| Assinante, contratação, ramo, score | Rastrear a decisão |
| `termosCasados` | **Por que esse alerta chegou** — é a explicação, guardada no casamento |
| Enviado / aberto / clicado | Entrega e interesse |
| Feedback | O sinal que alimenta o catálogo |

Ação disponível: **"transformar em caso de teste"** — pega o item do alerta e joga na fila de rotulagem já marcado como negativo. É o caminho de um clique entre "assinante reclamou" e "o teste garante que não acontece de novo".

---

## `/admin/ramos`

Um cartão por ramo:

- Precisão e recall atuais, **separados por origem da amostra**
- Quantos rótulos existem contra a meta de 200
- Falsos positivos listados **com o texto original** — sem isso não dá para corrigir
- Termos e vetos do arquivo (somente leitura — catálogo se edita no repo, não em produção)
- Itens frequentes que nenhum ramo pegou → sugestão de ramo novo

**Somente leitura, de propósito.** Editar termo em produção sem passar por teste e code review é exatamente como um catálogo apodrece.

---

## `/admin/contratacoes`

Busca livre no que foi coletado: por texto, município, órgão, valor, período, classificação.

Existe para uma pergunta específica: *"o edital X apareceu e ninguém foi avisado — o que aconteceu?"* A tela mostra a cadeia inteira: foi coletado? tem itens? foi classificado? em qual ramo e com qual score? bateu em algum assinante? foi barrado por qual filtro?

---

## `/admin/jobs`

| Mostra | Ação |
|---|---|
| Últimas execuções por job, com contagens e erros | — |
| Cursor atual por `(uf, modalidade)` | Resetar cursor |
| Falhas de validação Zod, com o payload do PNCP | Investigar mudança de contrato |
| — | **Rodar job manualmente** (mesma proteção de `CRON_SECRET`) |

O botão de rodar manual é o que salva quando o cron do plano Hobby atrasa ou o PNCP ficou fora do ar na hora agendada.

---

## Modelo de dados adicional

```
rotulo_manual   id
                hash_texto (UNIQUE)        ← dedup: um rótulo vale para todo texto idêntico
                descricao_item
                objeto_compra
                ramo_esperado (nullable)   ← null = não é de nenhum ramo
                origem_amostra             dirigida | aleatoria | feedback | duvida
                viu_palpite (bool)         ← se o modo cego estava desligado
                nota
                rotulado_por
                rotulado_em

log_admin       id, admin_email, acao, entidade, entidade_id, criado_em
```

---

## Escopo por fase

| Tela | Fase | Por quê |
|---|---|---|
| `/admin/rotular` | **1** | Bloqueia o início do casamento. É a razão do backoffice existir |
| `/admin/jobs` | **1** | Sem isso você não sabe se a coleta está viva |
| `/admin/assinantes` (lista + perfil) | **1** | São dezenas de linhas; a tela é barata |
| `/admin/alertas` | 2 | Só faz sentido com volume enviado |
| `/admin/ramos` | 2 | Enquanto são 5 ramos, o output do teste basta |
| `/admin/contratacoes` | 2 | Diagnóstico fica necessário quando alguém reclama |
| Simulação "o que teria recebido" | 2 | Depende de histórico coletado |

---

## O que o backoffice nunca faz

```
✘ Editar o catálogo de ramos em produção      → é código, passa por PR e teste
✘ Disparar e-mail para assinante real fora do fluxo normal
✘ Alterar rótulo já exportado sem gerar novo sync (a régua tem histórico)
✘ Exportar lista de assinantes por botão
✘ Mostrar o palpite do robô por padrão na rotulagem
✘ Ser a fonte de verdade dos rótulos no CI
```
