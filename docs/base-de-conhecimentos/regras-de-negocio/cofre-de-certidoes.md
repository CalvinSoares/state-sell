# Cofre de Certidões — Fase 3

> Descobrir o edital resolve metade. Esta é a outra metade — e é onde mora a retenção.
> **Status: implementado** — datas + status + lembretes D-15/D-3 + PDF privado (Vercel Blob).

---

## O problema

A Dona Cleide recebeu o alerta, entendeu, quis participar. Aí trava em:

1. Conta gov.br em nível prata ou ouro
2. Cadastro no sistema de compras usado pelo órgão
3. **Certidões negativas em dia**
4. Envio da proposta na sessão eletrônica

O item 3 é o que derruba proposta no último minuto: **certidão vencida desclassifica na hora**, e todas vencem em poucos meses. A pessoa descobre isso quando já é tarde.

---

## O que o cofre faz

| Função | Detalhe |
|---|---|
| Guardar o arquivo | Upload de PDF por tipo de certidão |
| Registrar validade | Data de vencimento informada no upload |
| **Avisar antes de vencer** | Lembrete em **D-15** e **D-3** |
| Mostrar situação | Um painel com verde / amarelo / vermelho por certidão |
| Ensinar a renovar | Link e passo a passo por tipo |

**O lembrete é o produto aqui.** É trivial de construir e é o motivo pelo qual a pessoa mantém a assinatura em mês sem edital — que é exatamente o mês em que ela cancelaria.

---

## Tipos no v1

| Tipo | Emissor | Validade típica |
|---|---|---|
| CND federal (Receita/PGFN) | Receita Federal | ~6 meses |
| CRF / FGTS | Caixa | ~30 dias |
| CNDT (trabalhista) | Justiça do Trabalho | ~6 meses |
| Certidão municipal | Prefeitura da sede | varia |
| Certidão estadual | Secretaria da Fazenda | varia |

⚠️ **Prazos variam e mudam.** Não hardcodar validade — a pessoa informa a data de vencimento que está no documento. O sistema não presume, e nunca calcula validade sozinho.

---

## Regras

| Regra | Motivo |
|---|---|
| A data de vencimento é informada pelo usuário | Presumir prazo e errar é pior que não ter a funcionalidade |
| Arquivo privado, URL assinada de validade curta | É documento fiscal do CNPJ da pessoa |
| Nunca extrair dado do PDF automaticamente no v1 | OCR errado em documento fiscal gera desclassificação — risco desproporcional ao ganho |
| Excluir certidão apaga o arquivo de verdade | Dado do usuário, não do produto |
| O lembrete não afirma que a certidão está válida | Diz "a data que você informou vence em 15 dias". A verdade está no órgão emissor |
| Nunca emitir certidão pelo usuário | Exigiria credencial do gov.br. Fora de questão |

---

## Trilha "primeira licitação"

Conteúdo estático, em português, sem opinião jurídica:

1. **Conta gov.br** — o que é nível prata e ouro, como subir de nível
2. **Cadastro no sistema de compras** — onde se cadastrar, o que ter em mãos
3. **As certidões** — quais são, onde tirar cada uma, quanto demora
4. **Ler um edital sem se perder** — o que importa: o que compram, quanto, até quando, quem pode
5. **Enviar a proposta** — como funciona a sessão eletrônica, o que acontece depois
6. **Ganhei — e agora?** — assinatura, entrega, nota, recebimento

**Limite duro:** a trilha explica **processo**. Não opina sobre recurso, impugnação, enquadramento tributário ou cabimento. Quando a pergunta for jurídica, a resposta é "isso é caso para contador ou advogado" — e essa fronteira é parte do produto, não uma limitação dele.

---

## Armazenamento

**Vercel Blob (store privado).** Pathname em `certidao.arquivo_chave`; leitura só via
`GET /api/certidoes/[id]/arquivo` com sessão do assinante (`get()` no servidor).
Excluir certidão ou “Tirar PDF” apaga o blob de verdade. Env: na Vercel `BLOB_STORE_ID` (OIDC); no local `BLOB_READ_WRITE_TOKEN`.

## Amarrado ao alerta

Quando um e-mail de alerta (ou lembrete D-1) sai e a pessoa tem certidão com
vencimento em ≤15 dias (ou já vencida pela data informada), o corpo do e-mail
ganha uma linha: *“Renove antes de disputar”* + link para `/certidoes`. O cofre
deixa de ser gaveta.
