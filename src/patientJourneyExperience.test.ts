// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/App.tsx', 'utf8');
const cssSource = readFileSync('src/index.css', 'utf8');

describe('patient identity experience', () => {
  it('lets the descriptor card lead to rulebook animal candidates before severity is drawn', () => {
    const descriptorDraw = appSource.indexOf('let descriptorCard = intakeDraft.descriptorCard');
    const speciesPrompt = appSource.indexOf("title: '환자의 동물 종을 정하세요'", descriptorDraw);
    const severityDraw = appSource.indexOf('let severityCard = intakeDraft.severityCard', descriptorDraw);

    expect(descriptorDraw).toBeGreaterThan(-1);
    expect(speciesPrompt).toBeGreaterThan(descriptorDraw);
    expect(severityDraw).toBeGreaterThan(speciesPrompt);
    expect(appSource).toContain("{ value: '__custom__', label: '다른 동물 직접 적기…' }");
    expect(appSource).toContain('patientSpeciesCandidates');
  });

  it('records the complete severity decision and keeps canonical severity names visible', () => {
    expect(appSource).toContain('→ 원래 ${canonicalSeverityLabel(result.value.drawnSeverity)}');
    expect(appSource).toContain('Guild Reputation ${state.reputation} (${guildReputationRank(state.reputation)}) 상한 ${canonicalSeverityLabel(result.value.reputationSeverityLimit)}');
    expect(appSource).toContain('최종 적용 ${canonicalSeverityLabel(result.value.appliedSeverity)}');
    expect(appSource).toContain('중증도: {canonicalSeverityLabel(state.activeAilment.severity)}');
    expect(appSource).not.toContain('>병색의 깊이: {getNaturalSeverityDescription(state.activeAilment.severity)}');
  });

  it('keeps names player-authored and permits active patient identity corrections', () => {
    expect(appSource).toContain('환자 이름 (선택 · 지금 정하거나 진료 중에 수정)');
    expect(appSource).toContain('onClick={handleEditActivePatientIdentity}');
    expect(appSource).toContain('이름·종 수정');
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
  it('closes a cured patient hold when the last Scrounging Timer is spent', () => {
    expect(appSource).toContain('const canScrounge = runtime.patient.status === \'cured\' && remaining > 0;');
    expect(appSource).toContain('const keepsActiveTreatmentOpen = patientHasActiveAilments(runtime.patient);');
    expect(appSource).toContain('const activePatientId = keepsActiveTreatmentOpen');
    expect(appSource).toContain('keepsCuredPatientOpen');
    expect(appSource).toContain('if (!journeyUiContext.canMove) {\n      addActionHubItem({\n        id: \'clinic-open\'');
    expect(appSource).toContain("if (journeyUiContext.canMove && !state.pursuedByBehemoth\n      && !state.activeAilment && !state.scroungingMode)");
    expect(appSource).not.toContain("if (journeyUiContext.canMove && !state.pursuedByBehemoth\n      && !state.activePatientId && !state.activeAilment && !state.scroungingMode)");
  });

  it('replaces the fixed map and route editor with a full-width progress summary while local help is required', () => {
    expect(appSource).toContain('const localCarePhase = journeyUiContext.active && (');
    expect(appSource).toContain("journeyUiContext.phase === 'manual-pending'");
    expect(appSource).toContain("|| journeyUiContext.phase === 'foraging-pending'");
    expect(appSource).toContain("|| journeyUiContext.phase === 'local-care'");
    expect(appSource).toContain('현지 진료 중 여정 요약');
    expect(appSource).toContain('채집·물물교환은 질환 Timer를 쓰며 여정 달력은 그대로입니다.');
    expect(appSource).toContain('이번 여정의 목표');
    expect(appSource).toContain('Moving On · 다음 이동 준비');
    expect(appSource).toContain('이번 여정 다시 준비');
    expect(appSource).toContain('REVIEWED_MAP_LOCATION_BY_ID.get(journeyOriginId)\n          || MARKER_BY_ID.get(journeyOriginId)\n          || journeyMapNodes[journeyOriginId]');
    expect(appSource).toContain("play-with-map${localCarePhase ? ' play-with-map--care' : ''}");
    expect(appSource).toContain('{localCarePhase ? (\n          <section className="journey-care-context"');
    expect(appSource).toContain('{!localCarePhase && !journeyUiContext.atDestination && (\n          <div id="active-journey-panel"');
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

  it('does not turn a mixed failed/treated case into a cure or Scrounging phase', () => {
    expect(appSource).toContain("const allAilmentsCured = outcome.allAilmentsResolved && nextPatient.status === 'cured';");
    expect(appSource).toContain("treatmentResult: allAilmentsCured ? 'success' : outcome.allAilmentsResolved ? 'failure' : 'pending'");
    expect(appSource).toContain("curedAilmentInThisWilds: !isFixedEncounterRemedy && allAilmentsCured");
    expect(appSource).toContain("scroungingMode: !isFixedEncounterRemedy && allAilmentsCured && remainingTime > 0");
    expect(appSource).toContain('if (!outcome.allAilmentsResolved || (allAilmentsCured && remainingTime > 0)) return withArchive;');
  });

  it('settles Fire and Iron global Timer expiries before returning to the previous Patient', () => {
    expect(appSource).toContain('applyGlobalActiveTimerCost({');
    expect(appSource).toContain("transactionId: `${fixedSuccessTransactionId}:active-timer-cost`");
    expect(appSource).toContain('for (const expiredPatientId of globalTimerCost.expiredPatientIds)');
    expect(appSource).toContain('`${fixedSuccessTransactionId}:timer-expiry:${expiredPatientId}`');
    expect(appSource).toContain("state.appliedTransactionIds.includes(`${transactionId}:failure`)");
  });
});
