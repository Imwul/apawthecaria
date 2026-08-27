// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/App.tsx', 'utf8');

describe('foraging workflow order', () => {
  it('records the reagent research list before drawing, then leaves the gathered part choice until after the card', () => {
    const planningStep = appSource.indexOf('<legend>1. 들녘 조사 노트</legend>');
    const drawStep = appSource.indexOf('label="2. 채집 카드"');
    expect(planningStep).toBeGreaterThan(-1);
    expect(drawStep).toBeGreaterThan(planningStep);
    expect(appSource).toContain('카드 값과 기록한 희귀도를 비교한 뒤, 발견한 재료 중 실제로 가져갈 부위를 정합니다.');
    expect(appSource).toContain("forageContext.actionAllowed ? (");
    expect(appSource).toContain('const forageActionLabel = forageDrawCard');
    expect(appSource).toContain('`이 카드로 ${foragePlaceLabel} 채집하기`');
    expect(appSource).toContain('`${foragePlaceLabel} 카드 뽑고 채집하기`');
    expect(appSource).not.toContain('disabled={!effectiveForageTargetReagentId}');
  });

  it('keeps the pastoral research note player-controlled without optimizer steering', () => {
    expect(appSource).toContain('환자의 처방에 보탤 힘을 미리 살펴보세요');
    expect(appSource).toContain('이 메모는 선택을 돕는 조사 기록입니다. 실제 채집은 카드를 뽑은 뒤 발견 목록에서 정합니다.');
    expect(appSource).toContain('role="group" aria-label={`${effectiveForageTargetTag} 채집 후보`}');
    expect(appSource).toContain('const progress = deriveForageRequirementProgress');
    expect(appSource).toContain('const covered = progress.satisfied');
    expect(appSource).toContain('progress.potential');
    expect(appSource).toContain('aria-pressed={selected}');
    expect(appSource).toContain('previous.filter(reagentId => reagentId !== row.reagent.id)');
    expect(appSource).toContain("[...previous, row.reagent.id]");
    expect(appSource).toContain('실제 획득 재료는 카드 판정 뒤 플레이어가 정합니다.');
    expect(appSource).toContain('기억해 두기');
    expect(appSource).not.toContain('right.bestCoverageCount - left.bestCoverageCount');
    expect(appSource).not.toContain('left.breakdown.finalRarity - right.breakdown.finalRarity');
    expect(appSource).not.toContain('is-recommended');
    expect(appSource).not.toContain('먼저 살펴보기');
    expect(appSource).not.toContain('id="forage-target-reagent"');
  });

  it('keeps the physical-card entry path while naming the random action clearly', () => {
    expect(appSource).toContain("'랜덤 뽑기'");
    expect(appSource).toContain('오프라인에서 뽑은 카드 입력');
  });

  it('distinguishes immediate and point-assisted gather options from completed acquisition', () => {
    expect(appSource).toContain('이번에 채집할 수 있는 재료');
    expect(appSource).toContain("? `FP ${normalizedFind.gapCost} 사용 가능`");
    expect(appSource).toContain("handleRecordForageMiss(normalizedFind)");
    expect(appSource).not.toContain('이번 카드로 발견한 재료');
  });

  it('shows seasonally obtainable effects per part and marks preparation methods blocked by missing tools', () => {
    expect(appSource).toContain('const foragePreparationOptions = (find: ForageFind) =>');
    expect(appSource).toContain('isForagingPreparationAvailableInSeason(part, state.currentSeason)');
    expect(appSource).toContain("missingTools: part.requiredTools.filter(tool => tool !== 'none' && !forageToolIds.has(tool))");
    expect(appSource).toContain('const availableForagePartOptions = (find: ForageFind) => foragePreparationOptions(find).map(({ part, missingTools }) => ({');
    expect(appSource).toContain('tagGroups: splitForagingTags(part.tags)');
    expect(appSource).toContain('className="forage-candidate__tags"');
    expect(appSource).toContain('부위와 조제법마다 얻을 수 있는 효과');
    expect(appSource).toContain('부위별 효과 · 한 줄이 한 가지 선택지입니다');
    expect(appSource).toContain('흐린 행은 필요한 조제 도구가 없어 이번에는 고를 수 없습니다.');
    expect(appSource).toContain('{tag} {value}');
    expect(appSource).not.toContain('highestValueByTag');
  });

  it('separates patient-remedy tags from the FAIR/FOUL reward modifiers before part selection', () => {
    expect(appSource).toContain('remedyTags: tagGroups.remedy.map(tag => `${tag.tag} ${tag.value}`)');
    expect(appSource).toContain('tradeTags: tagGroups.trade.map(tag => `${tag.tag} ${tag.value}`)');
    expect(appSource).toContain('<small>치료 약효</small>');
    expect(appSource).toContain('<small>거래 가치 · FAIR/FOUL</small>');
    expect(appSource).toContain('일반 치료 태그와 FAIR/FOUL 거래 가치는 서로 다른 칸에서 확인하세요.');
    expect(appSource).toContain('도구가 없는 조제법도 미리 볼 수 있지만 이번에는 선택할 수 없습니다.');
    expect(appSource).toContain('disabledReason: missingTools.length > 0');
    expect(appSource).toContain('선택한 행의 효과만 획득');
  });

  it('keeps optional gather decisions inside the app without changing decline semantics', () => {
    const gatherStart = appSource.indexOf('const handleAddForageFindToBag');
    const gatherEnd = appSource.indexOf('\n  const applyEncounterStateEffect', gatherStart);
    const gatherSource = appSource.slice(gatherStart, gatherEnd);

    expect(gatherSource).not.toContain('askWindowConfirm');
    expect(gatherSource).toContain("title: '화강암 절구와 공이를 사용할까요?'");
    expect(gatherSource).toContain("poundWithGranite = graniteChoice === 'pound'");
    expect(gatherSource).toContain("title: '채집 포인트를 사용할까요?'");
    expect(gatherSource).toContain("cancelLabel: '사용하지 않고 실패 기록'");
    expect(gatherSource).toContain("spendGap = gapChoice === 'spend'");
    expect(gatherSource).toContain('const gatherWillSucceed = Boolean(find.cardSuccess || find.fpAvailable || spendGap)');
    expect(gatherSource).toContain('if (gatherWillSucceed && graniteMortar');
    expect(gatherSource).toContain('if (gatherWillSucceed && hasEfficientKettle');
    expect(gatherSource.indexOf("title: '채집 포인트를 사용할까요?'")).toBeLessThan(gatherSource.indexOf("title: '화강암 절구와 공이를 사용할까요?'"));
  });

  it('keeps Scrounging part selection in-app and leaves state unchanged when cancelled', () => {
    const scroungeStart = appSource.indexOf('const handleScroungeGainReagent');
    const scroungeEnd = appSource.indexOf('\n  const handleFinishScrounging', scroungeStart);
    const scroungeSource = appSource.slice(scroungeStart, scroungeEnd);

    expect(scroungeSource).not.toContain('prompt(');
    expect(scroungeSource).toContain("title: '여분 채집으로 얻을 부위를 고르세요'");
    expect(scroungeSource).toContain('각 행에서 치료 약효와 거래 가치를 확인하세요.');
    expect(scroungeSource).toContain('searchable: {');
    expect(scroungeSource).toContain('const { remedy, trade } = splitForagingTags(part.tags);');
    expect(scroungeSource).toContain('remedyTags,');
    expect(scroungeSource).toContain('tradeTags,');
    expect(appSource).toContain('controlled-prompt__search-tag-group');
    expect(appSource).toContain('거래 가치 · FAIR/FOUL');
    expect(scroungeSource).toContain('if (chosenPartId === null) return;');
    expect(scroungeSource).toContain('eligibleParts.find(part => part.id === chosenPartId)');
    expect(scroungeSource.indexOf('if (chosenPartId === null) return;')).toBeLessThan(scroungeSource.indexOf('resolveScrounge({'));
  });

  it('records guaranteed Scrounging in the Journey goal using the selected Region', () => {
    const scroungeStart = appSource.indexOf('const handleScroungeGainReagent');
    const scroungeEnd = appSource.indexOf('\n  const handleFinishScrounging', scroungeStart);
    const scroungeSource = appSource.slice(scroungeStart, scroungeEnd);
    expect(scroungeSource).toContain("const transactionId = createClientTransaction('scrounge:guaranteed').id;");
    expect(scroungeSource).toContain("type: 'forage'");
    expect(scroungeSource).toContain('reagentId: reagent.id');
    expect(scroungeSource).toContain('region: toRuleRegion(region)');
    expect(scroungeSource).toContain('journey: recordCanonicalJourneyEvent');
  });

  it('uses the canonical Korean region name in every player-facing foraging hint', () => {
    expect(appSource).toContain('야생 구역, 티탄 유적, 거수 고분');
    expect(appSource).not.toContain('Titan 유적');
  });

  it('uses the selected encounter branch for follow-up cards and the whole prescription for acquisition state', () => {
    expect(appSource).toContain('const hasSecondaryDraw = encounterChoiceRequiresSecondaryCard(activeForageEncounter, selectedForageChoiceId)');
    expect(appSource).not.toContain('const secondaryDrawPhrases');
    expect(appSource).toContain('canTreatAilmentWithInventory(');
    expect(appSource).toContain('(treatmentPatient && treatmentAilment && !treatmentCanTreatFromOwned)');
    expect(appSource).not.toContain("treatmentRequirementRows.some(row => row.state === 'missing')");
  });

  it('scopes replacement acquisition to the patient and clears it at terminal patient actions', () => {
    expect(appSource).toContain('patientId: state.activePatientId');
    expect(appSource).toContain('ailmentInstanceId: state.activeAilment.id');
    expect(appSource).toContain('pendingAlternativeAcquisition: null');
    expect(appSource).toContain('이 대체 약재 기록은 이전 환자의 처방에 속해 있어 정리했습니다.');
  });

  it('only describes suit directions in the journey destination card control', () => {
    expect(appSource).toContain('showSuitDirections = false');
    expect(appSource).toContain('aria-label={`${suit}${showSuitDirections ? ` · ${direction}` : \'\'}`}');
    expect(appSource).toContain('{showSuitDirections && <small>{direction}</small>}');
    expect(appSource).toMatch(/label="목적지와 방향 카드"\s+showSuitDirections/);
  });

  it('shows each planned preparation once in the contribution column', () => {
    expect(appSource).toContain('className="forage-target-row__part-tags"');
    expect(appSource).not.toContain('forage-target-row__preparations');
  });
});
