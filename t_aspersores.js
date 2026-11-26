// Teste de ponta a ponta da aba Aspersores (consulta do mapa de aspersores), no modo local.
// Os valores esperados foram lidos à mão das cartas Senninger PC-01, PC-02 e PC-06.
// Uso: node tools/testes/t_aspersores.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const APP = 'file://' + path.resolve(__dirname, '../../index.html');
const SAIDA = path.resolve(__dirname, 'saida');
let falhas = 0;
function confere(nome, ok, extra) { console.log((ok ? 'OK    ' : 'FALHOU ') + nome + (extra != null ? ' · ' + extra : '')); if (!ok) falhas++; }

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const nav = await chromium.launch();
  const pg = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(APP); await pg.waitForTimeout(600);
  const res = async () => (await pg.textContent('#aspRes')) || '';
  const busca = async n => { await pg.fill('#aspQ', String(n)); await pg.waitForTimeout(120); return res(); };

  await pg.click('[data-go="asp"]'); await pg.click('[data-ap="p01"]'); await pg.waitForTimeout(150);
  const topo = await pg.textContent('#main');
  confere('Pivô 01: 133 aspersores, 28 tampadas, 6 torres', topo.includes('133 aspersores') && topo.includes('28 saídas tampadas') && topo.includes('6 torres'));
  confere('pivô sem carta aparece como “sem mapa”', topo.includes('Pivô 09 · sem mapa'));

  // jeito principal: vão e saída do vão
  confere('busca começa por vão', (await pg.getAttribute('[data-aspm="v"]', 'aria-pressed')) === 'true');
  await pg.click('[data-aspv="3"]'); await pg.fill('#aspQ', '13'); await pg.waitForTimeout(120);
  let r = await res();
  confere('vão 3, saída 13 do Pivô 01: bocal 13,5 branco com entalhe; é a saída 64 do centro', r.includes('Vão 3 · Saída 13') && r.includes('Bocal nº 13,5') && r.includes('branco, com entalhe') && r.includes('Saída 64 contando do centro'), r.slice(0, 160));
  await pg.click('[data-aspv="7"]'); await pg.fill('#aspQ', '13'); await pg.waitForTimeout(120);
  r = await res();
  confere('balanço do Pivô 01: saída 13 é o End Spray da ponta', r.includes('Balanço · Saída 13') && r.includes('End Spray'), r.slice(0, 120));
  await pg.fill('#aspQ', '30'); await pg.waitForTimeout(120);
  confere('saída fora do vão avisa o intervalo', (await pg.textContent('#main')).includes('tem saídas de 1 a 14'));

  await pg.click('[data-aspm="g"]'); await pg.waitForTimeout(80);

  r = await busca(24);
  confere('PC-01 saída 24: bocal 12 vermelho, PRL-10, 54,1 m, nº 11', r.includes('nº 12') && r.includes('vermelho') && r.includes('PRL-10') && r.includes('54,1 m') && r.includes('aspersor nº 11'), r.slice(0, 160));
  r = await busca(28);
  confere('PC-01 saída 28: bocal 13,5 branco com entalhe, PSR-10, depois da torre 1', r.includes('13,5') && r.includes('branco, com entalhe') && r.includes('PSR-10') && r.includes('Vão 2'), r.slice(0, 160));
  confere('diâmetro em mm: 13,5/64 pol = 5,36 mm', r.includes('5,36 mm'));
  r = await busca(1);
  confere('PC-01 saída 1: tampada (bujão) a 1,9 m', r.includes('tampada') && r.includes('1,9 m'));
  r = await busca(160);
  confere('PC-01 saída 160: End Spray nº 32 na ponta', r.includes('End Spray') && r.includes('nº 32'));
  await pg.fill('#aspQ', '999'); await pg.waitForTimeout(120);
  confere('saída que não existe avisa o intervalo', (await pg.textContent('#main')).includes('vão de 1 a 161'));
  // busca pela folha de instalação (contagem recomeça depois de cada torre) e pelo nº do aspersor
  await pg.click('[data-aspm="v"]'); await pg.click('[data-aspv="2"]'); await pg.fill('#aspQ', '17'); await pg.waitForTimeout(120);
  r = await res();
  confere('folha de instalação PC-01: vão 2, saída 17 = aspersor nº 21, bocal 16, saída 44 do centro', r.includes('Saída 44') && r.includes('aspersor nº 21') && r.includes('nº 16'), r.slice(0, 120));
  await pg.click('[data-aspm="p"]'); await pg.waitForTimeout(80);
  confere('trocar o modo mantém a mesma saída', (await pg.inputValue('#aspQ')) === '21' && (await res()).includes('Saída 44'));
  await pg.fill('#aspQ', '37'); await pg.waitForTimeout(120);
  confere('aspersor nº 37 é a saída 64', (await res()).includes('Saída 64'));
  await pg.click('[data-aspm="v"]'); await pg.waitForTimeout(80);
  await pg.screenshot({ path: path.join(SAIDA, 'asp_celular.png') });
  await pg.click('[data-aspm="g"]'); await pg.waitForTimeout(80);

  await pg.click('[data-ap="p02"]'); await pg.click('[data-aspm="g"]'); await pg.waitForTimeout(100);
  r = await busca(189);
  confere('PC-02 saída 189: bocal 25 cobre metálico', r.includes('nº 25') && r.includes('cobre metálico'));
  await pg.click('[data-ap="p06"]'); await pg.click('[data-aspm="g"]'); await pg.waitForTimeout(100);
  r = await busca(4);
  confere('PC-06 saída 4: regulador PSR-2-10 e emissor IWob UP3-2', r.includes('PSR-2-10') && r.includes('UP3-2') && r.includes('7,8 m'));

  // lista, tampadas e desenho
  const linhas1 = await pg.$$eval('tr[data-asps]', x => x.length);
  await pg.check('#aspTamp'); await pg.waitForTimeout(120);
  const linhas2 = await pg.$$eval('tr[data-asps]', x => x.length);
  confere('lista mostra 123 aspersores e, marcando, as 25 tampadas', linhas1 === 123 && linhas2 === 148, linhas1 + ' / ' + linhas2);
  await pg.click('tr[data-asps="100"]'); await pg.waitForTimeout(150);
  confere('tocar na linha abre a saída', (await res()).includes('Saída 100'));
  const sv = await pg.$('#aspSvg'); await sv.scrollIntoViewIfNeeded(); const svg = await sv.boundingBox();
  await pg.mouse.click(svg.x + svg.width * 0.98, svg.y + svg.height / 2); await pg.waitForTimeout(150);
  confere('tocar no desenho perto da ponta abre a última saída com aspersor', (await res()).includes('Saída 148'), (await res()).slice(0, 40));

  // resumo de bocais confere com a lista de materiais da carta (PC-01: 8 bocais nº 16,5)
  await pg.click('[data-ap="p01"]'); await pg.waitForTimeout(100);
  const q = await pg.$$eval('.card:last-of-type tbody tr', x => x.map(t => t.textContent));
  confere('PC-01 tem 8 bocais nº 16,5 (lista de materiais)', q.some(t => t.startsWith('16,5') && t.trim().endsWith('8')));

  // correção de uma saída (editor)
  await pg.click('[data-aspm="g"]'); await busca(24); await pg.click('[data-act="aspEdit"]'); await pg.selectOption('#aeB', '12.5'); await pg.fill('#aeO', 'Trocado em campo'); await pg.click('#aeOk'); await pg.waitForTimeout(200);
  r = await busca(24);
  confere('correção guarda o novo bocal e a carta original', r.includes('nº 12,5') && r.includes('na carta: bocal 12') && r.includes('Trocado em campo'));

  // tela grande
  await pg.setViewportSize({ width: 1300, height: 900 }); await busca(64); await pg.waitForTimeout(100);
  await pg.screenshot({ path: path.join(SAIDA, 'asp_pc.png'), fullPage: true });

  confere('sem erros de script na página', erros.length === 0, erros.join(' | '));
  await nav.close();
  console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})();
