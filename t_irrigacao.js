// Teste de ponta a ponta da aba Irrigação aplicada, no modo local (com o histórico embutido no index.html).
// Uso: node tools/testes/t_irrigacao.js   (precisa do Playwright com o Chromium instalado)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const APP = 'file://' + path.resolve(__dirname, '../../index.html');
const SAIDA = path.resolve(__dirname, 'saida');
let falhas = 0;
function confere(nome, ok, extra) { console.log((ok ? 'OK    ' : 'FALHOU ') + nome + (extra != null ? ' · ' + extra : '')); if (!ok) falhas++; }
function dia(n) { const d = new Date(Date.now() + n * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function br(iso) { const p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
const ontem = dia(-1);
const zap = (t, f, tl, s, l, hi, hf, d) => `[${br(d).slice(0, 5)} 08:15] Operador: Informação irrigação pivô.\nTurno:${t}\nFrota: pivô ${f}.\nTalhão: ${tl}\nSentindo:${s}\nLâmina:${l}mm\nHidrômetro inicial${hi ? ': ' + hi : '.'}\nHidrômetro final${hf ? ': ' + hf : '.'}\nData:${br(d)}`;

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 1300, height: 900 }, acceptDownloads: true });
  const pg = await ctx.newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(APP); await pg.waitForTimeout(900);
  const ev = (f, a) => pg.evaluate(f, a);

  // Histórico confere com a TDin da planilha
  const anos = await ev(() => { const im = window.__im; im.derive(); const a = im.agrega(null, d => d.slice(0, 4)); const p = im.agrega(d => d.slice(0, 4) === '2025', (d, k) => k); const c = im.agrega(d => d.slice(0, 4) === '2025', (d, k) => im.sisCb(k)); return { a, p, c }; });
  confere('2023, 2024 e 2025 iguais à TDin (7.540.358 · 6.986.872 · 6.675.098 m³)', Math.round(anos.a['2023']) === 7540358 && Math.round(anos.a['2024']) === 6986872 && Math.round(anos.a['2025']) === 6675098, JSON.stringify(anos.a));
  confere('2025 por pivô: Pivô 01 838.390,7 m³ e Pivô 10 63.240,5 m³ (TDin)', Math.abs(anos.p.P1 - 838390.7) < 0.6 && Math.abs(anos.p.P10 - 63240.5) < 0.6, anos.p.P1 + ' / ' + anos.p.P10);
  confere('2025 CBR03 = P2 + P3 + P4 + Coco Anão + M4 (3.088.831 m³)', Math.round(anos.c.CBR03) === 3088831, Math.round(anos.c.CBR03));
  confere('RU35 conta na CBR05', await ev(() => window.__im.sisCb('RU35') === 'CBR05'));
  const sem = await ev(() => [window.__im.isoSem('2026-09-01'), window.__im.isoSem('2026-09-07'), window.__im.isoSem('2025-12-29')]);
  confere('semana igual à coluna Semana do controle (01/09 = 36, 07/09 = 37; 29/12/2025 = semana 1 de 2026)', sem[0].w === 36 && sem[1].w === 37 && sem[2].w === 1 && sem[2].y === 2026, JSON.stringify(sem));

  // Relatórios
  await pg.click('.rail [data-go="irr"]'); await pg.waitForTimeout(200);
  confere('aba Irrigação abre em Relatórios · Mensal', (await pg.getAttribute('[data-irs="rel"]', 'aria-pressed')) === 'true' && (await pg.getAttribute('[data-irr="mes"]', 'aria-pressed')) === 'true');
  const lin2023 = await pg.textContent('.irt tbody tr:first-child');
  confere('tabela mensal como a TDin (2023 jan 667.136 · total 7.540.358)', lin2023.includes('667.136') && lin2023.includes('7.540.358'), lin2023.slice(0, 120));
  await pg.click('[data-iry="2025"]'); await pg.click('[data-irr="piv"]'); await pg.waitForTimeout(150);
  confere('Por pivô 2025: linha do Pivô 01 com 838.391', (await pg.textContent('.irt')).includes('838.391'));
  confere('áreas desativadas marcadas', (await pg.textContent('.irt')).includes('(desativada)'));
  await pg.click('[data-irr="cb"]'); await pg.waitForTimeout(150);
  const cbt = await pg.textContent('.irt');
  confere('Por casa de bomba 2025: CBR03 com 3.088.831 e lista dos sistemas', cbt.includes('3.088.831') && cbt.includes('Pivô 02, Pivô 03, Pivô 04'), '');
  await pg.click('[data-iry="2026"]'); await pg.click('[data-irr="sem"]'); await pg.waitForTimeout(150);
  confere('Semanal 2026: semana 1 de 29/12 a 04/01', (await pg.textContent('.irt')).includes('29/12 a 04/01'));
  await pg.screenshot({ path: path.join(SAIDA, 'irr-semanal.png'), fullPage: true });
  const [x1] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="irXlsRel"]')]);
  const xp = path.join(SAIDA, 'irr-semanal.xlsx'); await x1.saveAs(xp);
  confere('Excel do relatório semanal', fs.readFileSync(xp).toString('utf8').includes('name="Semanal"'));

  // Apontamentos importados
  await pg.click('[data-irs="apo"]'); await pg.waitForTimeout(150);
  await pg.fill('#irDe', '2026-10-01'); await pg.dispatchEvent('#irDe', 'change'); await pg.fill('#irAte', '2026-10-31'); await pg.dispatchEvent('#irAte', 'change'); await pg.waitForTimeout(200);
  const k1 = await pg.textContent('.k5');
  const out = await ev(() => { const it = window.__im.irrItens().filter(x => x.d.slice(0, 7) === '2026-10'); let c = 0, h = 0, l = 0; it.forEach(x => { if (!x.x) { c += x.c; if (x.b === 'hid') h++; else l++; } }); return { n: it.length, c, h, l, sus: it.filter(x => x.av === 'susp').length, sem: it.filter(x => x.av === 'sem').length }; });
  const fmt = v => Math.round(v).toLocaleString('pt-BR') + ' m³';
  confere('outubro: 562 apontamentos e o consumo somado na tela', k1.includes('562') && k1.includes(fmt(out.c)), fmt(out.c));
  confere('outubro: separa consumo pelo hidrômetro e pela lâmina, e o que conferir', k1.includes('pelo hidrômetro (' + out.h + ')') && k1.includes('pela lâmina (' + out.l + ')') && /Para conferir\s*\d+/.test(k1) && out.sus + out.sem > 0, JSON.stringify(out));
  const regra = await ev(() => { const it = window.__im.irrItens(); const p1 = it.find(x => x.s === 'P1' && x.b === 'hid' && x.d === '2026-10-20'), p5 = it.find(x => x.s === 'P5' && x.d === '2026-10-20'), su = it.find(x => x.s === 'P4' && x.av === 'susp'); return { p1: p1 && [p1.c, (p1.hf - p1.hi) * 10], p5: p5 && [p5.c, p5.l * p5.ar * 10, p5.b], su: su && [su.c, su.cl, Math.round(su.rz)] }; });
  confere('pivô 01: consumo = (final − inicial) × 10', regra.p1 && Math.abs(regra.p1[0] - regra.p1[1]) < 1e-6, JSON.stringify(regra.p1));
  confere('pivô 05 (sem hidrômetro): consumo = lâmina × área × 10', regra.p5 && Math.abs(regra.p5[0] - regra.p5[1]) < 1e-6 && regra.p5[2] === 'lam', JSON.stringify(regra.p5));
  confere('leitura absurda do pivô 04: consumo provisório pela lâmina', regra.su && regra.su[0] === regra.su[1] && regra.su[2] >= 5, JSON.stringify(regra.su));
  const ru = await ev(() => window.__im.irrItens().find(x => x.s === 'RU35' && x.d === '2026-10-31' && x.hi === 346842));
  confere('hidrômetro do RU35 em m³ (fator 1): (346.873 − 346.842) = 31 m³', ru && ru.ch === 31, JSON.stringify(ru && ru.ch));
  await pg.click('[data-irp="tudo"]'); await pg.waitForTimeout(250);
  const semLam = await ev(() => window.__im.irrItens().filter(x => x.s === 'RU35' && x.l == null).map(x => x.b));
  confere('nenhum importado fica fora dos totais (RU35 sem lâmina usa o hidrômetro)', /A corrigir\s*0sem/.test(await pg.textContent('.k5')) && semLam.length >= 9 && semLam.every(b => b === 'hid'), semLam.length + ' sem lâmina');
  const p6 = await ev(() => window.__im.irrItens().filter(x => x.d === '2026-10-14' && x.tl === 'JD08' && x.nota));
  confere('apontamento do "pivô 8" entrou como pivô 6', p6.length === 1 && p6[0].s === 'P6' && /pivô 6/.test(p6[0].nota) && !(await ev(() => window.__im.irrItens().some(x => x.s === 'P8'))), JSON.stringify(p6[0] && p6[0].s));

  // Lançar colando mensagens do WhatsApp
  await pg.click('[data-irs="lan"]'); await pg.waitForTimeout(150);
  const txt = [zap('B', '05', 'jd02', 'inverso', '9,50', '', '', ontem), zap('A', '02', 'ru40', 'avanço', '10', '55.563', '55.740', ontem), zap('A', '05', 'ru40', 'avanço', '10', '', '', ontem)].join('\n\n');
  await pg.fill('#irZap', txt); await pg.click('[data-act="irLer"]'); await pg.waitForTimeout(200);
  const linhas = await pg.$$('table.irl tbody tr');
  confere('3 mensagens viram 3 linhas', linhas.length === 3, linhas.length);
  const st = await pg.$$eval('table.irl .irst', x => x.map(e => e.textContent));
  confere('talhão de outro pivô fica em vermelho', st[2].includes('RU40 não é do Pivô 05') && st[0] === 'ok' && st[1] === 'ok', st.join(' | '));
  const cons = await pg.$$eval('table.irl tbody tr', x => x.map(e => e.children[8].textContent + ' / ' + e.children[9].textContent));
  confere('pivô 05 sem hidrômetro: 9,5 × 13,73 × 10 = 1.304 m³ pela lâmina', cons[0].startsWith('1.304 m³lâmina'), cons[0]);
  confere('pivô 02 com hidrômetro: (55.740 − 55.563) × 10 = 1.770 m³; pela lâmina daria 1.595 m³ (+11%)', cons[1].startsWith('1.770 m³hidrômetro') && cons[1].includes('1.595 m³') && cons[1].includes('+11,0%'), cons[1]);
  confere('botão salva só as linhas boas', (await pg.textContent('#irOk')) === 'Salvar 2 apontamentos');
  await pg.reload(); await pg.waitForTimeout(800); await pg.click('.rail [data-go="irr"]'); await pg.click('[data-irs="lan"]'); await pg.waitForTimeout(150);
  confere('a lista continua depois de recarregar a página', (await pg.$$('table.irl tbody tr')).length === 3);
  await pg.fill('#irResp', '');
  await pg.click('#irOk'); await pg.waitForTimeout(150);
  confere('pede quem lançou', (await pg.textContent('#toast')).includes('quem lançou'));
  await pg.fill('#irResp', 'Analista do escritório'); await pg.click('#irOk'); await pg.waitForTimeout(400);
  const vivos = await ev(() => Object.values(window.__im.D.irrigacoes));
  const a = vivos.find(x => x.tl === 'JD02'), b = vivos.find(x => x.tl === 'RU40');
  confere('2 apontamentos salvos com consumo, área e origem', vivos.length === 2 && a.c === 1304.35 && a.ar === 13.73 && a.s === 'P5' && a.t === 'B' && a.se === 'Inverso' && a.origem === 'whatsapp' && b.c === 1770 && b.b === 'hid' && b.cl === 1595 && b.hi === 55563 && a.resp === 'Analista do escritório', JSON.stringify(a));
  confere('linha com erro continua na lista para corrigir', (await pg.$$('table.irl tbody tr')).length === 1);
  await pg.selectOption('table.irl select[data-ir$="|s"]', 'P2'); await pg.waitForTimeout(150);
  await pg.selectOption('table.irl select[data-ir$="|tl"]', 'RU41'); await pg.waitForTimeout(100);
  confere('trocar o pivô corrige a linha (pivô 02 sem leitura: avisa que vai pela lâmina)', !(await pg.getAttribute('table.irl tbody tr', 'class')) && (await pg.textContent('table.irl .irst')).includes('sem leitura do hidrômetro'), await pg.textContent('table.irl .irst'));
  await pg.click('[data-act="irDel"]'); await pg.waitForTimeout(100);

  // Repetido e hidrômetro inicial automático
  await pg.fill('#irZap', zap('B', '05', 'jd02', 'inverso', '9,50', '', '', ontem) + '\n\n' + zap('B', '02', 'ru42', 'inverso', '12', '', '55.900', dia(0)));
  await pg.click('[data-act="irLer"]'); await pg.waitForTimeout(200);
  const st2 = await pg.$$eval('table.irl .irst', x => x.map(e => e.textContent));
  confere('mensagem já lançada é recusada', st2[0].includes('já lançado'), st2[0]);
  confere('hidrômetro inicial em branco vem do último final do pivô (55.740)', (await pg.inputValue('table.irl tbody tr:nth-child(2) input[data-ir$="|hi"]')) === '55740');
  await pg.screenshot({ path: path.join(SAIDA, 'irr-lancar.png'), fullPage: true });
  await pg.click('[data-act="irLimpar"]'); await pg.waitForTimeout(100);

  // Editar e excluir
  await pg.click('[data-irs="apo"]'); await pg.click('[data-irp="7"]'); await pg.waitForTimeout(150);
  const idA = await ev(() => Object.keys(window.__im.D.irrigacoes).find(k => window.__im.D.irrigacoes[k].tl === 'JD02'));
  await pg.click(`[data-act="irEdit"][data-id="${idA}"]`); await pg.waitForSelector('#ieL');
  await pg.fill('#ieL', '10'); await pg.click('#ieOk'); await pg.waitForTimeout(200);
  confere('editar a lâmina recalcula o consumo (10 × 13,73 × 10 = 1.373 m³)', await ev(id => window.__im.D.irrigacoes[id].c === 1373 && window.__im.D.irrigacoes[id].l === 10, idA));
  const corr = await ev(() => window.__im.irrItens().find(x => x.s === 'P4' && x.av === 'susp'));
  await pg.fill('#irDe', corr.d); await pg.dispatchEvent('#irDe', 'change'); await pg.fill('#irAte', corr.d); await pg.dispatchEvent('#irAte', 'change'); await pg.waitForTimeout(150);
  confere('leitura suspeita aparece para conferir', (await pg.textContent('table.ira')).includes('leitura suspeita'));
  await pg.click(`[data-act="irEdit"][data-id="${corr.id}"]`); await pg.waitForSelector('#ieHf');
  const novoHf = Math.round(corr.hi + corr.cl / 10);
  await pg.fill('#ieHf', String(novoHf)); await pg.click('#ieOk'); await pg.waitForTimeout(250);
  const corr2 = await ev(id => window.__im.irrItens().find(x => x.id === id), corr.id);
  confere('corrigir a leitura de um importado: o consumo passa a ser o do hidrômetro e mantém a área da época', corr2.b === 'hid' && !corr2.av && corr2.c === (novoHf - corr.hi) * 10 && corr2.ar === corr.ar && corr2.src === 'arq', JSON.stringify({ b: corr2.b, c: corr2.c }));
  await pg.click('[data-irp="7"]'); await pg.waitForTimeout(100);
  await pg.click(`[data-act="irDelApo"][data-id="${idA}"]`); await pg.click(`[data-act="irDelApo"][data-id="${idA}"]`); await pg.waitForTimeout(200);
  confere('excluir apontamento (com confirmação)', await ev(id => !window.__im.D.irrigacoes[id], idA));
  const [x2] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="irXlsApo"]')]);
  const xp2 = path.join(SAIDA, 'irr-apontamentos.xlsx'); await x2.saveAs(xp2);
  const xb2 = fs.readFileSync(xp2).toString('utf8');
  confere('Excel dos apontamentos no modelo do controle', xb2.includes('CONSUMO ÁGUA (m3)') && xb2.includes('LEITURA HID. INICIAL') && xb2.includes('Analista do escritório'));

  // Arquivar mês fechado
  const mesAnt = await ev(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); });
  const antes = await ev(m => { const im = window.__im; im.derive(); return { n: (im.D.irr_arq[m] || { itens: [] }).itens.length, t: im.agrega(null, d => d.slice(0, 7))[m] || 0 }; }, mesAnt);
  await ev(m => Promise.all([window.__im.put('irrigacoes', 'iarq1', { d: m + '-15', t: 'A', s: 'P5', tl: 'JD03', l: 9.5, se: 'Avanço', ar: 14.4, resp: 'Teste', criado: 'x' }), window.__im.put('irrigacoes', 'iarq2', { d: m + '-16', t: 'B', s: 'P2', tl: 'RU41', l: 10, se: 'Inverso', ar: 15.98, hi: 1000, hf: 1160, resp: 'Teste', criado: 'y' }), window.__im.put('irrigacoes', 'iatual', { d: new Date().toISOString().slice(0, 10), t: 'A', s: 'P6', tl: 'JD05', l: 9, se: 'Avanço', ar: 8.27, resp: 'Teste', criado: 'z' })]), mesAnt);
  await pg.click('.rail [data-go="irr"]'); await pg.click('[data-irs="apo"]'); await pg.waitForTimeout(200);
  const btn = `[data-act="irArq"][data-id="${mesAnt}"]`;
  confere('editor vê o mês fechado para arquivar (2 apontamentos)', (await pg.textContent(btn)).includes('(2)'), await pg.textContent(btn));
  const meio = await ev(m => window.__im.agrega(null, d => d.slice(0, 7))[m], mesAnt);
  await pg.click(btn); await pg.waitForTimeout(150); confere('pede confirmação', (await pg.textContent(btn)).startsWith('Confirmar'));
  await pg.click(btn); await pg.waitForTimeout(400);
  const dep = await ev(m => { const im = window.__im; return { n: im.D.irr_arq[m].itens.length, vivos: Object.keys(im.D.irrigacoes).filter(k => k.startsWith('iarq')).length, atual: !!im.D.irrigacoes.iatual, t: im.agrega(null, d => d.slice(0, 7))[m] }; }, mesAnt);
  confere('arquivar junta os 2 no registro do mês, apaga os avulsos e mantém o mês atual', dep.n === antes.n + 2 && dep.vivos === 0 && dep.atual, JSON.stringify(dep));
  confere('totais não mudam ao arquivar (o do hidrômetro também)', Math.abs(dep.t - meio) < 1e-6 && Math.abs(meio - antes.t - (9.5 * 14.4 * 10 + 1600)) < 1e-6, meio + ' / ' + dep.t);
  confere('botão some depois de arquivar', !(await pg.$(btn)));
  await ev(() => window.__im.put('irrigacoes', 'iarq2', { d: '2026-01-01', s: 'P1' }));
  confere('apontamento já arquivado não conta duas vezes', await ev(() => window.__im.irrItens().filter(x => x.id === 'iarq2').length === 1));

  // Painel do mapa e cadastro do pivô
  await pg.click('.rail [data-go="mapa"]'); await pg.waitForTimeout(200); await pg.click('[data-area="2"]'); await pg.waitForSelector('#ovl text[data-p="p05"]');
  await pg.evaluate(() => { document.querySelector('#ovl text[data-p="p05"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await pg.waitForTimeout(150);
  const side = await pg.textContent('.side');
  confere('painel do pivô mostra a irrigação', side.includes('Irrigação') && side.includes('Último apontamento'), side.slice(side.indexOf('Irrigação'), side.indexOf('Irrigação') + 90));
  await pg.click('.rail [data-go="pivos"]'); await pg.click('[data-act="editPivo"][data-id="p10"]'); await pg.waitForSelector('#pAr');
  confere('Pivô 10: RU58 e RU59 com 12 ha, casa de bomba CBR09 e sem hidrômetro', (await pg.inputValue('#pAr')) === '12; 12' && (await pg.inputValue('#pCb')) === 'CBR09' && !(await pg.isChecked('#pHid')), (await pg.inputValue('#pAr')));
  await pg.fill('#pAr', '12'); await pg.click('#pOk'); await pg.waitForTimeout(100);
  confere('recusa número de áreas diferente dos talhões', (await pg.textContent('#pInfo')).includes('uma área para cada talhão'));
  await pg.fill('#pAr', '12; 12,5'); await pg.click('#pOk'); await pg.waitForTimeout(150);
  confere('áreas salvas no pivô e usadas no cálculo', await ev(() => window.__im.D.pivos.p10.areas.RU59 === 12.5 && window.__im.areaTal('P10', 'RU59') === 12.5));

  // Celular: o menu com 8 abas cabe na tela
  await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(150);
  const rail = await pg.$eval('.rail', e => ({ sw: e.scrollWidth, cw: e.clientWidth, n: e.querySelectorAll('button:not([disabled])').length }));
  confere('menu do celular com Irrigação cabe sem rolar', rail.sw <= rail.cw + 1 && rail.n >= 8, JSON.stringify(rail));

  confere('sem erros de script na página', erros.length === 0, erros.join(' | '));
  await nav.close();
  console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})();
