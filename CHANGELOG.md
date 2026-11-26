# Histórico de versões

## 0.4.1 · 26/11/2026 · atualização semanal dos horímetros

Pedido no comentário do ITEM 56: enquanto não há integração com a plataforma dos pivôs, um analista atualiza todos os horímetros uma vez por semana.

- Botão "Atualizar horímetros" na aba Pivôs: uma tela com todos os pivôs em operação, a data e quem atualizou; cada valor preenchido vira uma leitura e pivô em branco fica como está.
- Confere cada valor na hora: recusa valor menor que a leitura anterior, mostra as horas e o ritmo por dia, e pede confirmação quando passa de 24 h por dia; mesmo valor na mesma data não duplica.
- Quadro "Horímetros" no topo da aba Pivôs: horímetro, data da atualização, há quantos dias e quem atualizou, mais a última atualização geral. Em amarelo o pivô sem atualização há mais de 7 dias (ajustável em Configurações).
- Data da atualização junto do horímetro no painel do mapa e na Cartilha; coluna "Lançado por" nas leituras e campo de nome no lançamento de um pivô.

## 0.4.0 · 26/11/2026 · cartilha de manutenção

Aprovada por inteiro (itens 55 a 64). Feita sobre o "Plano de manutenção dos PCs" (periodicidades, óleos, pneus) e o "Plano de Manutenção Preventiva Valley" (itens que faltavam, pivô ligado, histórico de ocorrências), com os ajustes pedidos em 26/11.

- Aba Cartilha com 40 tarefas: 31 do pivô (torre central, redutores, rodas e torres, lances e balanço, elétrica) e 9 da casa de bomba.
- Periodicidades: 1.000 h (só horas), trimestral e anual (só calendário) e troca de óleo em 2.000 h ou anual, o que vier primeiro. O semestral do plano virou anual; nenhuma periodicidade da Valley foi usada.
- Pivotflex e junta rotativa como tarefas separadas; nível de óleo dos redutores e aterramento (que saíram do checklist) entraram aqui; aterramento pede a resistência medida (Ω).
- Situação de cada tarefa (Em dia, Próxima, Vencida, Sem registro) por pivô e numa tabela tarefas × pivôs.
- Registrar manutenção no celular: data, horímetro (vira leitura quando é novo), tarefas feitas, valor medido, verificado por, observação e até 3 fotos; também sem sinal.
- Ocorrências e peças substituídas, com quantidade, custo e total por pivô.
- A cor do pivô no mapa passa a ser a pior situação entre as tarefas da Cartilha. Saíram o contador único de 2.000 h e a opção "Preventiva realizada" do horímetro.
- Painel do pivô e tabela de pivôs mostram vencidas, próximas e as tarefas mais urgentes.
- Tarefas editáveis em Configurações (dono e editores).
- PDF da cartilha para imprimir, com caixa "Feito" e campos de horímetro, data e verificado por; Excel com plano, situação por pivô, registros e ocorrências.

## 0.3.2 · 26/11/2026 · limite de 50 coletores

Respostas à aprovação da 0.3.1: itens 51 e 53 aprovados; 52 reprovado com o pedido de aumentar o limite para 50 coletores.

- Limite de coletores por avaliação passou de 30 para 50. Acima de 50 o app avisa e sugere o espaçamento que cobre o pivô com 50.
- Distâncias com casa decimal (espaçamento quebrado, como 7,4 m) aparecem com vírgula na coleta, no gráfico, na leitura do resultado, no PDF e no Excel.
- PDF repete o cabeçalho da tabela de coletores quando ela passa para outra página.

## 0.3.1 · 26/11/2026 · coletores calculados na uniformidade

Pedido de 26/11 sobre o passo 2 da avaliação de uniformidade (itens 51 a 53).

- O número de coletores é calculado pelo comprimento do pivô, pela distância do 1º coletor e pela distância entre coletores (as duas continuam editáveis), com o último coletor a pelo menos 5 m do fim do pivô.
- Mantido o limite de 30 coletores; quando caberiam mais, o app avisa e sugere o espaçamento que cobre o pivô com 30.
- Comprimento vem da carta Senninger (pivôs 01 a 06) ou do novo campo em Pivôs → Editar; sem comprimento, o app pede o número de coletores como antes.
- Margem até o fim do pivô configurável em Configurações (padrão 5 m).
- Avaliação guarda o comprimento do pivô; Dados da avaliação e Excel mostram a distância do último coletor até o fim.

## 0.3.0 · 25/11/2026 · mapa de aspersores

Aprovada por inteiro (itens 41 a 50).

- Aba Aspersores, só de consulta: bocal (nº e mm), cor, regulador e emissor de cada saída, para os pivôs 01 a 06.
- Busca principal por vão e saída do vão (como a folha de instalação), com "Vão 3 · Saída 13" em destaque; também pela saída contando do centro ou pelo nº do aspersor.
- Saídas tampadas, balanço, desenho do pivô, lista por vão e quantidade de cada bocal.
- Correção de uma saída por dono e editores, guardando a carta original.
- Dados extraídos das cartas Senninger e conferidos com a lista de materiais e a folha de instalação de cada uma.
- Botão Aspersores no painel do pivô.

## 0.2.1 · 24/11/2026 · ajustes do checklist

Respostas à aprovação da 0.2.0: itens 18 a 20, 22 a 26 e 28 a 34 aprovados; 21, 27 e 35 reprovados.

- Item da válvula: "Verificar funcionamento da válvula de limpeza".
- Percentímetro saiu; só a pressão na base pede valor.
- Horímetro saiu da inspeção. O Checklist mostra a última leitura do pivô até a data da inspeção; a fonte das leituras (plataforma de gerenciamento de irrigação) ainda será definida.
- Lembrete de pivô sem leitura há mais de 7 dias retirado.

## 0.2.0 · 24/11/2026 · checklist

Feita sobre a inspeção de pivô central da Mitti, com os ajustes pedidos em 24/11.

- Aba Checklist e inspeção no celular: 14 itens rápidos e visuais em 4 seções, Conforme / Não conforme / N/A, valor medido na pressão da base e no percentímetro.
- Saíram da lista da Mitti: nível de óleo dos redutores e aterramento (vão para a Cartilha), pressão na ponta (fica na Uniformidade), filtros de linha e parada automática. Rodeiros viraram trilhos; canhão final virou válvula de limpeza. Entrou: juntas, cardans e motorredutores.
- Não conforme pede descrição, até 3 fotos, ação e prazo, e abre uma pendência do pivô, resolvida pela aba Checklist.
- 4 itens críticos; com crítico não conforme o app sugere "inapto" e pede justificativa para "apto".
- Resultado sem contar N/A.
- Números com ponto de milhar ("2.968") são lidos como 2.968.
- Mapa marca "⚠ INAPTO"; painel e tabela de pivôs mostram a última inspeção e as pendências.
- PDF e Excel da inspeção.
- Itens do checklist editáveis em Configurações (dono e editores).
- Excluir só aparece para dono e editores; lembrete de pivô sem leitura do horímetro há mais de 7 dias.

## 0.1.0 · 23/11/2026 · etapa 1

Primeira versão funcional, aprovada por inteiro.

- Mapa das áreas RU e JD com pivôs e talhões clicáveis, cor pela situação da preventiva e ajuste de posição, raio e giro.
- Cadastro de pivôs (1 a 6, 9 e 10; os pivôs 7 e 8 entram quando começarem a operar).
- Horímetro e preventiva: lançamento, "Preventiva realizada", status Em dia, Próxima e Vencida, data prevista da próxima.
- Avaliação de uniformidade no celular em 4 passos, até 30 coletores, distância somada por coletor, foto do frasco, coletor perdido, rascunho salvo no aparelho e envio posterior sem sinal.
- Horário, pressão final do pivô, vento (aviso acima de 4,5 m/s) e velocidade da última torre em cada avaliação.
- Assinatura do responsável com o dedo.
- CUC de Heermann e Hein, Christiansen simples, CUD ponderado, coeficiente de variação e faixa de ±15% sobre a lâmina recomendada.
- Aba Uniformidade com resultados, gráficos, histórico e leitura do resultado.
- Exportação em PDF e Excel.
- Modo escuro, claro e automático.
