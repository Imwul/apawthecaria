// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');

describe('application notice dialog', () => {
  it('keeps gameplay notices inside the application instead of native alerts', () => {
    expect(appSource).not.toContain('window.alert(');
    expect(appSource).toContain("const APP_NOTICE_EVENT = 'apawthecaria:notice'");
    expect(appSource).toContain('role="alertdialog"');
  });
});
