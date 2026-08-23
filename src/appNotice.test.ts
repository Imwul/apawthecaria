// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const cssSource = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');

describe('application notice dialog', () => {
  it('keeps gameplay notices inside the application instead of native alerts', () => {
    expect(appSource).not.toContain('window.alert(');
    expect(appSource).toContain("const APP_NOTICE_EVENT = 'apawthecaria:notice'");
    expect(appSource).toContain('role="alertdialog"');
  });

  it('reports a successful campaign import from the app shell that survives the campaign remount', () => {
    expect(appSource).toContain("showAlert('세이브 파일을 성공적으로 가져왔습니다.');");
    expect(appSource).not.toContain("onCampaignImported(migrated.state);\n          setImportNotice({ kind: 'success'");
  });

  it('localizes season names in visible transition records and notices', () => {
    expect(appSource).toContain('localizeSeasonLabel(outcome.previousSeason)');
    expect(appSource).toContain('localizeSeasonLabel(outcome.nextSeason)');
    expect(appSource).not.toContain('showAlert(`${outcome.nextSeason}');
  });

  it('shares the minimal journal dialog language across notices and controlled prompts', () => {
    expect(appSource).toContain('app-dialog app-dialog--notice');
    expect(appSource).toContain('app-dialog app-dialog--prompt');
    expect(appSource).toContain('className="app-dialog__message"');
    expect(appSource).not.toContain('app-dialog__mark');
    expect(cssSource).toMatch(/\.phase4-modal\.controlled-prompt\.app-dialog\s*\{[\s\S]*?box-shadow:\s*0 14px 36px/);
    expect(cssSource).not.toContain("[role='alertdialog'] > div");
  });
});
