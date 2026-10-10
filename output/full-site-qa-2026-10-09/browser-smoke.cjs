// Replay the final real-browser checks against the already running development server.
// Uses only an isolated browser profile and the synthetic campaign created during this audit.
const { chromium } = require('/Users/imwul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Users/imwul/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  });
  try {
    const storageState = JSON.parse(await fs.readFile(path.join(__dirname, 'browser-tools-state.json'), 'utf8'));
    const context = await browser.newContext({ storageState, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto('http://127.0.0.1:5173');
    await page.locator('nav .journal-tab--play').waitFor();
    const tabs = ['play', 'map', 'bio', 'reagents', 'almanack', 'journals', 'ailments', 'patientArchive', 'livingArchive'];
    const screens = [];
    const openTab = async tab => {
      if (['ailments', 'patientArchive', 'livingArchive'].includes(tab)) {
        await page.locator('details.direct-navigation__more').evaluate(element => { element.open = true; });
      }
      await page.locator(`nav .journal-tab--${tab}`).click();
      await page.locator(`nav .journal-tab--${tab}[aria-current="page"]`).waitFor();
    };
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const tab of tabs) {
        await openTab(tab);
        const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        assert.ok(dimensions.scroll <= dimensions.viewport, `${tab}/${width}: horizontal overflow`);
        screens.push({ tab, width, ...dimensions });
      }
    }
    assert.match(await page.locator('main').innerText(), /QA 환자 \/ 맷닭/);
    await openTab('play');
    await page.getByText('최근 진료와 기억 보기', { exact: true }).click();
    assert.match(await page.locator('main').innerText(), /QA 환자/);
    await openTab('journals');
    await page.getByRole('button', { name: '진료 기록 (1)', exact: true }).click();
    assert.match(await page.locator('main').innerText(), /QA 환자/);
    await page.reload();
    await page.getByRole('button', { name: '진료 기록 (1)', exact: true }).click();
    assert.match(await page.locator('main').innerText(), /QA 환자/);
    await openTab('map');
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.getByRole('button', { name: '장소 검색', exact: true }).click();
      await page.getByLabel('장소 이름 검색', { exact: true }).fill('NOT-A-REAL-PLACE-QA');
      assert.equal(await page.getByText('해당하는 장소가 없습니다.', { exact: true }).isVisible(), true);
      await page.getByRole('button', { name: '장소 검색', exact: true }).click();
      assert.equal(await page.getByLabel('장소 이름 검색', { exact: true }).count(), 0);
      await page.getByRole('button', { name: '겹침 설정', exact: true }).click();
      const checkbox = page.getByRole('dialog', { name: '지도 겹침', exact: true }).getByRole('checkbox').first();
      await checkbox.uncheck();
      assert.equal(await checkbox.isChecked(), false);
      await checkbox.check();
      assert.equal(await checkbox.isChecked(), true);
      await page.getByRole('button', { name: '겹침 설정', exact: true }).click();
    }
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);
    const result = { screens, canonicalMemories: 'PASS', reload: 'PASS', mapControls: 'PASS', pageErrors, consoleErrors };
    await fs.writeFile(path.join(__dirname, 'replay-browser-smoke.json'), JSON.stringify(result, null, 2));
    console.log(`PASS: ${screens.length} screens, canonical memories, reload, map controls; no runtime/console errors`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
