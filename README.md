# IrrigaManager

App para gestão de pivôs centrais: mapa das áreas com a situação da preventiva, controle de horímetro e avaliação de uniformidade de irrigação (CUC e CUD) feita no celular, no campo.

**Versão 0.1.0 · etapa 1** (aprovada em 23/11/2026).

## O que o app faz

- **Mapa** das áreas RU e JD (imagem de satélite), com os pivôs e talhões por cima. Cada pivô fica colorido pela preventiva: Em dia, Próxima, Vencida ou sem dados. Clicar num talhão ou no pivô abre o painel com horas que faltam, data prevista da próxima preventiva e a última uniformidade.
- **Pivôs**: cadastro (nome, fazenda, área do mapa, talhões, lâmina recomendada, em operação) e lançamento do horímetro, com a opção "Preventiva realizada", que zera a contagem.
- **Avaliação de uniformidade no celular**, em 4 passos:
  1. condições: horário, pressão final do pivô (bar), vento (m/s), velocidade da última torre (m/min) e lâmina recomendada;
  2. coletores: distância do 1º coletor, distância entre coletores, número de coletores (até 30) e diâmetro do coletor;
  3. coleta coletor a coletor: a distância soma sozinha, a lâmina aparece ao digitar o volume, foto do frasco com data e hora gravadas na imagem, coletor perdido;
  4. resultado, observações, responsável e assinatura com o dedo.
- **Aba Uniformidade**: CUC, CUD, lâmina média comparada à recomendada, coeficiente de variação, coletores fora da faixa, gráfico da lâmina por distância, histórico, tabela de avaliações e leitura do resultado.
- **Exportação** em PDF (2 páginas) e Excel (abas Avaliação, Coletores e Histórico do pivô), geradas dentro do próprio app.
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

Coletores perdidos ou sem leitura ficam fora do cálculo. Os parâmetros ficam em **Configurações** e só o dono ou editores do app alteram.

## Estrutura

```
index.html                 app pronto (gerado), abre direto no navegador
src/app.html               código do app (HTML, CSS e JavaScript)
src/icones.html            ícones SVG
src/mapas.json             imagens do mapa e suas dimensões em pixels
assets/                    prints das áreas RU e JD
dados/dados-iniciais.json  os 8 pivôs e os parâmetros iniciais
docs/aprovacao-etapa1.html página de aprovação da etapa 1
tools/build.py             gera index.html (ou dist/ para publicar no Claude)
tools/testes/t_app.js      teste de ponta a ponta
```

## Desenvolvimento

```bash
python3 tools/build.py              # gera index.html
python3 tools/build.py --artefato   # gera dist/irrigamanager-app.html para publicar no Claude
npm install && npm test             # roda o teste (Playwright + Chromium)
```

Edite sempre `src/` e `assets/` e gere de novo; não edite `index.html` à mão.

O teste abre o app no modo local, lança horímetros, faz uma avaliação completa de 26 coletores com assinatura, confere CUC, CUD e lâmina média contra um cálculo independente e gera o PDF e o Excel.

## Dados

Na base compartilhada (artefato do Claude), as coleções são:

| Coleção | Conteúdo |
|---|---|
| `pivos/<id>` | nome, fazenda, área do mapa (1 = RU, 2 = JD), posição `x`, `y`, raio `r`, giro `o`, talhões `q`, lâmina recomendada, ativo |
| `leituras/<id>` | pivô, data, horímetro `h`, `prev` (preventiva realizada), observação |
| `avaliacoes/<id>` | pivô, data, hora, pressão, vento, torre, lâmina recomendada, faixa, `d1`, `ds`, `n`, diâmetro, coletores (`vol`, `perdido`, `foto`), observações, responsável, assinatura, GPS, resultados |
| `fotos/<id>` | foto do frasco, quando não há armazenamento de arquivos disponível |
| `cfg/geral` | parâmetros (só dono e editores gravam) |

## Próxima etapa

Checklist e Ações, importação do histórico da planilha de uniformidade e as sugestões aprovadas em `docs/aprovacao-etapa1.html`.
