// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/App.tsx', 'utf8');

describe('cloud bootstrap experience', () => {
  it('opens a progressed local campaign without waiting for cloud I/O', () => {
    expect(appSource).toContain('if (campaignSaveHasProgress(migrated.state)) setCloudBootstrapComplete(true);');
    expect(appSource).not.toContain('setCloudBootstrapComplete(false);');
  });

  it('bounds remote startup work and offers an explicit local fallback', () => {
    expect(appSource).toContain('const CLOUD_BOOTSTRAP_TIMEOUT_MS = 3000;');
    expect(appSource).toContain('withCloudBootstrapTimeout(getDoc(userDocRef))');
    expect(appSource).toContain('cloudBootstrapSkipped.current = true;');
    expect(appSource).toContain('기기 기록으로 먼저 열기');
  });
});
