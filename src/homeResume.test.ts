// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const homeSource = readFileSync(fileURLToPath(new URL('./components/JournalExperience.tsx', import.meta.url)), 'utf8');

describe('Home campaign resume regression guards', () => {
  it('uses the actual current location as WHERE and keeps the destination separate', () => {
    expect(homeSource).toContain("const dayPlace = localizeLocationName(state.currentLocationName) || '현재 위치 미기록';");
    expect(homeSource).toContain("{ label: '여정 목적지', value: localizeLocationName(state.journeyDestination) || '미정' }");
    expect(homeSource).not.toContain('className="today-place"');
  });

  it('renders only meaningful persisted resume context instead of empty navigation cards', () => {
    expect(homeSource).toContain('const hasResumeContext = Boolean(patient || legacyAilment || requirements.length || isOverCapacity || recentJournal);');
    expect(homeSource).toContain('today-story today-story--resume');
    expect(homeSource).not.toContain('아직 찾아온 환자가 없습니다');
    expect(homeSource).not.toContain('첫 여행을 떠나면 이곳에 작은 기억이 남습니다.');
  });

  it('shares one tested action priority list with the actual Home resume button', () => {
    expect(appSource).toContain('const preferredActionIds = getCampaignResumeActionIds(state, Boolean(currentBarrow));');
    expect(appSource).not.toContain('className="action-hub__status"');
  });
});
