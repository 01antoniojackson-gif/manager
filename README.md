# IrrigaManager

App para gestão de pivôs centrais: mapa das áreas com a situação da manutenção, controle de horímetro, irrigação aplicada (consumo de água), cartilha de manutenção preventiva, checklist de inspeção diária e avaliação de uniformidade de irrigação (CUC e CUD), feitos no celular, no campo.

**Versão 0.5.2 · arquivar apontamentos por mês** (0.1.0 aprovada em 23/11/2026; 0.2.0 com ajustes em 24/11/2026; 0.3.0 em 25/11/2026; 0.3.1 a 0.5.1 em 26/11/2026; 0.5.2 em 27/11/2026).

## O que o app faz

- **Mapa** das áreas RU e JD (imagem de satélite), com os pivôs e talhões por cima. Cada pivô fica colorido pela Cartilha de manutenção (a pior situação entre as tarefas): Em dia, Próxima, Vencida ou sem dados. Clicar num talhão ou no pivô abre o painel com as tarefas vencidas e próximas, o horímetro atual e a última uniformidade.
- **Pivôs**: cadastro (nome, fazenda, área do mapa, talhões, lâmina recomendada, em operação) e horímetros; a tabela mostra a situação da manutenção, as tarefas vencidas e as próximas.
- **Horímetros**: atualização semanal de todos os pivôs numa tela só ("Atualizar horímetros"), com data e quem atualizou. O quadro Horímetros mostra o valor, a data, há quantos dias e quem lançou, e destaca em amarelo o pivô sem atualização há mais de 7 dias. Vale até a integração com a plataforma dos pivôs.
- **Avaliação de uniformidade no celular**, em 4 passos:
  1. condições: horário, pressão final do pivô (bar), vento (m/s), velocidade da última torre (m/min) e lâmina recomendada;
  2. coletores: distância do 1º coletor e distância entre coletores; o app calcula quantos coletores cabem (até 50) pelo comprimento do pivô, com o último a pelo menos 5 m do fim; diâmetro do coletor;
  3. coleta coletor a coletor: a distância soma sozinha, a lâmina aparece ao digitar o volume, foto do frasco com data e hora gravadas na imagem, coletor perdido;
  4. resultado, observações, responsável e assinatura com o dedo.
- **Checklist de inspeção** no celular: inspeção rápida e visual, de frequência quase diária, para liberar o pivô para operar.
  - 14 itens em 4 seções (Estrutura e torres, Hidráulica, Elétrica e comando, Área e segurança), cada um com Conforme, Não conforme ou N/A;
  - valor medido na pressão da base (bar);
  - não conforme pede o que foi encontrado, até 3 fotos, ação corretiva e prazo, e abre uma pendência do pivô;
  - 4 itens críticos: não conformes, fazem o app sugerir "inapto"; marcar "apto" mesmo assim exige justificativa;
  - responsável e assinatura. O horímetro não é lançado na inspeção: o Checklist mostra a última leitura do pivô até a data da inspeção.
- **Aba Checklist**: pendências abertas (com prazo vencido em vermelho e botão Resolver), resultado, itens, assinatura e histórico de inspeções do pivô. O mapa marca o pivô inapto.
- **Aba Aspersores** (só consulta): para cada pivô, o bocal (número Senninger e diâmetro em mm), a cor, o regulador de pressão e o emissor de cada saída da tubulação.
  - busca principal por **vão e saída do vão** (a contagem recomeça em 1 depois de cada torre, como na folha de instalação da Senninger), com "Vão 3 · Saída 13" em destaque e o bocal e a cor logo abaixo;
  - também busca pela saída contando do centro ou pelo nº do aspersor na carta;
  - saídas tampadas (bujão), desenho do pivô com as torres e os bocais na cor, lista completa e quantidade de cada bocal;
  - dono e editores podem corrigir uma saída quando o campo for diferente da carta (a carta original fica guardada);
  - dados das cartas Senninger dos pivôs 01 a 06 (`dados/aspersores.json`), conferidos com a lista de materiais e a folha de instalação de cada carta. Pivôs 09 e 10 aguardam as cartas.
- **Irrigação aplicada** (aba Irrigação):
  - **Lançar**, no escritório: cola as mensagens do grupo do WhatsApp ("Informação irrigação pivô…") e o app monta as linhas (turno, pivô, talhão, sentido, lâmina, hidrômetro, data); também dá para lançar direto na tabela. Linha com problema fica em vermelho e não é salva;
  - consumo pelo hidrômetro nos pivôs 01 a 04 ((final − inicial) × 10) e no RU35 (final − inicial); nos pivôs 05, 06, 09 e 10, sem hidrômetro, lâmina × área do talhão × 10. Sem leitura ou com leitura absurda, sai provisório pela lâmina e fica para conferir; casa de bomba e semana saem do pivô e da data;
  - **Apontamentos** com filtro, edição, exclusão e Excel no modelo do controle de lâminas; dono e editores arquivam os meses fechados (um registro por mês) quando quiserem;
  - **Relatórios**: consumo mensal total (como a TDin), por pivô, por casa de bomba, semanal (segunda a domingo) e hidrômetro × lâmina, com gráfico, tabela e Excel;
  - histórico desde 01/01/2023 (BD Volume) e apontamentos desde 01/09/2026 (controle de lâminas), conferidos com a TDin.
- **Cartilha de manutenção**: 40 tarefas preventivas (torre central, redutores, rodas e torres, lances e balanço, elétrica e casa de bomba), juntando o plano de manutenção dos PCs e o plano Valley.
  - periodicidade por horas (1.000 h), por calendário (trimestral, anual) ou pelo que vier primeiro (troca de óleo: 2.000 h ou anual);
  - situação de cada tarefa por pivô (Em dia, Próxima, Vencida, Sem registro) e tabela tarefas × pivôs;
  - registro no celular: data, horímetro, tarefas feitas, resistência do aterramento, verificado por, observação e fotos;
  - ocorrências e peças substituídas com custo e total por pivô;
  - PDF para imprimir e Excel com plano, situação, registros e ocorrências; tarefas editáveis em Configurações.
- **Aba Uniformidade**: CUC, CUD, lâmina média comparada à recomendada, coeficiente de variação, coletores fora da faixa, gráfico da lâmina por distância, histórico, tabela de avaliações e leitura do resultado.
- **Exportação** em PDF e Excel da avaliação de uniformidade, da inspeção e da cartilha, geradas dentro do próprio app.
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
| Nº de coletores | (comprimento − 5 m − distância do 1º) ÷ espaçamento, arredondado para baixo, + 1; no máximo 50 |
| Vento | acima de 4,5 m/s o app avisa e pede confirmação |
| Tarefa da Cartilha | horas desde o último registro = horímetro atual − horímetro do registro; meses pelo calendário; com os dois, vence pelo que vier primeiro. "Próxima" faltando 100 h ou 30 dias (por horas, estimado pelo ritmo de uso) |
| Consumo de irrigação | com hidrômetro (pivôs 01 a 04, RU35): (final − inicial) × 10 nos pivôs, × 1 no RU35; sem hidrômetro (05, 06, 09, 10): lâmina (mm) × área do talhão (ha) × 10 = m³; leitura faltando ou absurda (mais de 5× ou menos de 1/5 da lâmina) → lâmina, marcada para conferir |
| Semana da irrigação | segunda a domingo (ISO), igual à coluna Semana do controle de lâminas |
| Situação do pivô | a pior entre as tarefas (Vencida > Próxima > Em dia); tarefas sem registro não entram |
| Resultado do checklist | conformes ÷ (conformes + não conformes); N/A fica fora da conta |

Coletores perdidos ou sem leitura ficam fora do cálculo. Os parâmetros e os itens do checklist ficam em **Configurações** e só o dono ou editores do app alteram.

## Estrutura

```
index.html                 app pronto (gerado), abre direto no navegador
src/app.html               código do app (HTML, CSS e JavaScript)
src/icones.html            ícones SVG
src/mapas.json             imagens do mapa e suas dimensões em pixels
assets/                    prints das áreas RU e JD
dados/dados-iniciais.json  os 8 pivôs, os parâmetros iniciais e as tarefas da cartilha
dados/aspersores.json      mapas de aspersores dos pivôs 01 a 06 (das cartas Senninger)
dados/irrigacao-historico.json  histórico de consumo (BD Volume, por dia e sistema) e apontamentos importados do controle de lâminas
docs/aprovacao-etapa1.html página de aprovação da etapa 1 (v0.1.0)
docs/aprovacao-v0.2.0.html página de aprovação do checklist
docs/aprovacao-v0.2.1.html página de aprovação dos ajustes do checklist
docs/aprovacao-v0.3.0.html página de aprovação da aba Aspersores
docs/aprovacao-v0.3.1.html página de aprovação dos coletores calculados
docs/aprovacao-v0.3.2.html página de aprovação do limite de 50 coletores
docs/aprovacao-v0.4.0.html página de aprovação da Cartilha de manutenção
docs/aprovacao-v0.4.1.html página de aprovação da atualização dos horímetros
docs/aprovacao-v0.5.0.html página de aprovação da irrigação aplicada
docs/aprovacao-v0.5.1.html página de aprovação do consumo pelo hidrômetro
docs/aprovacao-v0.5.2.html página de aprovação do arquivamento mensal
docs/padrao-pagina-aprovacao.md  padrão das páginas de aprovação
tools/build.py             gera index.html (ou dist/ para publicar no Claude)
tools/aprovacao_src.html   fonte da página de aprovação (as imagens entram no lugar de /*SHOTS*/)
tools/testes/t_app.js      teste de ponta a ponta (mapa, horímetro, uniformidade)
tools/testes/t_checklist.js teste de ponta a ponta do checklist
tools/testes/t_aspersores.js teste da aba Aspersores, com valores lidos das cartas
tools/testes/t_cartilha.js  teste da Cartilha de manutenção (situação, registros, ocorrências, PDF e Excel)
tools/testes/t_horimetros.js teste da atualização semanal dos horímetros
tools/testes/t_irrigacao.js teste da irrigação aplicada (histórico contra a TDin, WhatsApp, relatórios)
```

## Desenvolvimento

```bash
python3 tools/build.py              # gera index.html
python3 tools/build.py --artefato   # gera dist/irrigamanager-app.html para publicar no Claude
npm install && npm test             # roda o teste (Playwright + Chromium)
```

Edite sempre `src/` e `assets/` e gere de novo; não edite `index.html` à mão.

`t_app.js` abre o app no modo local, lança horímetros, confere o cálculo do número de coletores (inclusive o limite de 50), faz uma avaliação completa de 25 coletores com assinatura, confere CUC, CUD e lâmina média contra um cálculo independente e gera o PDF e o Excel.

`t_cartilha.js` confere as 40 tarefas e periodicidades, registra uma revisão completa no celular (com foto e resistência do aterramento), simula o uso do horímetro até cada tarefa ficar Próxima e Vencida, confere mapa, painel, tabela tarefas × pivôs, ocorrências com custo, PDF, Excel, exclusão e o editor.

`t_irrigacao.js` confere o histórico contra a TDin (anos, pivôs e casas de bomba), a semana, os relatórios, lê mensagens do WhatsApp, recusa talhão de outro pivô e repetido, salva, edita, corrige um importado, exclui e gera os Excel.

`t_checklist.js` faz uma inspeção completa no tamanho de celular (respostas, pressão, não conformes com foto, apto com justificativa, assinatura), confere resultado, pendências e o horímetro vindo da última leitura, resolve uma pendência, gera PDF e Excel, testa o rascunho e o editor de itens.

## Dados

Na base compartilhada (artefato do Claude), as coleções são:

| Coleção | Conteúdo |
|---|---|
| `pivos/<id>` | nome, fazenda, área do mapa (1 = RU, 2 = JD), posição `x`, `y`, raio `r`, giro `o`, talhões `q`, áreas dos talhões `areas` (ha; sem elas valem as da planilha), casa de bomba `cb`, tem hidrômetro `hid`, lâmina recomendada, comprimento `comp` (opcional; sem ele vale o da carta), ativo |
| `leituras/<id>` | pivô, data, horímetro `h`, observação, quem lançou `resp`, `lote` (mesma atualização semanal); `prev` só nas leituras antigas da preventiva de 2.000 h |
| `avaliacoes/<id>` | pivô, data, hora, pressão, vento, torre, lâmina recomendada, faixa, `d1`, `ds`, `n`, comprimento do pivô `comp`, margem, diâmetro, coletores (`vol`, `perdido`, `foto`), observações, responsável, assinatura, GPS, resultados |
| `fotos/<id>` | foto do frasco, quando não há armazenamento de arquivos disponível |
| `checklists/<id>` | pivô, data, hora, itens (seção, texto, crítico, resultado, valor, observação, ação, prazo, fotos), apto, justificativa, observações, responsável, assinatura, GPS |
| `pendencias/<id>` | pivô, inspeção de origem, item, crítico, o que foi encontrado, ação, prazo, fotos, situação (aberta ou resolvida) e quem resolveu |
| `cfg/geral` | parâmetros (só dono e editores gravam) |
| `cfg/checklist` | itens do checklist em uso (só dono e editores gravam) |
| `cfg/cartilha` | tarefas da cartilha em uso: seção, texto, horas `h`, meses `m`, pivô ligado `lig`, unidade do valor (só dono e editores gravam; sem ele vale o padrão do app) |
| `manutencoes/<id>` | pivô, data, horímetro `horim`, tarefas feitas (`tarefas` e cópia em `itens`), valores medidos `vals`, verificado por `resp`, observação, fotos |
| `irrigacoes/<id>` | apontamento novo: data `d`, turno `t`, sistema `s` (P1…P10, RU35), talhão `tl`, lâmina `l`, sentido `se`, hidrômetro `hi`/`hf`, área `ar` (guardada: a da época), consumo `c` e base `b` (hidrômetro ou lâmina), consumo pelo hidrômetro `ch` e pela lâmina `cl`, quem lançou, origem (whatsapp/manual); o app recalcula o consumo pela regra do pivô |
| `irr_hist/<AAAA-MM>` | histórico da BD Volume: `dias` → dia → sistema → m³ (só dono e editores gravam) |
| `irr_arq/<AAAA-MM>` | apontamentos importados do controle de lâminas, um documento por mês (`itens`, com o consumo da planilha em `cp` só para consulta; só dono e editores gravam) |
| `ocorrencias/<id>` | pivô, data, componente, ocorrência `desc`, ação corretiva, peças, quantidade, custo (R$), responsável |
| `aspersores/<id do pivô>` | dados da carta (`meta`) e `itens`: torres (`T`), saídas tampadas (`b`) e aspersores (`a`: saída do centro `s`, distância `d`, bocal `b`, regulador `r`, nº do aspersor `p`); a saída do vão é calculada pelas torres; só dono e editores gravam |

## Próxima etapa

Cartas de aspersores dos pivôs 09 e 10, aba Ações (absorvendo as pendências), fonte do horímetro (plataforma de gerenciamento de irrigação, a definir), classes próprias do CUD e importação do histórico da planilha de uniformidade.
