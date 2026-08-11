# Contexto de Produto — StateSell

> ⭐ Leitura obrigatória. Toda decisão técnica deste projeto se justifica por algo aqui.

---

## O problema, concretamente

Dona Cleide tem marmitaria com CNPJ de MEI em Sorocaba. A escola municipal a três quadras abriu uma dispensa eletrônica para 400 refeições transportadas por mês — R$ 38 mil no ano, prazo de proposta de poucos dias. Ela nunca soube que existiu.

O anúncio era público, obrigatório e centralizado. E completamente inútil na prática: para achar aquele edital ela teria que abrir um portal do governo, entender o que é "modalidade de contratação", garimpar entre centenas de compras irrelevantes do estado inteiro — e repetir isso toda manhã pelo resto da vida. Ela acorda às 4h para cozinhar. Ela não vai fazer isso.

O resultado prático: os mesmos três ou quatro fornecedores de sempre ganham tudo, não por serem melhores, mas por serem os únicos que apareceram.

---

## O fato que quase ninguém sabe

O governo não produz nada. Tudo que uma prefeitura usa, ela compra de empresa privada — e a maior parte do volume é coisa miúda:

- 400 marmitas por mês para a merenda de uma escola
- 2 mil folhetos da campanha de vacinação
- consertar os 12 ar-condicionados do posto de saúde
- 300 camisetas para a olimpíada escolar
- cortar a grama da praça uma vez por mês
- trocar as lâmpadas da escola por LED
- garrafão de água para a Câmara

Por lei ela é obrigada a anunciar publicamente antes de comprar. Esses anúncios ficam num portal público (PNCP), de graça, para qualquer um ler.

---

## O detalhe que faz o mercado existir

Duas regras tornam essa faixa **reservada para quem é pequeno**:

1. **Exclusividade ME/EPP** — a Lei Complementar 123 prevê exclusividade de participação para micro e pequena empresa em contratações de valor baixo. Concorrente grande está proibido de entrar.
2. **Dispensa eletrônica** — a modalidade de compra de valor pequeno: processo curto, poucos documentos, disputa simples. É o degrau de entrada.

Existe uma fatia do mercado que a lei separou para a Dona Cleide — e ela não sabe que existe. Não está escondida atrás de contato ou esperteza. Está publicada, com o nome dela reservado na porta. Só falta avisar.

> **Verificado empiricamente:** a exclusividade não precisa ser inferida a partir do valor. O PNCP expõe `tipoBeneficio` por item, e "Participação exclusiva para ME/EPP" apareceu em 42% dos itens da amostra. Ver `dados/verificacao-de-viabilidade.md`.

> **Cuidado com os números:** os valores de corte mudam por lei e decreto. Nunca hardcodar — `src/shared/config/limites.ts`, uma fonte só, com a norma e a data da última conferência no comentário.

---

## O produto, em uma frase

> Um robô que avisa o pequeno negócio quando o governo da cidade dele quer comprar exatamente o que ele vende.

O produto inteiro é este e-mail chegando na hora certa:

```
A Prefeitura de Sorocaba quer comprar marmita.

400 refeições transportadas por mês, para a EMEI Jardim Paulista.
Valor estimado: R$ 38.400 no ano — dentro do seu limite.
Exclusivo para micro e pequena empresa.
Prazo para proposta: quinta, 14/08, às 9h — faltam 3 dias.

[Ver o edital]   [Como enviar minha proposta]
```

Nada de PDF anexo. Nada de "modalidade 8 — dispensa". Nada de "código CATMAT".

---

## O caso ponta a ponta

| Quando | O que acontece |
|---|---|
| Segunda, 9h12 | A secretaria de educação de Sorocaba publica no PNCP: refeição transportada, 400/mês, prazo até quinta às 9h, exclusivo ME/EPP |
| Segunda, 11h00 | O job acorda, lê tudo publicado em SP desde a última execução, e encontra esse anúncio entre outros 340 |
| Segunda, 11h01 | Lê a descrição do item, reconhece como alimentação, cruza com os assinantes: quem vende comida, atende Sorocaba, aguenta esse tamanho. A Dona Cleide bate nos três |
| Segunda, 11h02 | E-mail no celular dela |
| Segunda, 20h | Ela termina o dia, lê, faz a conta (produz 250/dia, cabe), clica em "como enviar minha proposta" |
| Quinta, 9h | Encerra o prazo. Chegaram duas propostas: a dela e a do fornecedor de sempre |

Ela pode ganhar ou não. Mas ela participou — e da próxima vez leva quinze minutos.

**O objetivo é transformar "ela nunca soube" em "ela soube e decidiu".**

---

## Quem é o usuário

| Traço | Consequência de produto |
|---|---|
| Negócio de uma pessoa, MEI ou ME | Não tem departamento comercial, não tem quem "cuide de licitação" |
| Lê no celular, à noite | E-mail curto, decidível em 30 segundos, sem anexo |
| Não conhece o vocabulário do portal | Zero jargão em qualquer texto visível |
| Já foi queimado por promessa de software | Copy conservadora. Nunca prometer faturamento |
| Sensível a preço | R$19–29/mês é o teto. Um contrato ganho paga anos de assinatura |

---

## Por que ainda não existe

Existe — para outra pessoa. Ferramentas de monitoramento de licitação custam R$200–500/mês, são vendidas para empresa média com departamento comercial, mostram cinquenta filtros e falam juridiquês. Ninguém atende negócio de uma pessoa só — não porque é difícil, mas porque o público é considerado pobre demais para valer o esforço.

É exatamente por isso que é uma boa brecha para alguém sozinho entrar.

---

## A única parte tecnicamente difícil

O servidor público não escreve "marmita". Ele escreve:

| O que o órgão escreveu | O que a Dona Cleide chamaria de |
|---|---|
| "Fornecimento de refeições transportadas tipo quentinha, embaladas individualmente" | marmita |
| "Aquisição de gêneros alimentícios preparados" | comida pronta |
| "Prestação de serviço de nutrição escolar" | merenda |

Busca por palavra-chave crua falha nas duas direções: perde "refeições transportadas" e acerta errado em "aquisição de fogão industrial" quando a marmitaria queria comida.

**A solução não é modelo mágico: é vocabulário.** Um catálogo tipado, versionado no repositório e coberto por testes. Ver `regras-de-negocio/catalogo-de-ramos.md` e `regras-de-negocio/casamento.md`.

---

## A segunda metade, que ninguém faz

Descobrir o edital resolve metade. A Dona Cleide ainda trava em: conta gov.br em nível prata ou ouro, cadastro no sistema de compras, certidões negativas, envio da proposta em sessão eletrônica.

É aqui que mora a retenção, e é barato de construir:

- **Trilha "primeira licitação"** — passo a passo em português, o que fazer e onde clicar
- **Cofre de certidões com aviso de vencimento** — CND federal, FGTS, trabalhista, municipal. Todas vencem em poucos meses e certidão vencida desclassifica na hora. Um lembrete quinze dias antes é trivial de fazer e é o motivo pelo qual a pessoa mantém a assinatura mesmo em mês sem edital

**Essa segunda metade é o que separa "mais um agregador de editais" de um produto que a pessoa usa.**

---

## Riscos que definem o desenho

| Risco | O que ele impõe ao código |
|---|---|
| **Falso positivo é o inimigo** | Três alertas errados → spam → perde-se a assinante e a reputação do domínio. Precisão trava o CI, não é métrica de vaidade |
| A promessa é achar, não ganhar | Copy revisada contra promessa de faturamento |
| Não somos consultoria jurídica | Trilha explica processo. Não opinar sobre recurso ou impugnação |
| O dado depende de terceiro | Guardar o bruto de tudo. Nunca depender de re-consulta para reprocessar |
