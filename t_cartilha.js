// Teste de ponta a ponta da Cartilha de manutenção, no modo local.
// Uso: node tools/testes/t_cartilha.js   (precisa do Playwright com o Chromium instalado)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const APP = 'file://' + path.resolve(__dirname, '../../index.html');
const SAIDA = path.resolve(__dirname, 'saida');
const FOTO = path.resolve(__dirname, '../../assets/mapa-area-ru.jpg');
let falhas = 0;
function confere(nome, ok, extra) { console.log((ok ? 'OK    ' : 'FALHOU ') + nome + (extra != null ? ' · ' + extra : '')); if (!ok) falhas++; }
function dia(n) { const d = new Date(Date.now() + n * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const pg = await ctx.newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(APP); await pg.waitForTimeout(600);
  const st = (pid, tid) => pg.evaluate(([pid, tid]) => { const im = window.__im; im.derive(); const p = Object.assign({ id: pid }, im.D.pivos[pid]); if (!tid) { const s = im.stPivo(p); return { st: s.st, n: s.n, tot: s.tot }; } const t = im.CTM().find(x => x.id === tid); const r = im.stTarefa(p, t); return { st: r.st, faltaH: r.faltaH, venc: r.venc, txt: r.txt }; }, [pid, tid]);
  const msg = async () => (await pg.textContent('#mMsg')) || '';
  async function horimetro(pid, data, h) {
    await pg.click('[data-go="pivos"]'); await pg.click('.acts [data-act="horimetro"]'); await pg.waitForSelector('#hP');
    await pg.selectOption('#hP', pid); await pg.fill('#hD', data); await pg.fill('#hH', String(h));
    await pg.click('#hOk'); await pg.waitForTimeout(150);
  }

  // Modelo padrão
  const mod = await pg.evaluate(() => { const c = window.__im.CT0, s = {}; c.forEach(t => { s[t.sec] = (s[t.sec] || 0) + 1; }); return { n: c.length, s, h1000: c.filter(t => t.h === 1000 && !t.m).length, tri: c.filter(t => t.m === 3 && !t.h).length, anual: c.filter(t => t.h === 2000 && t.m === 12).length, soAnual: c.filter(t => t.m === 12 && !t.h).length, semPer: c.filter(t => !t.h && !t.m).length }; });
  confere('cartilha padrão: 31 tarefas do pivô + 9 da casa de bomba', mod.n === 40 && mod.s['Casa de bomba'] === 9, JSON.stringify(mod.s));
  confere('periodicidades: 1.000 h, trimestral, anual e 2.000 h ou anual só na troca de óleo (sem semestral)', mod.h1000 + mod.tri + mod.anual + mod.soAnual === 40 && mod.tri === 4 && mod.anual === 2 && mod.soAnual === 2 && mod.semPer === 0, `${mod.h1000} / ${mod.tri} / ${mod.soAnual} / ${mod.anual}`);
  const oleo = await pg.evaluate(() => window.__im.CT0.filter(t => /trocar o óleo/.test(t.t)).map(t => t.t + ' | ' + t.h + ' | ' + t.m));
  confere('troca de óleo com a especificação do plano dos PCs, em 2.000 h ou anual', oleo.length === 2 && oleo[0].includes('(SAE 85W-140) | 2000 | 12') && oleo[1].includes('(SAE 140, 3,30 L por redutor) | 2000 | 12'), oleo.join(' / '));
  const pf = await pg.evaluate(() => window.__im.CT0.some(t => /pivotflex/.test(t.t)) && window.__im.CT0.some(t => /junta rotativa/.test(t.t)));
  confere('pivotflex e junta rotativa são tarefas separadas', pf);

  // Aba no menu e situação inicial
  confere('menu tem a aba Cartilha habilitada', !!(await pg.$('.rail [data-go="ct"]')));
  await pg.click('.rail [data-go="ct"]'); await pg.click('[data-tp="p04"]'); await pg.waitForTimeout(100);
  let s4 = await st('p04');
  confere('sem registro: Pivô 04 fica "Sem registro" com 40 tarefas', s4.st === 'mut' && s4.n.mut === 40, JSON.stringify(s4.n));
  confere('aviso para começar os registros', (await pg.textContent('#main')).includes('ainda não tem manutenção registrada'));

  // Leitura antiga e primeiro registro (revisão completa)
  const d0 = dia(-200);
  await horimetro('p04', d0, 1000);
  await pg.click('.rail [data-go="ct"]'); await pg.click('[data-tp="p04"]');
  await pg.click('.top .acts [data-act="mtNovo"]'); await pg.waitForSelector('#mP');
  await pg.fill('#mD', d0); await pg.dispatchEvent('#mD', 'change'); await pg.waitForTimeout(80);
  confere('horímetro vem preenchido com a leitura da data', (await pg.inputValue('#mH')) === '1000', await pg.inputValue('#mH'));
  await pg.click('[data-m="salvar"]');
  confere('pede para marcar tarefas', (await msg()).includes('Marque as tarefas'));
  await pg.click('[data-m="todas"]'); await pg.waitForTimeout(80);
  confere('"Marcar todas" marca as 40', (await pg.textContent('#mN')).startsWith('40 marcadas'));
  await pg.fill('#mR', 'Equipe de manutenção');
  await pg.click('[data-m="salvar"]');
  confere('aterramento pede a resistência medida', (await msg()).includes('resistência medida'), await msg());
  await pg.fill('[data-mv="el3"]', '4,2'); await pg.fill('[data-mv="cb9"]', '6');
  await pg.click('[data-m="foto"]'); await pg.setInputFiles('#fotoIn', FOTO); await pg.waitForTimeout(700);
  confere('foto aparece no registro', (await pg.$$('#wiz .thumbs img')).length === 1);
  await pg.screenshot({ path: path.join(SAIDA, 'cartilha-registro.png') });
  await pg.click('[data-m="salvar"]'); await pg.waitForTimeout(300);
  const reg = await pg.evaluate(() => { const D = window.__im.D, ks = Object.keys(D.manutencoes); return ks.map(k => D.manutencoes[k]); });
  confere('registro salvo com 40 tarefas, horímetro, valor e foto', reg.length === 1 && reg[0].tarefas.length === 40 && reg[0].horim === 1000 && reg[0].vals.el3 === 4.2 && reg[0].fotos.length === 1 && reg[0].data === d0, JSON.stringify({ n: reg[0] && reg[0].tarefas.length, h: reg[0] && reg[0].horim, v: reg[0] && reg[0].vals }));
  const lt = await pg.evaluate(() => Object.keys(window.__im.D.leituras).length);
  confere('horímetro igual à leitura existente não duplica a leitura', lt === 1, lt);

  // Situação depois de 200 dias e 1000 h de uso
  let r = await st('p04', 'rt1');
  confere('trimestral registrada há 200 dias fica Vencida', r.st === 'crit' && r.venc < dia(0), JSON.stringify(r));
  r = await st('p04', 'rd1');
  confere('troca de óleo (2.000 h ou anual) fica Em dia, vence pela data', r.st === 'ok' && r.faltaH === 2000 && r.venc > dia(0), JSON.stringify(r));
  r = await st('p04', 'tc1');
  confere('1.000 h sem novas horas fica Em dia, faltando 1.000 h', r.st === 'ok' && r.faltaH === 1000, JSON.stringify(r));
  await horimetro('p04', dia(-10), 1950);
  r = await st('p04', 'tc1');
  confere('faltando 50 h a tarefa de 1.000 h fica Próxima', r.st === 'warn' && r.faltaH === 50, JSON.stringify(r));
  await horimetro('p04', dia(0), 2010);
  r = await st('p04', 'tc1');
  confere('passou 10 h: fica Vencida', r.st === 'crit' && r.faltaH === -10, JSON.stringify(r));
  r = await st('p04', 'rd1');
  confere('2.000 h ou anual com 1.010 h de uso continua Em dia', r.st === 'ok' && r.faltaH === 990, JSON.stringify(r));
  s4 = await st('p04');
  confere('situação do pivô é a pior das tarefas (Vencida)', s4.st === 'crit' && s4.n.crit === 36 && s4.n.ok === 4, JSON.stringify(s4.n));

  // Mapa e painel
  await pg.click('.rail [data-go="mapa"]'); await pg.click('[data-area="1"]');
  await pg.evaluate(() => { document.querySelector('#ovl text[data-p="p04"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await pg.waitForTimeout(100);
  const cor = await pg.evaluate(() => document.querySelector('#ovl path[data-p="p04"]').getAttribute('fill'));
  confere('mapa pinta o Pivô 04 de vermelho (Vencida)', cor === 'var(--crit)', cor);
  const painel = await pg.textContent('.side');
  confere('painel mostra "Manutenção: Vencida", contagem e as tarefas mais urgentes', painel.includes('Manutenção: Vencida') && painel.includes('36vencidas') && painel.includes('passou 10 h'), painel.slice(0, 220));
  await pg.click('.side [data-go="ct"]'); await pg.waitForTimeout(100);
  confere('botão Cartilha do painel abre o pivô na aba', (await pg.textContent('#main h1')).includes('Cartilha') && (await pg.getAttribute('[data-tp="p04"]', 'class')) === 'on');

  // Registrar as vencidas e próximas
  await pg.click('.top .acts [data-act="mtNovo"]'); await pg.waitForSelector('#mP');
  await pg.click('[data-m="venc"]'); await pg.waitForTimeout(80);
  confere('"Marcar vencidas e próximas" marca as 36', (await pg.textContent('#mN')).startsWith('36 marcadas'), await pg.textContent('#mN'));
  confere('horímetro de hoje preenchido (2.010 h)', (await pg.inputValue('#mH')) === '2010');
  await pg.fill('#mH', '1900'); await pg.fill('[data-mv="el3"]', '3,9'); await pg.fill('[data-mv="cb9"]', '5,1'); await pg.fill('#mR', 'Equipe de manutenção');
  await pg.click('[data-m="salvar"]');
  confere('recusa horímetro menor que a leitura anterior', (await msg()).includes('não bate'), await msg());
  await pg.fill('#mH', '2010'); await pg.click('[data-m="salvar"]'); await pg.waitForTimeout(300);
  s4 = await st('p04');
  confere('depois do registro o Pivô 04 fica Em dia', s4.st === 'ok' && s4.n.ok === 40, JSON.stringify(s4.n));
  confere('histórico mostra 2 registros', (await pg.textContent('#main')).includes('2 registros'));

  // Registro a partir de uma tarefa e pivô sem leitura (cria a leitura)
  await pg.click('[data-tp="p03"]'); await pg.waitForTimeout(80);
  await pg.click('tr[data-tid="tc1"] [data-act="mtNovo"]'); await pg.waitForSelector('#mP');
  confere('abrir pela linha já marca a tarefa', (await pg.isChecked('[data-mt="tc1"]')) && (await pg.textContent('#mN')).startsWith('1 marcada'));
  await pg.fill('#mR', 'Equipe'); await pg.click('[data-m="salvar"]');
  confere('tarefa por horas sem horímetro: pede o horímetro', (await msg()).includes('Informe o horímetro'), await msg());
  await pg.fill('#mH', '500'); await pg.click('[data-m="salvar"]'); await pg.waitForTimeout(300);
  const l3 = await pg.evaluate(() => Object.values(window.__im.D.leituras).filter(l => l.pivo === 'p03'));
  confere('horímetro novo vira leitura do pivô', l3.length === 1 && l3[0].h === 500 && /cartilha/i.test(l3[0].obs), JSON.stringify(l3));
  r = await st('p03', 'tc1');
  confere('tarefa registrada fica Em dia; as outras continuam Sem registro', r.st === 'ok' && (await st('p03')).n.mut === 39);

  // Ocorrências e peças
  for (const [desc, pecas, q, v] of [['Vazamento na vedação do tubo de subida', 'Jogo de vedações', '1', '350'], ['Entrada de formigas no painel', 'Cordão de vedação', '2', '45,50']]) {
    await pg.click('[data-tp="p04"]'); await pg.click('.top .acts [data-act="ocNova"]'); await pg.waitForSelector('#oO');
    await pg.fill('#oO', desc); await pg.fill('#oPc', pecas); await pg.fill('#oQ', q); await pg.fill('#oV', v); await pg.fill('#oR', 'Equipe');
    await pg.click('#oOk'); await pg.waitForTimeout(200);
  }
  const main = await pg.textContent('#main');
  confere('ocorrências somam R$ 395,50 no pivô', main.includes('R$ 395,50') && main.includes('2 no total'), '');
  await pg.screenshot({ path: path.join(SAIDA, 'cartilha-pivo.png'), fullPage: true });

  // Visão de todos os pivôs (PC)
  await pg.setViewportSize({ width: 1300, height: 900 });
  await pg.click('[data-tmode="m"]'); await pg.waitForTimeout(150);
  const cel = await pg.$$eval('.ctm button.mtx', b => b.length);
  confere('tabela tarefas × pivôs: 41 linhas × 8 pivôs', cel === 41 * 8, cel);
  const geral = await pg.$$eval('.ctm tbody tr:first-child button.mtx', b => b.map(x => x.textContent));
  confere('linha "Situação geral": Pivôs 03 e 04 Em dia, Pivô 01 sem registro', geral[2] === 'Em dia' && geral[3] === 'Em dia' && geral[0] === '—', geral.join(','));
  await pg.screenshot({ path: path.join(SAIDA, 'cartilha-todos.png'), fullPage: true });
  await pg.click('.ctm button.mtx[data-tsel="p03"]'); await pg.waitForTimeout(100);
  confere('clicar numa célula abre o pivô', (await pg.getAttribute('[data-tp="p03"]', 'class')) === 'on' && !(await pg.$('.ctm')));

  // Exportações
  await pg.click('[data-tp="p04"]');
  const [pdf] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="ctPdf"]')]);
  const pdfPath = path.join(SAIDA, 'cartilha.pdf'); await pdf.saveAs(pdfPath);
  const pb = fs.readFileSync(pdfPath).toString('latin1');
  confere('PDF da cartilha gerado com 2 páginas', pb.startsWith('%PDF-') && (pb.match(/\/Type \/Page /g) || []).length === 2, (pb.match(/\/Type \/Page /g) || []).length);
  confere('PDF traz o pivô, as seções e o campo "Verificado por"', pb.includes('(Pivô 04)'.replace('ô', '\xf4')) && pb.includes('Casa de bomba') && pb.includes('Verificado por'));
  const [xl] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="ctXlsx"]')]);
  const xlPath = path.join(SAIDA, 'cartilha.xlsx'); await xl.saveAs(xlPath);
  const xb = fs.readFileSync(xlPath).toString('utf8');
  confere('Excel com Plano, Situação por pivô, Registros e Ocorrências', xb.startsWith('PK') && ['Plano', 'Situação por pivô', 'Registros', 'Ocorrências e peças'].every(n => xb.includes('name="' + n + '"')));
  confere('Excel traz o total das peças (395,5)', xb.includes('>395.5<'));

  // Excluir registro volta a situação
  const ids = await pg.evaluate(() => Object.keys(window.__im.D.manutencoes).filter(k => window.__im.D.manutencoes[k].pivo === 'p04').sort((a, b) => window.__im.D.manutencoes[a].data < window.__im.D.manutencoes[b].data ? -1 : 1));
  await pg.click(`[data-act="delMt"][data-id="${ids[1]}"]`); await pg.click(`[data-act="delMt"][data-id="${ids[1]}"]`); await pg.waitForTimeout(200);
  confere('excluir o último registro volta o Pivô 04 para Vencida', (await st('p04')).st === 'crit');

  // Editor em Configurações
  await pg.click('.rail [data-go="cfg"]'); await pg.waitForTimeout(100);
  const k = await pg.evaluate(() => window.__im.CTM().findIndex(t => t.id === 'rt1'));
  await pg.fill(`#te${k}m`, ''); await pg.click('[data-act="ctSave"]'); await pg.waitForTimeout(100);
  confere('editor recusa tarefa sem horas e sem meses', (await pg.textContent('#toast')).includes('Informe as horas ou os meses'));
  await pg.fill(`#te${k}m`, '6'); await pg.click('[data-act="ctSave"]'); await pg.waitForTimeout(150);
  const rt1 = await pg.evaluate(() => window.__im.CTM().find(t => t.id === 'rt1'));
  confere('editor salva a nova periodicidade (6 meses = semestral)', rt1.m === 6 && !rt1.h, JSON.stringify(rt1));
  confere('Configurações não tem mais o intervalo único da preventiva', !(await pg.$('#cInt')));

  // Pivôs: colunas novas
  await pg.click('.rail [data-go="pivos"]'); await pg.waitForTimeout(100);
  const th = await pg.$$eval('.t thead th', x => x.map(e => e.textContent).join('|'));
  confere('tabela de pivôs mostra Manutenção, Vencidas e Próximas', th.includes('Manutenção|Vencidas|Próximas') && !th.includes('Desde a prev.'), th);
  confere('diálogo do horímetro sem "Preventiva realizada"', await (async () => { await pg.click('.acts [data-act="horimetro"]'); const ok = !(await pg.$('#hPrev')); await pg.keyboard.press('Escape'); return ok; })());

  confere('sem erros de script na página', erros.length === 0, erros.join(' | '));
  await nav.close();
  console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})();
