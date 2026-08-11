# Estados de Tela

> Todo componente que busca dado trata os quatro caminhos. Sem exceção.

```tsx
if (isLoading) return <EsqueletoDaLista />;
if (error) return <MensagemDeErro erro={error} />;
if (!dados?.length) return <EstadoVazio />;
return <Lista dados={dados} />;
```

---

## Estados obrigatórios

| Estado | Tratamento |
|---|---|
| Carregando | Esqueleto com a forma real do conteúdo. Nunca spinner solto no meio da tela |
| Vazio | Mensagem que **explica o vazio e diz o próximo passo** |
| Erro | Linguagem humana + ação de recuperação. Nunca stack trace, nunca código de erro nu |
| Sucesso | Confirmar só depois da resposta do servidor |
| Desabilitado | Dizer o motivo. Botão cinza sem explicação é bug de UX |

---

## O estado vazio é o mais importante deste produto

A pessoa vai passar **semanas** sem alerta. Isso é normal e esperado — mas parece defeito. O vazio precisa carregar a explicação:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   Nenhum aviso ainda                                 │
│                                                      │
│   A gente já leu 312 compras publicadas em Sorocaba  │
│   desde que você se cadastrou. Nenhuma era de        │
│   alimentação dentro do seu limite.                  │
│                                                      │
│   Isso é normal — algumas semanas passam sem nada.   │
│   Última verificação: hoje às 9h.                    │
│                                                      │
│   [ Ampliar minha região ]  [ Mudar o que eu vendo ] │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Três coisas que ele faz e um vazio genérico não faz:

1. **Prova trabalho** — "já leu 312 compras" mostra que o robô está rodando
2. **Explica o silêncio** — evita a conclusão de que está quebrado
3. **Oferece saída** — ampliar região ou revisar ramo, que é exatamente o que resolve

Nunca escrever "Nenhum resultado encontrado" e parar aí.

---

## Erro

```tsx
// ✘ ERRADO
<p>Error: TRPCClientError: Failed to fetch</p>

// ✔ CERTO
<p>Não conseguimos carregar seus avisos agora.</p>
<p className="text-sm text-muted">Tente de novo em alguns segundos.</p>
<Button onClick={refetch}>Tentar de novo</Button>
```

Erro de servidor nunca expõe detalhe interno. O detalhe vai para o log estruturado, com id de correlação.

---

## Carregando

Esqueleto com a forma do conteúdo real — mesma altura, mesmo número de linhas. Evita salto de layout e faz a espera parecer menor.

Para ação do usuário (submit): botão desabilitado com spinner **dentro dele**, texto mudando para "Salvando…". Nunca bloquear a tela inteira.

---

## Página de status pública (`/status`)

O produto é invisível quando funciona. `/status` é onde ele fica visível:

| Mostra | Fonte |
|---|---|
| Última coleta bem-sucedida, por estado | `execucao_coleta` |
| Quantas compras foram lidas nas últimas 24h | `execucao_coleta.novas` |
| Quantos avisos foram enviados hoje | `alerta` |

Sem número de assinantes, sem métrica de negócio. É prova de vida, não vitrine.
