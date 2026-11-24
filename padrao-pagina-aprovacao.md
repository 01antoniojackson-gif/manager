# Padrão das páginas de aprovação

A partir da etapa 2, toda entrega vem com uma página de aprovação neste formato. Exemplo: `docs/aprovacao-v0.2.0.html` (fonte em `tools/aprovacao_src.html`).

## Estrutura

- **Barra fixa no topo** com o nome e a versão (ex.: "IrrigaManager · v0.2.0"), o contador "X de N respondidos" e o botão **Copiar respostas**.
- **Título** com a versão e o tema da entrega, e uma linha dizendo de qual pedido ela veio.
- **Como usar**, em dois ou três tópicos: tocar na imagem para ampliar e alternar entre HOJE e PROPOSTA; as respostas ficam guardadas no aparelho até copiar.
- **Grupos** de itens com um subtítulo.
- **Cada item é um cartão** com:
  - número grande à esquerda (ITEM 1, 2, 3…, numeração contínua entre versões);
  - título e explicação curta, com lista do que muda;
  - perguntas abertas escritas no próprio item ("se preferir X, marque Reprovado e diga");
  - linha **Referência** apontando o teste que cobre o item (ex.: `tools/testes/t_app.js: coleta`);
  - imagens **HOJE × PROPOSTA** lado a lado (celular em pares de até 300 px; PC em duas colunas), ou "Não existe hoje" quando for novo;
  - quando houver animação, uma tira de quadros com os tempos;
  - resposta **Aprovado / Reprovado** em botões grandes e campo **Comentário**.
- **Fim da página**: o que não foi possível provar, e o botão de copiar de novo.
- **Ampliar imagem** em tela cheia, alternando entre HOJE e PROPOSTA ao tocar.

## Visual

- Família visual do modelo de referência: marfim e ouro no Claro, azul-noite e ouro no Escuro.
- Títulos em Fraunces e texto em Source Sans 3.
- Uma coluna, cartões com borda verde quando aprovado e vermelha quando reprovado.

## Texto copiado

Uma linha por item, `ITEM n · título: Aprovado | Reprovado | Sem resposta`, e o comentário logo abaixo quando houver.
