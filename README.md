# IrrigaManager

App para gestão de pivôs centrais: mapa das áreas com a situação da preventiva, controle de horímetro, checklist de inspeção diária e avaliação de uniformidade de irrigação (CUC e CUD), feitos no celular, no campo.

**Versão 0.2.0 · checklist** (em aprovação; a 0.1.0 foi aprovada em 23/11/2026).

## O que o app faz

- **Mapa** das áreas RU e JD (imagem de satélite), com os pivôs e talhões por cima. Cada pivô fica colorido pela preventiva: Em dia, Próxima, Vencida ou sem dados. Clicar num talhão ou no pivô abre o painel com horas que faltam, data prevista da próxima preventiva e a última uniformidade.
- **Pivôs**: cadastro (nome, fazenda, área do mapa, talhões, lâmina recomendada, em operação) e lançamento do horímetro, com a opção "Preventiva realizada", que zera a contagem.
- **Avaliação de uniformidade no celular**, em 4 passos:
  1. condições: horário, pressão final do pivô (bar), vento (m/s), velocidade da última torre (m/min) e lâmina recomendada;
  2. coletores: distância do 1º coletor, distância entre coletores, número de coletores (até 30) e diâmetro do coletor;
  3. coleta coletor a coletor: a distância soma sozinha, a lâmina aparece ao digitar o volume, foto do frasco com data e hora gravadas na imagem, coletor perdido;
  4. resultado, observações, responsável e assinatura com o dedo.
- **Checklist de inspeção** no celular: inspeção rápida e visual, de frequência quase diária, para liberar o pivô para operar.
  - 14 itens em 4 seções (Estrutura e torres, Hidráulica, Elétrica e comando, Área e segurança), cada um com Conforme, Não conforme ou N/A;
  - valor medido na pressão da base (bar) e no percentímetro (%);
  - não conforme pede o que foi encontrado, até 3 fotos, ação corretiva e prazo, e abre uma pendência do pivô;
  - 4 itens críticos: não conformes, fazem o app sugerir "inapto"; marcar "apto" mesmo assim exige justificativa;
  - horímetro opcional, que entra no controle da preventiva; responsável e assinatura.
- **Aba Checklist**: pendências abertas (com prazo vencido em vermelho e botão Resolver), resultado, itens, assinatura e histórico de inspeções do pivô. O mapa marca o pivô inapto.
- **Aba Uniformidade**: CUC, CUD, lâmina média comparada à recomendada, coeficiente de variação, coletores fora da faixa, gráfico da lâmina por distância, histórico, tabela de avaliações e leitura do resultado.
- **Exportação** em PDF e Excel da avaliação de uniformidade e da inspeção, geradas dentro do próprio app.
- **Modo escuro, claro e automático**. No celular, o menu vai para baixo da tela.

## Como abrir

O app é um único arquivo HTML, sem servidor.

- **Pelo Claude (uso da equipe):** o app publicado como artefato guarda os dados numa base compartilhada, e todos que têm acesso veem os mesmos pivôs, leituras e avaliações. Compartilhe com acesso de Contribuidor para a pessoa poder lançar dados.
- **Direto no navegador (`index.html`):** funciona em **modo local**. Os dados ficam só naquele navegador e o app avisa isso no topo. Serve para testar e para demonstração (por exemplo, no GitHub Pages).

## Cálculos

| Item | Como é calculado |
|---|---|
| Lâmina do coletor (mm) | volume (mL) × 1000 ÷ área da boca do coletor (mm²). Com Ø 72 mm, 33 mL = 8,1 mm |
| CUC (principal) | Heermann e Hein: cada coletor pesa pela distância ao centro do pivô |
| CUC Christiansen | média simples, mostrado ao lado para comparar com a planilha |
| CUD | média ponderada do quarto da área com menor lâmina ÷ média ponderada |
| Faixa aceitável | ±15% sobre a lâmina recomendada |
| Classes | Excelente ≥ 90%, Bom 80 a 90%, Razoável 70 a 80%, Ruim < 70% |
| Vento | acima de 4,5 m/s o app avisa e pede confirmação |
| Preventiva | intervalo de 2.000 h; "Próxima" faltando 100 h ou quando o ritmo de uso indica menos de 30 dias |
| Resultado do checklist | conformes ÷ (conformes + não conformes); N/A fica fora da conta |

Coletores perdidos ou sem leitura ficam fora do cálculo. Os parâmetros e os itens do checklist ficam em **Configurações** e só o dono ou editores do app alteram.

## Estrutura

```
index.html                 app pronto (gerado), abre direto no navegador
src/app.html               código do app (HTML, CSS e JavaScript)
src/icones.html            ícones SVG
src/mapas.json             imagens do mapa e suas dimensões em pixels
assets/                    prints das áreas RU e JD
dados/dados-iniciais.json  os 8 pivôs e os parâmetros iniciais
docs/aprovacao-etapa1.html página de aprovação da etapa 1 (v0.1.0)
docs/aprovacao-v0.2.0.html página de aprovação do checklist
docs/padrao-pagina-aprovacao.md  padrão das páginas de aprovação
tools/build.py             gera index.html (ou dist/ para publicar no Claude)
tools/aprovacao_src.html   fonte da página de aprovação (as imagens entram no lugar de /*SHOTS*/)
tools/testes/t_app.js      teste de ponta a ponta (mapa, horímetro, uniformidade)
tools/testes/t_checklist.js teste de ponta a ponta do checklist
```

## Desenvolvimento

```bash
python3 tools/build.py              # gera index.html
python3 tools/build.py --artefato   # gera dist/irrigamanager-app.html para publicar no Claude
npm install && npm test             # roda o teste (Playwright + Chromium)
```

Edite sempre `src/` e `assets/` e gere de novo; não edite `index.html` à mão.

`t_app.js` abre o app no modo local, lança horímetros, faz uma avaliação completa de 26 coletores com assinatura, confere CUC, CUD e lâmina média contra um cálculo independente e gera o PDF e o Excel.

`t_checklist.js` faz uma inspeção completa no tamanho de celular (respostas, valores, não conformes com foto, apto com justificativa, assinatura), confere resultado, pendências e leitura do horímetro, resolve uma pendência, gera PDF e Excel, testa o rascunho e o editor de itens.

## Dados

Na base compartilhada (artefato do Claude), as coleções são:

| Coleção | Conteúdo |
|---|---|
| `pivos/<id>` | nome, fazenda, área do mapa (1 = RU, 2 = JD), posição `x`, `y`, raio `r`, giro `o`, talhões `q`, lâmina recomendada, ativo |
| `leituras/<id>` | pivô, data, horímetro `h`, `prev` (preventiva realizada), observação |
| `avaliacoes/<id>` | pivô, data, hora, pressão, vento, torre, lâmina recomendada, faixa, `d1`, `ds`, `n`, diâmetro, coletores (`vol`, `perdido`, `foto`), observações, responsável, assinatura, GPS, resultados |
| `fotos/<id>` | foto do frasco, quando não há armazenamento de arquivos disponível |
| `checklists/<id>` | pivô, data, hora, horímetro, itens (seção, texto, crítico, resultado, valor, observação, ação, prazo, fotos), apto, justificativa, observações, responsável, assinatura, GPS |
| `pendencias/<id>` | pivô, inspeção de origem, item, crítico, o que foi encontrado, ação, prazo, fotos, situação (aberta ou resolvida) e quem resolveu |
| `cfg/geral` | parâmetros (só dono e editores gravam) |
| `cfg/checklist` | itens do checklist em uso (só dono e editores gravam) |

## Próxima etapa

Cartilha de manutenção (com o nível de óleo dos redutores e o aterramento, que saíram do checklist), aba Ações (absorvendo as pendências), classes próprias do CUD e importação do histórico da planilha de uniformidade.
