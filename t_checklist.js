// Teste de ponta a ponta do Checklist (inspeção de pivô central), no modo local.
// Uso: node tools/testes/t_checklist.js   (precisa do Playwright com o Chromium instalado)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const APP = 'file://' + path.resolve(__dirname, '../../index.html');
const SAIDA = path.resolve(__dirname, 'saida');
const FOTO = path.resolve(__dirname, '../../assets/mapa-area-ru.jpg');
let falhas = 0;
function confere(nome, ok, extra) { console.log((ok ? 'OK    ' : 'FALHOU ') + nome + (extra != null ? ' · ' + extra : '')); if (!ok) falhas++; }

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const pg = await ctx.newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(APP); await pg.waitForTimeout(600);
  const msg = async () => (await pg.textContent('#kMsg')) || '';
  const resp = async (id, v) => { await pg.click(`[data-kr="${id}|${v}"]`); await pg.waitForTimeout(30); };

  // Abre a inspeção pelo menu Checklist
  await pg.click('[data-go="ck"]'); await pg.click('[data-cp="p04"]'); await pg.click('[data-act="novoCk"]');
  await pg.waitForSelector('#kHo');
  confere('modelo padrão tem 14 itens em 4 seções', (await pg.textContent('.wbody')).includes('14 itens em 4 seções'));
  await pg.evaluate(() => { const D = window.__im.D; D.leituras.l1 = { pivo: 'p04', data: '2026-11-01', h: 2900, prev: true }; window.__im.derive(); });
  await pg.fill('#kHo', '2800'); await pg.click('[data-k="next"]');
  confere('recusa horímetro menor que o anterior', (await msg()).includes('não bate'));
  await pg.fill('#kHo', '2950'); await pg.click('[data-k="next"]');

  // Seção 1: Estrutura e torres
  await pg.click('[data-k="next"]');
  confere('não passa de seção com item sem resposta', (await msg()).includes('Responda todos'));
  for (const id of ['e1', 'e2', 'e5']) await resp(id, 'C');
  await resp('e3', 'NA'); await resp('e6', 'NC');
  await pg.click('[data-k="next"]');
  confere('não conforme exige descrição', (await msg()).includes('Descreva'));
  await pg.fill('[data-kf="e6|obs"]', 'Valeta funda na torre 3');
  await pg.click('[data-kfoto="e6"]'); await pg.setInputFiles('#fotoIn', FOTO); await pg.waitForTimeout(600);
  confere('foto do item não conforme', (await pg.$$eval('#ki-e6 .thumbs img', x => x.length)) === 1);
  await pg.fill('[data-kf="e6|acao"]', 'Aterrar o rodeiro'); await pg.fill('[data-kf="e6|prazo"]', '2026-11-20');
  await pg.screenshot({ path: path.join(SAIDA, 'ck_secao1.png') });
  await pg.click('[data-k="next"]');

  // Seção 2: Hidráulica
  await resp('h1', 'C'); await pg.click('[data-k="todosC"]');
  await pg.click('[data-k="next"]');
  confere('pede o valor medido da pressão', (await msg()).includes('valor medido'));
  await pg.fill('[data-kf="h1|val"]', '2,4');
  await resp('h3', 'NC'); await pg.fill('[data-kf="h3|obs"]', 'Vazamento na flange da torre 5');
  await pg.click('[data-k="next"]');

  // Seção 3: Elétrica e comando
  await pg.click('[data-k="todosC"]'); await pg.fill('[data-kf="c2|val"]', '80');
  await resp('c3', 'NC'); await pg.fill('[data-kf="c3|obs"]', 'Cabo solto na caixa da torre 4');
  await pg.click('[data-k="next"]');

  // Seção 4: Área e segurança
  await resp('s1', 'NC'); await pg.fill('[data-kf="s1|obs"]', 'Máquina parada no caminho da torre 2'); await resp('s2', 'C');
  await pg.click('[data-k="next"]'); await pg.waitForSelector('#sig');
  const txt = await pg.textContent('.wbody');
  confere('resultado 9 de 13 (69,2%), N/A fora da conta', txt.includes('9 de 13 conformes (69,2%)') && txt.includes('1 N/A'));
  confere('sugere inapto com crítico não conforme', txt.includes('o app sugere “Não”'));
  await pg.click('[data-ka="1"]'); await pg.fill('#kR', 'Responsável de teste');
  const sg = await pg.$('#sig'); await sg.scrollIntoViewIfNeeded(); const b = await sg.boundingBox();
  await pg.mouse.move(b.x + 30, b.y + 90); await pg.mouse.down();
  for (let i = 0; i < 10; i++) await pg.mouse.move(b.x + 40 + i * 22, b.y + (i % 2 ? 110 : 50));
  await pg.mouse.up();
  await pg.click('#kFim');
  confere('apto com crítico exige justificativa', (await msg()).includes('Justifique'));
  await pg.screenshot({ path: path.join(SAIDA, 'ck_final.png') });
  await pg.click('[data-ka="0"]'); await pg.click('#kFim'); await pg.waitForTimeout(500);

  const st = await pg.evaluate(() => { const D = window.__im.D; const ck = Object.values(D.checklists)[0]; return { n: Object.keys(D.checklists).length, ck, res: window.__im.ckRes(ck), pend: Object.values(D.pendencias), leit: Object.values(D.leituras).filter(l => l.h === 2950).length }; });
  confere('inspeção salva como inapta', st.n === 1 && st.ck.apto === false);
  confere('4 pendências abertas, 2 críticas', st.pend.length === 4 && st.pend.filter(p => p.crit).length === 2);
  confere('horímetro da inspeção entrou nas leituras', st.leit === 1);
  confere('foto ligada ao item e à pendência', st.ck.itens.find(i => i.id === 'e6').fotos.length === 1 && st.pend.find(p => p.itemId === 'e6').fotos.length === 1);
  confere('pressão medida guardada', st.ck.itens.find(i => i.id === 'h1').val === 2.4);

  // Tela do Checklist (PC)
  await pg.setViewportSize({ width: 1300, height: 900 }); await pg.waitForTimeout(200);
  const tela = await pg.textContent('#main');
  confere('aba mostra pendências e inapto', tela.includes('Pendências abertas') && tela.includes('Inapto para operação'));
  confere('pendência com prazo vencido marcada', tela.includes('atrasada'));
  await pg.screenshot({ path: path.join(SAIDA, 'ck_aba.png'), fullPage: true });

  // Resolver uma pendência
  await pg.click('[data-act="resolver"]'); await pg.fill('#rN', 'Rodeiro aterrado'); await pg.fill('#rP', 'Equipe de manutenção'); await pg.click('#rOk'); await pg.waitForTimeout(200);
  confere('pendência resolvida', (await pg.evaluate(() => Object.values(window.__im.D.pendencias).filter(p => p.status === 'resolvida').length)) === 1);

  // Mapa com o aviso de inapto
  await pg.click('[data-go="mapa"]'); await pg.waitForTimeout(200);
  confere('mapa marca o pivô inapto', (await pg.textContent('#ovl')).includes('INAPTO'));
  await pg.screenshot({ path: path.join(SAIDA, 'ck_mapa.png') });

  // Exportações
  await pg.click('[data-go="ck"]'); await pg.waitForTimeout(150);
  const [d1] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="ckPdf"]')]);
  const pdf = path.join(SAIDA, 'inspecao.pdf'); await d1.saveAs(pdf);
  confere('PDF da inspeção', fs.readFileSync(pdf).slice(0, 5).toString() === '%PDF-');
  const [d2] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="ckXlsx"]')]);
  const xl = path.join(SAIDA, 'inspecao.xlsx'); await d2.saveAs(xl);
  confere('Excel da inspeção', fs.readFileSync(xl).slice(0, 2).toString() === 'PK');

  // Rascunho: fechar no meio e continuar
  await pg.click('[data-cp="p01"]'); await pg.click('[data-act="novoCk"]'); await pg.waitForSelector('#kHo');
  await pg.click('[data-k="next"]'); await resp('e1', 'C'); await resp('e2', 'NC'); await pg.fill('[data-kf="e2|obs"]', 'Ferrugem');
  await pg.waitForTimeout(400); await pg.click('[data-kx="1"]'); await pg.waitForTimeout(300);
  await pg.reload(); await pg.waitForTimeout(800);
  confere('aviso de inspeção em andamento', (await pg.textContent('#main')).includes('Inspeção em andamento'));
  await pg.click('[data-act="continuarCk"]'); await pg.waitForSelector('[data-kf="e2|obs"]');
  confere('rascunho mantém respostas', (await pg.inputValue('[data-kf="e2|obs"]')) === 'Ferrugem');
  await pg.click('[data-kx="1"]');

  // Editor do modelo
  await pg.click('[data-go="cfg"]'); await pg.click('[data-act="ckAdd"]'); await pg.waitForTimeout(150);
  const last = await pg.$$('input[data-ce$="|t"]'); await last[last.length - 1].fill('Verificar nível de água do reservatório');
  await pg.click('[data-act="ckSave"]'); await pg.waitForTimeout(200);
  confere('modelo salvo com 15 itens', (await pg.evaluate(() => window.__im.D.cfg.checklist.itens.length)) === 15);
  await pg.screenshot({ path: path.join(SAIDA, 'ck_editor.png'), fullPage: true });

  confere('sem erros de script na página', erros.length === 0, erros.join(' | '));
  await nav.close();
  console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTudo certo.');
  process.exit(falhas ? 1 : 0);
})();
