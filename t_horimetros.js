// Teste de ponta a ponta da atualização semanal dos horímetros, no modo local.
// Uso: node tools/testes/t_horimetros.js   (precisa do Playwright com o Chromium instalado)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const APP = 'file://' + path.resolve(__dirname, '../../index.html');
const SAIDA = path.resolve(__dirname, 'saida');
let falhas = 0;
function confere(nome, ok, extra) { console.log((ok ? 'OK    ' : 'FALHOU ') + nome + (extra != null ? ' · ' + extra : '')); if (!ok) falhas++; }
function dia(n) { const d = new Date(Date.now() + n * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function br(iso) { const p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const nav = await chromium.launch();
  const pg = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(APP); await pg.waitForTimeout(600);
  const leit = () => pg.evaluate(() => Object.values(window.__im.D.leituras));
  const linha = async pid => (await pg.textContent(`#cardHor tr[data-hor="${pid}"]`)) || '';
  const msg = async () => (await pg.textContent('#hbMsg')) || '';

  // Quadro Horímetros sem leituras
  await pg.click('.rail [data-go="pivos"]'); await pg.waitForTimeout(100);
  confere('aba Pivôs tem o quadro Horímetros', !!(await pg.$('#cardHor')) && (await pg.textContent('#cardHor h3')).includes('nenhuma leitura ainda'));
  confere('pivô sem leitura aparece "sem leitura" em amarelo', (await linha('p01')).includes('sem leitura') && (await pg.getAttribute('#cardHor tr[data-hor="p01"]', 'class')) === 'hdes');

  // Leitura antiga de um pivô (lançamento individual, com nome)
  await pg.click('.acts [data-act="horimetro"]'); await pg.waitForSelector('#hR');
  await pg.selectOption('#hP', 'p04'); await pg.fill('#hD', dia(-10)); await pg.fill('#hH', '1000'); await pg.fill('#hR', 'Ana');
  await pg.click('#hOk'); await pg.waitForTimeout(150);
  await pg.click('.acts [data-act="horimetro"]'); await pg.waitForSelector('#hR');
  await pg.selectOption('#hP', 'p10'); await pg.fill('#hD', dia(-10)); await pg.fill('#hH', '50'); await pg.fill('#hR', 'Ana');
  await pg.click('#hOk'); await pg.waitForTimeout(150);
  confere('lançamento individual guarda quem lançou', (await leit()).some(l => l.pivo === 'p04' && l.h === 1000 && l.resp === 'Ana'));
  confere('leitura de 10 dias fica em amarelo (mais de 7 dias)', (await linha('p04')).includes('há 10 dias') && (await linha('p04')).includes('Ana') && (await pg.getAttribute('#cardHor tr[data-hor="p04"]', 'class')) === 'hdes', await linha('p04'));

  // Atualização semanal de todos
  await pg.click('[data-act="horLote"]'); await pg.waitForSelector('#hbD');
  const ativos = await pg.$$eval('[data-hb]', x => x.map(e => e.getAttribute('data-hb')));
  confere('tela lista os 8 pivôs em operação', ativos.length === 8, ativos.join(','));
  confere('data vem com hoje', (await pg.inputValue('#hbD')) === dia(0));
  confere('mostra a última leitura do pivô', (await pg.textContent('.hbi:has(#hb-p04) small')).includes('1.000 h em ' + br(dia(-10))));
  await pg.click('#hbOk');
  confere('pede pelo menos um valor', (await msg()).includes('pelo menos um pivô'));
  await pg.fill('#hb-p04', '900');
  confere('valor menor que a última leitura fica em vermelho', (await pg.textContent('#hbm-p04')).includes('Menor que a leitura') && (await pg.getAttribute('.hbi:has(#hb-p04)', 'class')).includes(' er'));
  await pg.click('#hbOk');
  confere('não salva com erro', (await msg()).includes('Confira: Pivô 04'));
  await pg.fill('#hb-p04', '1300');
  confere('+300 h em 10 dias: mais de 24 h por dia vira aviso', (await pg.textContent('#hbm-p04')).includes('mais de 24 h por dia') && (await pg.getAttribute('.hbi:has(#hb-p04)', 'class')).includes(' al'));
  await pg.fill('#hb-p04', '1120');
  confere('+120 h em 10 dias: mostra o ritmo', (await pg.textContent('#hbm-p04')) === '+120 h desde ' + br(dia(-10)) + ' (12 h por dia).', await pg.textContent('#hbm-p04'));
  await pg.fill('#hb-p01', '500'); await pg.fill('#hb-p02', '750,5'); await pg.fill('#hb-p03', '2.968');
  confere('botão conta as leituras digitadas', (await pg.textContent('#hbOk')) === 'Salvar 4 leituras');
  await pg.fill('#hbR', '');
  await pg.click('#hbOk');
  confere('pede quem atualizou', (await msg()).includes('quem atualizou'));
  await pg.fill('#hbR', 'Carlos (analista)');
  await pg.fill('#hb-p05', '99999');
  confere('primeira leitura não acusa salto', (await pg.textContent('#hbm-p05')) === 'Primeira leitura deste pivô.');
  await pg.fill('#hb-p04', '1400');
  await pg.click('#hbOk');
  confere('valor alto pede confirmação', (await msg()).includes('Valor alto em Pivô 04') && (await pg.textContent('#hbOk')) === 'Salvar mesmo assim');
  await pg.screenshot({ path: path.join(SAIDA, 'horimetros-lote.png') });
  await pg.fill('#hb-p04', '1120'); await pg.fill('#hb-p05', '');
  await pg.click('#hbOk'); await pg.waitForTimeout(300);
  const ls = (await leit()).filter(l => l.lote);
  confere('salva 4 leituras com data, nome e lote', ls.length === 4 && ls.every(l => l.data === dia(0) && l.resp === 'Carlos (analista)' && l.obs === 'Atualização semanal') && new Set(ls.map(l => l.lote)).size === 1, ls.map(l => l.pivo + ':' + l.h).join(','));
  confere('"2.968" vira 2968 h e "750,5" vira 750,5 h', ls.some(l => l.pivo === 'p03' && l.h === 2968) && ls.some(l => l.pivo === 'p02' && l.h === 750.5));
  confere('volta para a aba Pivôs', !(await pg.$('#hbD')) && !!(await pg.$('#cardHor')));
  confere('quadro mostra a última atualização geral', (await pg.textContent('#cardHor h3')).includes('última atualização: ' + br(dia(0)) + ' (hoje) · Carlos (analista) · 4 de 8 pivôs'), await pg.textContent('#cardHor h3'));
  confere('pivô atualizado: horímetro, data, "hoje" e quem atualizou, sem amarelo', (await linha('p04')).includes('1.120 h') && (await linha('p04')).includes(br(dia(0))) && (await linha('p04')).includes('hoje') && (await linha('p04')).includes('Carlos') && !(await pg.getAttribute('#cardHor tr[data-hor="p04"]', 'class')));
  confere('pivô não atualizado continua em amarelo', (await pg.getAttribute('#cardHor tr[data-hor="p06"]', 'class')) === 'hdes');
  await pg.screenshot({ path: path.join(SAIDA, 'horimetros-quadro.png'), fullPage: true });

  // Repetir o mesmo valor não duplica; data no painel e na Cartilha
  await pg.click('[data-act="horLote"]'); await pg.waitForSelector('#hbD');
  await pg.fill('#hb-p04', '1120');
  confere('mesmo valor na mesma data é reconhecido', (await pg.textContent('#hbm-p04')).includes('Igual à leitura'));
  await pg.fill('#hbR', 'Carlos'); await pg.click('#hbOk'); await pg.waitForTimeout(200);
  confere('não duplica a leitura', (await leit()).filter(l => l.pivo === 'p04').length === 2);
  await pg.click('[data-sel="p04"]'); await pg.waitForTimeout(100);
  const hist = await pg.textContent('#main');
  confere('histórico de leituras mostra "Lançado por"', hist.includes('Lançado por') && hist.includes('Carlos (analista)'));
  await pg.click('.rail [data-go="ct"]'); await pg.click('[data-tp="p04"]'); await pg.waitForTimeout(100);
  confere('Cartilha mostra a data da atualização', (await pg.textContent('#main')).includes('atualizado em ' + br(dia(0)) + ' (hoje)'));
  await pg.click('.rail [data-go="mapa"]'); await pg.click('[data-area="1"]');
  await pg.evaluate(() => { document.querySelector('#ovl text[data-p="p04"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await pg.waitForTimeout(100);
  const dm = dia(0).slice(8, 10) + '/' + dia(0).slice(5, 7);
  confere('painel do mapa mostra a data junto do horímetro', (await pg.textContent('.side')).includes('1.120horímetro · ' + dm), (await pg.textContent('.side')).slice(0, 200));

  // Configuração do destaque
  await pg.click('.rail [data-go="cfg"]'); await pg.fill('#cHor', '14'); await pg.click('[data-act="saveCfg"]'); await pg.waitForTimeout(150);
  await pg.click('.rail [data-go="pivos"]'); await pg.waitForTimeout(100);
  confere('com 14 dias, a leitura de 10 dias não fica amarela', (await linha('p10')).includes('há 10 dias') && !(await pg.getAttribute('#cardHor tr[data-hor="p10"]', 'class')) && (await pg.textContent('#cardHor .note')).includes('mais de 14 dias'));

  confere('sem erros de script na página', erros.length === 0, erros.join(' | '));
  await nav.close();
  console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})();
