// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/App.tsx', 'utf8');
const cssSource = readFileSync('src/index.css', 'utf8');

describe('patient identity experience', () => {
  it('lets the descriptor card lead to rulebook animal candidates before severity is drawn', () => {
    const descriptorDraw = appSource.indexOf('const descriptorCard = drawPlayingCard()');
    const speciesPrompt = appSource.indexOf("title: '환자의 동물 종을 정하세요'", descriptorDraw);
    const severityDraw = appSource.indexOf('const severityCard = drawPlayingCard()', descriptorDraw);

    expect(descriptorDraw).toBeGreaterThan(-1);
    expect(speciesPrompt).toBeGreaterThan(descriptorDraw);
    expect(severityDraw).toBeGreaterThan(speciesPrompt);
    expect(appSource).toContain("{ value: '__custom__', label: '다른 동물 직접 적기…' }");
    expect(appSource).toContain('patientSpeciesCandidates');
  });

  it('keeps names player-authored and permits active patient identity corrections', () => {
    expect(appSource).toContain('환자 이름 (선택 · 지금 정하거나 진료 중에 수정)');
    expect(appSource).toContain('onClick={handleEditActivePatientIdentity}>이름·종 수정');
    expect(appSource).toContain('activeAilment: s.activePatientId === patient.id && s.activeAilment');
    expect(appSource).toContain('patientArchive: s.patientArchive.map(record => record.patientId === patient.id');
    expect(appSource).toContain("journal.title.startsWith('새 환자:')");
    expect(appSource).toContain("text: [`첫인상: ${patientImpression}`, ...journal.text.split('\\n').slice(1)].join('\\n')");
    expect(appSource).toContain('const patientImpressionLabel');
    expect(appSource).toContain('<strong>첫인상:</strong>');
    expect(appSource).toContain('patientImpressionLabel(treatmentPatient.personality, treatmentPatient.descriptor)');
    expect(appSource).not.toContain('`성격: ${patientPersonalityLabel(treatmentPatient.personality)}`');
    expect(appSource).not.toContain('`동물 범주: ${localizeCharacterDescriptor(treatmentPatient.descriptor)}`');
  });
});

describe('local-care journey composition', () => {
  it('replaces the fixed map and route editor with a full-width progress summary while local help is required', () => {
    expect(appSource).toContain('const localCarePhase = Boolean(state.journeyActive && (');
    expect(appSource).toContain('|| state.activePatientId');
    expect(appSource).toContain('&& !state.activePatientId && !state.activeAilment && !state.scroungingMode');
    expect(appSource).toContain('현지 진료 중 여정 요약');
    expect(appSource).toContain('진료를 마치면 지도와 다음 이동 경로 편집기가 다시 열립니다.');
    expect(appSource).toContain("play-with-map${localCarePhase ? ' play-with-map--care' : ''}");
    expect(appSource).toContain('{!localCarePhase && (\n          <div id="active-journey-panel"');
    expect(appSource).toContain('{!localCarePhase && (\n              <>\n                <div className="prose-summary"');
    expect(cssSource).toContain('.play-with-map.play-with-map--care');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
  });

  it('keeps the physical encounter-card override optional and collapsed by default', () => {
    expect(appSource).toContain('실물 덱의 조우 카드 사용');
    expect(appSource).toContain('Move를 확정할 때 앱이 p.25 조우 카드를 자동으로 한 장 뽑는 것');
    expect(appSource).not.toContain('<strong>도착지 조우</strong>');
  });
});

describe('treatment tool layout', () => {
  it('wraps long tool names inside responsive columns instead of crossing the workspace edge', () => {
    expect(cssSource).toContain('grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));');
    expect(cssSource).toContain('.treatment-option--tool strong');
    expect(cssSource).toContain('word-break: break-word;');
  });
});
