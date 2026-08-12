# Cadastro do Assinante

> Dois minutos, três perguntas, zero jargão.
> Se a Dona Cleide precisar perguntar a alguém o que uma palavra quer dizer, a tela está errada.

---

## As três perguntas

### 1. Onde você atende?

> **"Até onde você consegue entregar ou atender?"**

- Campo de cidade com autocompletar (base IBGE embarcada — sem chamada externa)
- Opções: `Só a minha cidade` · `Minha cidade e as vizinhas` · `O estado inteiro`
- Persistido como lista de `codigo_ibge`, não como texto

**Nunca escrever:** "UF de abrangência", "raio de atuação", "unidade federativa".

### 2. O que você vende?

> **"Escolha o que mais parece com o que você faz."**

Cartões grandes com rótulo e frase de ajuda. Nunca uma lista de códigos.

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  Alimentação / marmitaria    │  │  Gráfica e impressos         │
│  Você prepara e entrega      │  │  Banner, folheto, camiseta   │
│  comida: marmita, coffee     │  │  estampada, adesivo,         │
│  break, merenda, lanche.     │  │  impressão.                  │
└──────────────────────────────┘  └──────────────────────────────┘
```

- Plano grátis: **1 ramo**. Plano pago: vários.
- Campo livre "não achei o meu" → grava o texto. **É a fila de priorização de ramos novos**, não um formulário morto.

**Nunca escrever:** "CATMAT", "categoria do item", "CNAE", "objeto".

### 3. Qual o maior pedido que você dá conta?

> **"Qual o maior contrato que sua estrutura entrega hoje, sem apertar?"**

- Faixas em vez de campo numérico: `até R$ 5 mil` · `até R$ 20 mil` · `até R$ 50 mil` · `acima disso`
- Frase de apoio abaixo do campo, sem tom jurídico:
  > *"Isso serve para não te avisar de coisa grande demais. Ganhar uma licitação que você não consegue cumprir dá multa e pode te impedir de participar das próximas."*

**Nunca escrever:** "teto de contratação", "capacidade operacional declarada".

---

## E-mail

Coletado no início, junto com o nome. É a identidade (login por magic link) **e** o canal do produto. Sem senha.

Confirmação de e-mail é **obrigatória antes do primeiro alerta** — endereço não confirmado é a origem número um de bounce, e bounce queima o domínio de envio.

---

## O que NÃO se pergunta no cadastro

| Campo | Por quê |
|---|---|
| CNPJ | Não precisamos dele para alertar. Pedir é atrito e é dado sensível sem uso |
| Porte da empresa (ME/EPP/MEI) | O teto de valor já resolve o que importa |
| Certidões | Fase 3, e só depois da pessoa ver valor |
| Cartão | Plano grátis primeiro. A pessoa paga depois de receber um alerta que fez sentido |
| Telefone | Só quando WhatsApp existir (Fase 4), e opcional |

---

## Estados da tela

| Estado | Tratamento |
|---|---|
| Enviando | Botão desabilitado com spinner; nunca duplo submit |
| Cidade não encontrada | Sugerir as mais próximas por similaridade; nunca "nenhum resultado" seco |
| E-mail já cadastrado | **Não revelar** que existe. Enviar magic link e dizer "enviamos um link para o seu e-mail" |
| Erro de servidor | Mensagem humana + preservar tudo que foi preenchido |
| Sucesso | Tela de "pronto" explicando **quando** o primeiro alerta pode chegar e que pode demorar dias — expectativa calibrada evita cancelamento na primeira semana |

---

## Depois do cadastro

A tela de sucesso é a única chance de calibrar expectativa. Ela diz, em português:

> **Pronto. Cadastro confirmado.**
>
> Quando sair uma compra na sua região que bata com o que você vende, a gente manda e-mail.
>
> Pode passar uma semana sem nada — às vezes não aparece o que cabe no seu limite. No sábado chega um resumo do que a gente viu, mesmo sem aviso no meio da semana.

Sem promessa de faturamento. Sem "aumente suas vendas". A promessa é **saber**.

---

## Perfil (edição posterior)

Mesma linguagem do cadastro, em `/perfil`. Alterar ramo ou região:

- Não dispara reprocessamento retroativo no v1 — o alerta vale para o que for publicado daqui para frente
- Exceção proposta para a Fase 2: mostrar no painel "o que você teria recebido nos últimos 15 dias com esse perfil". É a melhor demonstração de valor que o produto tem, e usa dado que já está no banco
