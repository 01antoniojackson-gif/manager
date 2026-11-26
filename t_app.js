// Teste de ponta a ponta do IrrigaManager no modo local (sem o Claude).
// Uso: node tools/testes/t_app.js   (precisa do Playwright com o Chromium instalado)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const APP = 'file://' + path.resolve(__dirname, '../../index.html');
const SAIDA = path.resolve(__dirname, 'saida');
let falhas = 0;
function confere(nome, ok, extra) { console.log((ok ? 'OK    ' : 'FALHOU ') + nome + (extra ? ' · ' + extra : '')); if (!ok) falhas++; }

// Cálculo independente, para conferir o do app.
function calculoIndependente(a) {
  const area = Math.PI * (a.diam / 2) ** 2, pts = [];
  a.col.forEach((c, i) => { if (!c.perdido && c.vol != null) pts.push({ r: a.d1 + i * a.ds, x: c.vol * 1000 / area }); });
  const W = pts.reduce((s, p) => s + p.r, 0), SX = pts.reduce((s, p) => s + p.r * p.x, 0), mw = SX / W;
  const cuh = 100 * (1 - pts.reduce((s, p) => s + p.r * Math.abs(p.x - mw), 0) / SX);
  const ms = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cuc = 100 * (1 - pts.reduce((s, p) => s + Math.abs(p.x - ms), 0) / (pts.length * ms));
  const so = [...pts].sort((p, q) => p.x - q.x); let acc = 0, s = 0; const tg = W / 4;
  for (const p of so) { if (acc >= tg) break; const tk = Math.min(p.r, tg - acc); s += tk * p.x; acc += tk; }
  return { cuh, cuc, cud: 100 * (s / acc) / mw, mean: mw };
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 1300, height: 900 }, acceptDownloads: true });
  const pg = await ctx.newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(APP); await pg.waitForTimeout(600);
  confere('abre no modo local com 8 pivôs', (await pg.evaluate(() => Object.keys(window.__im.D.pivos).length)) === 8);

  // Horímetro e preventiva
  async function horimetro(pid, data, h, prev) {
    await pg.click('[data-act="horimetro"]'); await pg.waitForSelector('#hP');
    await pg.selectOption('#hP', pid); await pg.fill('#hD', data); await pg.fill('#hH', String(h));
    await pg.click('#hOk'); await pg.waitForTimeout(120);
  }
  await pg.click('[data-go="pivos"]');
  await horimetro('p04', '2026-03-01', 1000, true);
  await horimetro('p04', '2026-10-01', 2700);
  await horimetro('p04', '2026-11-20', 2912);
  await horimetro('p03', '2026-01-10', 500, true);
  await horimetro('p03', '2026-11-20', 2564);
  const st = await pg.evaluate(() => { const im = window.__im; im.derive(); const P = Object.keys(im.D.pivos).map(id => Object.assign({ id }, im.D.pivos[id])); const p4 = P.find(p => p.id === 'p04'); return { h: im.horAtual('p04'), sp: im.stPivo(p4) }; });
  confere('horímetro atual do Pivô 04 vem da última leitura', st.h && st.h.h === 2912 && st.h.data === '2026-11-20', JSON.stringify(st.h));
  confere('sem manutenção registrada o pivô fica "Sem registro"', st.sp.st === 'mut' && st.sp.n.mut === st.sp.tot, st.sp.txt);

  // Leitura menor que a anterior é recusada
  await pg.click('[data-act="horimetro"]'); await pg.selectOption('#hP', 'p04'); await pg.fill('#hH', '100'); await pg.click('#hOk');
  confere('recusa horímetro menor que o anterior', (await pg.textContent('#hInfo')).includes('Não bate'));
  await pg.keyboard.press('Escape');

  // Avaliação de uniformidade completa
  await pg.click('[data-go="unif"]'); await pg.click('[data-up="p04"]'); await pg.click('.top [data-act="novaAval"]');
  await pg.waitForSelector('#wPr');
  await pg.fill('#wPr', '1,8'); await pg.fill('#wVt', '2,4'); await pg.fill('#wTw', '3,2');
  await pg.click('[data-w="next"]');
  confere('Pivô 04 com comprimento: nº de coletores não é digitado', !(await pg.$('#wN')));
  await pg.fill('#wD1', '40'); await pg.fill('#wDs', '15'); await pg.waitForTimeout(50);
  confere('Pivô 04 (409,8 m), 1º a 40 m, a cada 15 m: 25 coletores, último a 9,8 m do fim', (await pg.textContent('#wNc')) === '25 coletores' && (await pg.textContent('#wSum')) === 'de 40 m a 400 m do centro · o último fica a 9,8 m do fim do pivô (409,8 m)', await pg.textContent('#wSum'));
  await pg.fill('#wDs', '13,5'); await pg.waitForTimeout(50);
  confere('a cada 13,5 m: 28 coletores, último a 404,5 m (5,3 m do fim, ainda acima dos 5 m)', (await pg.textContent('#wNc')) === '28 coletores' && (await pg.textContent('#wSum')).includes('404,5 m do centro · o último fica a 5,3 m'), await pg.textContent('#wSum'));
  await pg.fill('#wDs', '10'); await pg.waitForTimeout(50);
  confere('a cada 10 m: 37 coletores (limite agora é 50), último a 9,8 m do fim', (await pg.textContent('#wNc')) === '37 coletores' && (await pg.textContent('#wSum')) === 'de 40 m a 400 m do centro · o último fica a 9,8 m do fim do pivô (409,8 m)', await pg.textContent('#wSum'));
  await pg.fill('#wDs', '7'); await pg.waitForTimeout(50);
  confere('a cada 7 m caberiam 53: limita a 50 e sugere 7,4 m', (await pg.textContent('#wNc')) === '50 coletores' && (await pg.textContent('#wSum')).includes('caberiam 53; o app usa no máximo 50') && (await pg.textContent('#wSum')).includes('use 7,4 m entre coletores (o último fica a 402,6 m do centro)'), await pg.textContent('#wSum'));
  await pg.fill('#wDs', '7,4'); await pg.waitForTimeout(50);
  confere('a cada 7,4 m: 50 coletores, último a 402,6 m', (await pg.textContent('#wNc')) === '50 coletores' && (await pg.textContent('#wSum')).includes('402,6 m do centro') && !(await pg.textContent('#wSum')).includes('caberiam'), await pg.textContent('#wSum'));
  await pg.click('[data-w="next"]'); await pg.waitForSelector('#wV');
  confere('50 coletores passam para a coleta, distância com casa decimal', (await pg.textContent('#wiz .prog')).includes('Coletor 1 de 50') && (await pg.textContent('#wiz .cn + .crumb')) === '40 + 0 × 7,4 = 40 m', await pg.textContent('#wiz .cn + .crumb'));
  await pg.fill('#wV', '33'); await pg.click('[data-w="nextk"]'); await pg.waitForTimeout(80);
  confere('coletor 2 a 47,4 m', (await pg.textContent('#wiz .cn + .crumb')) === '40 + 1 × 7,4 = 47,4 m', await pg.textContent('#wiz .cn + .crumb'));
  await pg.screenshot({ path: path.join(SAIDA, 'u50.png') });
  await pg.click('[data-w="prevk"]'); await pg.waitForTimeout(50); await pg.click('[data-w="prevk"]'); await pg.waitForSelector('#wDs');
  await pg.fill('#wDs', '15'); await pg.waitForTimeout(50);
  await pg.click('[data-w="next"]'); await pg.waitForSelector('#wV');
  for (let k = 1; k <= 25; k++) {
    if (k === 7) confere('distância do coletor 7 somada', (await pg.textContent('.cn span')) === '130 m do centro');
    if (k === 9) await pg.check('#wPerd');
    else await pg.fill('#wV', (30 + ((k * 7) % 11) + (k > 18 && k < 23 ? -6 : 0)).toFixed(1).replace('.', ','));
    await pg.click('[data-w="nextk"]'); await pg.waitForTimeout(20);
  }
  await pg.fill('#wResp', 'Responsável de teste');
  const tela = await (await pg.$('#sig')).boundingBox();
  await pg.mouse.move(tela.x + 30, tela.y + 90); await pg.mouse.down();
  for (let i = 0; i < 10; i++) await pg.mouse.move(tela.x + 40 + i * 22, tela.y + (i % 2 ? 100 : 50));
  await pg.mouse.up();
  await pg.click('#wFim'); await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => { const D = window.__im.D, id = Object.keys(D.avaliacoes)[0]; return { a: D.avaliacoes[id], r: window.__im.calc(D.avaliacoes[id]) }; });
  const ind = calculoIndependente(r.a);
  for (const k of ['cuh', 'cuc', 'cud', 'mean']) confere('cálculo ' + k + ' confere', Math.abs(ind[k] - r.r[k]) < 1e-9, r.r[k].toFixed(3));
  confere('assinatura gravada', !!r.a.sig && r.a.sig.length > 10);
  confere('33 mL num coletor de 72 mm dá 8,1 mm', Math.abs(33 * 1000 / (Math.PI * 36 * 36) - 8.105) < 0.001);
  await pg.screenshot({ path: path.join(SAIDA, 'uniformidade.png'), fullPage: true });

  // Exportações
  const [pdf] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="pdf"]')]);
  const pdfPath = path.join(SAIDA, 'avaliacao.pdf'); await pdf.saveAs(pdfPath);
  confere('PDF gerado', fs.readFileSync(pdfPath).slice(0, 5).toString() === '%PDF-');
  const [xl] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="xlsx"]')]);
  const xlPath = path.join(SAIDA, 'avaliacao.xlsx'); await xl.saveAs(xlPath);
  confere('Excel gerado', fs.readFileSync(xlPath).slice(0, 2).toString() === 'PK');

  confere('avaliação guarda o comprimento do pivô', r.a.comp === 409.76 && r.a.n === 25);

  // pivô sem comprimento cadastrado: número de coletores digitado
  await pg.click('[data-up="p09"]'); await pg.click('.top [data-act="novaAval"]'); await pg.waitForSelector('#wPr');
  await pg.fill('#wPr', '2'); await pg.fill('#wVt', '1'); await pg.fill('#wTw', '3'); await pg.click('[data-w="next"]');
  confere('Pivô 09 sem comprimento: pede o nº de coletores', !!(await pg.$('#wN')) && (await pg.textContent('.wbody')).includes('não cadastrado'));
  await pg.click('[data-wx="1"]'); await pg.waitForTimeout(200);

  confere('sem erros de script na página', erros.length === 0, erros.join(' | '));
  await nav.close();
  console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})();
