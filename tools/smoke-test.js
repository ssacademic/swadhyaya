// User walkthrough: 20 steps through every main flow, screenshots into the given folder.
// Run: python3 -m http.server 8765 (in this folder) & then: node tools/smoke-test.js /tmp/shots
const { chromium } = require('playwright');
const S = process.argv[2], U = 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_TUNNEL|fonts/.test(m.text()) && errs.push(m.text()));
  let n = 0; const shot = async name => { await p.waitForTimeout(250); await p.screenshot({ path: `${S}/${String(++n).padStart(2, '0')}-${name}.png` }); };
  const log = (...a) => console.log(String(n).padStart(2, '0'), ...a);
  await p.goto(U); await p.waitForSelector('#daily blockquote'); await shot('home-first');
  await p.click('.book'); await p.waitForSelector('.toc'); await shot('book');
  await p.click('.bookhead .btn.primary'); await p.waitForSelector('.body p'); log('opened', await p.evaluate(() => location.hash));
  await p.mouse.wheel(0, 900); await p.waitForTimeout(400); await shot('reader-scrolled');
  await p.click('.rbar a.ib'); await p.waitForSelector('.toc'); await p.waitForTimeout(200);
  log('toc fill on first item:', await p.$$eval('.tfill', x => x.length));
  // open a chapter from toc
  await p.click('text=सन्त-महिमा'); await p.waitForSelector('.body p.vachan');
  await p.click('.body p.vachan >> nth=0'); await shot('actions');
  await p.click('#actions [data-a="save"]'); await shot('saved-toast');
  log('highlighted:', await p.$$eval('.is-saved', x => x.length));
  await p.click('.fnref a >> nth=0'); await shot('footnote'); await p.click('.sheet-card .done');
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(400);
  await p.fill('#note', 'सन्त की बाहरी क्रिया नहीं, भीतरी धारणा देखें।'); await p.waitForTimeout(600); await shot('end-of-sitting');
  await p.click('.nextcard'); await p.waitForSelector('.body p'); log('next ->', await p.evaluate(() => location.hash));
  // listen + mini player
  await p.click('[data-listen]'); await shot('listening');
  await p.waitForTimeout(4300); await shot('listening-mini');
  log('mini:', await p.$eval('#tts', e => e.className));
  await p.click('#tts [data-unfold]'); await p.waitForTimeout(200); log('unfolded:', await p.$eval('#tts', e => e.className));
  await p.click('#tts [data-ts]');
  // home again
  await p.click('.rbar a.ib'); await p.waitForSelector('.toc'); await p.click('.tabs a[href="#/"]'); await p.waitForSelector('.continue'); await shot('home-returning');
  // vachan
  await p.click('.tabs a[href="#/vachan"]'); await p.waitForSelector('details.theme'); await p.click('details.theme >> nth=0'); await shot('vachan-theme');
  await p.click('details.theme[open] .deck-row.sub >> nth=1'); await p.waitForSelector('.vcard'); await shot('deck');
  await p.click('[data-go="1"]'); await p.click('#deck [data-a="save"]'); await p.click('[data-restart]'); await shot('deck-restart-undo');
  await p.click('#toast button'); log('undo restart ->', await p.textContent('#dcount'));
  // saved
  await p.click('.rbar a.ib'); await p.click('.tabs a[href="#/saved"]'); await p.waitForSelector('.saved'); await shot('saved');
  const before = await p.$$eval('.saved', x => x.length); await p.click('[data-del] >> nth=0'); await p.waitForTimeout(200);
  const after = await p.$$eval('.saved', x => x.length); await shot('saved-undo'); await p.click('#toast button'); await p.waitForTimeout(300);
  log('delete', before, '→', after, '→ undo', await p.$$eval('.saved', x => x.length));
  // settings
  await p.click('.top [data-settings]'); await shot('settings'); await p.click('button[data-k="theme"][data-v="dark"]'); await p.click('.sheet-card .done'); await shot('home-dark');
  await p.click('.top [data-settings]'); await p.click('button[data-k="theme"][data-v="sepia"]'); await p.click('.sheet-card .done');
  // reset with undo
  await p.click('.tabs a[href="#/library"]'); await p.waitForSelector('.tile'); await p.click('.tile'); await p.waitForSelector('.toc');
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.click('[data-reset]'); await shot('reset-confirm');
  await p.click('[data-reset-yes]'); await p.waitForTimeout(300); log('after reset done:', await p.evaluate(() => done('udiya-baba-upadesh').size));
  await shot('reset-undo'); await p.click('#toast button'); await p.waitForTimeout(300); log('after undo done:', await p.evaluate(() => done('udiya-baba-upadesh').size));
  // complete book → rounds
  await p.evaluate(() => { store.set('done:udiya-baba-upadesh', [...Array(82).keys()]); }); await p.reload(); await p.waitForSelector('.done-card'); await shot('book-complete');
  await p.click('[data-round]'); await p.waitForTimeout(300); log('round:', await p.evaluate(() => [store.get('rounds:udiya-baba-upadesh', 0), done('udiya-baba-upadesh').size]));
  log('ERR', errs); await b.close();
})();
