import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const out = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/imwul/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
const context = browser.contexts()[0];
const page = context.pages()[0] || await context.newPage();
page.setDefaultTimeout(5000);
page.setDefaultNavigationTimeout(45000);
const errors = [];
const consoleErrors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
const stepPath = path.resolve(process.argv[2]);
const { default: run } = await import(pathToFileURL(stepPath));
try {
  await run({ page, context, browser, fs, out });
  await fs.appendFile(path.join(out, 'browser-errors.jsonl'), JSON.stringify({ step: path.basename(stepPath), errors, consoleErrors }) + '\n');
  process.exit(errors.length ? 1 : 0);
} catch (error) {
  await fs.appendFile(path.join(out, 'browser-errors.jsonl'), JSON.stringify({ step: path.basename(stepPath), errors, consoleErrors, failure: error.message }) + '\n');
  console.error(error);
  process.exit(1);
}
