// Prerequisite: Playwright on NODE_PATH (or installed locally).
// Uses a fresh headless browser profile and an isolated local HTTP fixture.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright');

test('guided and silent practice, language, resume, failed save recovery and exam consent', async () => {
  let saves = [], rejectSaves = false;
  const server = createServer(async (request, response) => {
    if (request.url.startsWith('/api/')) {
      let body = ''; for await (const chunk of request) body += chunk;
      response.setHeader('Content-Type', 'application/json');
      if (request.url === '/api/attempts') {
        const data = JSON.parse(body);
        if (rejectSaves) { response.statusCode = 503; return response.end(JSON.stringify({ error: 'fixture unavailable' })); }
        saves.push(data);
      }
      if (request.url === '/api/simulation/profiles') return response.end(JSON.stringify({ profiles: [{ code: 'CCAO-F', title: 'Associate', questionCount: 60, ready: true }] }));
      return response.end(JSON.stringify({ ok: true }));
    }
    try {
      const name = decodeURIComponent(request.url.split('?')[0]).split('/').pop() || 'index.html';
      if (!/^[\w.-]+$/.test(name)) throw Error('invalid path');
      response.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8');
      response.end(readFileSync(join(__dirname, '../examenes', name)));
    } catch { response.statusCode = 404; response.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined) });
  const errors = [];
  try {
    const exams = [
      ['CCAO-F', '01-CCAO-F-Associate.html', 60], ['CCDV-F', '02-CCDV-F-Developer.html', 53],
      ['CCAR-F', '03-CCAR-F-Architect-Foundations.html', 60], ['CCAR-P', '04-CCAR-P-Architect-Professional.html', 63],
    ];
    for (const [code, file, total] of exams) for (const language of ['es', 'en']) for (const mode of ['immediate', 'none']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => dialog.accept());
      await page.addInitScript(lang => localStorage.setItem('claude-exam-language', lang), language);
      await page.goto(base + '/' + file);
      await page.locator('#cName').fill('Test Participant');
      await page.locator('#cEmail').fill('test@nxtara.com');
      await page.locator(`input[name=feedbackMode][value=${mode}]`).check();
      await page.locator('#btnStart').click();
      await page.locator('#exam:not(.hidden)').waitFor();
      // Always exercise a multi-response item rather than relying on random selection.
      const index = await page.evaluate(code => {
        const saved = JSON.parse(sessionStorage.getItem('claude-study-' + code));
        const script = [...document.scripts].find(s => s.textContent.includes('atob(')).textContent;
        const bank = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(script.match(/atob\("([^"]+)"\)/)[1]), c => c.charCodeAt(0))));
        return saved.order.findIndex(item => Array.isArray(bank.questions[item.idx].a));
      }, code);
      assert.ok(index >= 0);
      await page.locator('#navPanel summary').click();
      await page.locator('#nav' + index).click();
      const card = page.locator('#q' + index);
      assert.equal(await card.locator('.feedback-result:not(.hidden)').count(), 0);
      // Required multi-response cardinality must be satisfied before verifying.
      const inputs = card.locator('input');
      if (await inputs.first().getAttribute('type') === 'checkbox') {
        const hint = await card.locator('.multi-hint').textContent();
        const count = Number(hint.match(/\d+/)[0]);
        await inputs.nth(0).check();
        if (mode === 'immediate') assert.equal(await card.locator('.verify-answer').isDisabled(), true);
        for (let i = 1; i < count; i++) await inputs.nth(i).check();
      } else await inputs.first().check();
      if (mode === 'immediate') {
        await card.locator('.verify-answer').click();
        assert.equal(await inputs.first().isDisabled(), true);
        const feedback = await card.locator('.feedback-result').innerText();
        assert.match(feedback, language === 'en' ? /Correct answer:.*[\s\S]*Explanation:.*[\s\S]*Domain:/ : /Respuesta correcta:.*[\s\S]*Explicación:.*[\s\S]*Dominio:/);
        assert.ok(await card.locator('.feedback-result a').count() > 0);
      } else assert.equal(await card.locator('.verify-answer').count(), 0);
      const before = await page.evaluate(code => JSON.parse(sessionStorage.getItem('claude-study-' + code)), code);
      await page.reload();
      await page.locator('#btnResume').click();
      await page.locator('#exam:not(.hidden)').waitFor();
      const after = await page.evaluate(code => JSON.parse(sessionStorage.getItem('claude-study-' + code)), code);
      assert.equal(after.attemptId, before.attemptId);
      assert.deepEqual(after.order, before.order);
      assert.deepEqual(after.answers, before.answers);
      assert.equal(after.end, before.end);
      assert.equal(after.current, index);
      assert.equal(await page.locator('#q' + index + ' input').first().isDisabled(), mode === 'immediate');
      if (process.env.FEEDBACK_SCREENSHOT && code === 'CCAO-F' && language === 'es' && mode === 'immediate') await page.screenshot({ path: process.env.FEEDBACK_SCREENSHOT, fullPage: true });
      // A pending completed result must survive a reload until D1 acknowledges it.
      rejectSaves = true;
      await page.locator('#btnSubmit').click();
      await page.locator('#results:not(.hidden)').waitFor();
      await page.waitForFunction(() => document.querySelector('#sendStatus').classList.contains('bad'));
      assert.equal(await page.locator('#reviewPanel').isVisible(), mode === 'immediate');
      assert.equal(await page.locator('#review .rv').count(), mode === 'immediate' ? total : 0);
      assert.ok(await page.locator('#rDomains tr').count() > 0);
      await page.reload();
      rejectSaves = false;
      await page.locator('#btnResume').click();
      await page.waitForFunction(() => document.querySelector('#sendStatus').classList.contains('ok'));
      assert.equal(await page.evaluate(code => sessionStorage.getItem('claude-study-' + code), code), null);
      const completed = saves.findLast(record => record.attemptId === before.attemptId && record.status === 'completed');
      assert.equal(completed.feedbackMode, mode);
      assert.deepEqual(completed.verified, mode === 'immediate' ? [index] : []);
      await context.close();
    }
    const page = await browser.newPage();
    await page.goto(base + '/simulation.html');
    await page.locator('[data-profile]').click();
    assert.equal(await page.locator('#start').isDisabled(), true);
    await page.locator('#conditionsAccepted').check();
    assert.equal(await page.locator('#start').isDisabled(), false);
    assert.equal(await page.locator('[name=feedbackMode]').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
