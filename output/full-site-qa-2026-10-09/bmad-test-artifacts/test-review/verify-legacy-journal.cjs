const fs = require('node:fs');
const { chromium } = require('/Users/imwul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');

(async () => {
  const root = 'output/full-site-qa-2026-10-09/';
  const storage = JSON.parse(fs.readFileSync(root + 'browser-treated-state.json', 'utf8'));
  const item = storage.origins[0].localStorage.find(row => row.name === 'apawthecaria_rpg_state');
  const state = JSON.parse(item.value);
  state.patientCasebook = [{ id: 'qa-legacy-case', patientName: 'QA 기존 환자', species: '오소리', ailmentName: 'Paw Rot', severity: 'minor', outcome: 'success', locationName: 'Noonhill', timestamp: 1700000000000, finalArchiveNote: 'QA 보존할 기존 진료 메모', isBookmarked: false, remedy: ['QA 기존 처방'] }];
  item.value = JSON.stringify(state);
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: storage });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  try {
    await page.goto('http://127.0.0.1:5173/#journals');
    await page.getByRole('button', { name: /^진료 기록 \(/ }).waitFor({ state: 'visible' });
    const countLabel = await page.getByRole('button', { name: /^진료 기록 \(/ }).innerText();
    await page.getByRole('button', { name: /^진료 기록 \(/ }).click();
    await page.getByText('QA 기존 환자', { exact: true }).waitFor({ state: 'visible' });
    await page.getByText('QA 보존할 기존 진료 메모', { exact: true }).waitFor({ state: 'visible' });
    await page.locator('button[title="이 환자와의 만남을 마음에 품어두기"]').click();
    await page.locator('button[title="이 환자와의 만남을 마음에 깊이 품어두었습니다."]').waitFor({ state: 'visible' });
    await page.screenshot({ path: root + 'bmad-test-artifacts/test-review/legacy-journal-1440.png', fullPage: true });
    const canonicalDisplayed = await page.getByText('정규 환자 상태', { exact: true }).isVisible();
    if (!canonicalDisplayed || !countLabel.includes('2')) throw new Error('Canonical + legacy record count mismatch: ' + countLabel);
    if (errors.length) throw new Error('Runtime errors: ' + errors.join('\n'));
    fs.writeFileSync(root + 'bmad-test-artifacts/test-review/legacy-journal-browser.json', JSON.stringify({ status: 'pass', countLabel, canonicalDisplayed, legacyNoteDisplayed: true, bookmarkToggled: true, errors, viewport: { width: 1440, height: 1000 }, seeded: 'Existing treated storage fixture plus one legacy patientCasebook record in an isolated context.' }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => { process.stderr.write(String(error.stack || error)); process.exitCode = 1; });
