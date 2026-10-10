# 독립 룰북 검토 후 핵심 판정 엔진 감사

룰북을 먼저 읽고 `rulebook-independent-core-2026-10-08.md`에 기록한 다음, `src/rules`의 Journey, Travel, Foraging, Barter, Immediate Remedy, Treatment 처리와 관련 테스트를 비교했다. App.tsx의 후속 카드 엔진 입력과 규칙 비교도 대조했다.

## 수정한 확정 불일치

1. **글을 쓰지 않으면 Journey가 끝나지 않음**: p.7의 선택적 journaling, p.38의 'Journal ... if you like'에 반했다. `journeyEngine.ts`는 이제 `journalText: ''`를 명시적으로 전달하면 종료한다. `undefined`인 재오픈은 저장된 결과/글이 있어도 draft로 남으므로 재로드가 자동 종료를 일으키지 않는다. 빈 글을 가짜 playerMemory로 기록하지 않고 기계적 system log만 남긴다.
2. **준비 도구 없으면 Part 채집 자체를 차단**: p.12/27/31~32는 physical Parts 수집과 Remedy preparation을 구분한다. `foragingEngine.ts`의 일반/Replacement/In Bloom 수집에서 준비 도구 검증을 제거했다. Season별 Part 제한, Availability, Rarity, FP, 한 번에 한 Reagent, quantity, Musk1bottle 제한은 유지했다. `treatmentEngine.ts`의 준비 도구 검증은 그대로 남아 있다. 구체적 회귀 시나리오: Summer Forest의 Cherries를 Pan 없이 수집 가능 → Fond Farewell에 사용하려고 하면 Pan 부재로 invalid → Pan 추가 시 cured.
3. **Knife 없는 ordinary miss에도 FP+1**: p.12/66의 Knife ability를 반영했다. 일반 실패 보상은 usable canonical belt-knife가 있을 때만 지급한다. Knife upgrade는 canonical belt-knife이므로 포함하며 broken/consumed state는 제외한다. direct Encounter/Familiar의 명시적 FP 지급은 specific exception이라 차단하지 않는다. 기존 잘못된 positive-FP fixtures는 knife를 갖도록 교정했다.
4. **저장한 K 후속 카드를 엔진이 거절함**: UI는 실제 K를 13으로 보존하지만 p.6의 규칙 값은 Q/K 모두 Monarch 12다. Alluring Odours의 FAIR 부위를 고른 뒤 invalid-card가 된 실제 브라우저 문제를 확인했고, typed Foraging 플래너의 전체 카드 입력을 정규화했다. App의 P1 Mushroom Junior, 최초/반복 Snap Quick, Flock 원 채집/양 카드, Password J/M 조건, Knights 도착 전투, Sain 선물의 값 비교와 판정 입력도 `getRuleCardValue`를 거친다. 물리 카드 기록·이미지·표시와 실제 Q→K 변경 감지는 유지한다. K=13을 엔진 값으로 허용하여 수치를 13으로 계산하는 오류는 도입하지 않았다.

한국어 ReaderGuide p.32–33, 플레이 용어집, 한국어 룰북 p.29/32의 무조건 실패점수 설명도 usable Knife 조건과 개조/별도 지급 예외에 맞췄다.

## 확인된 기존 강점

- `immediateRemedyEngine.ts`: gathering/encounter 후 Remedy가 가능하면 Timer를 유예하며, 특정 Ailment instance ID와 patient ID를 저장한다. 저장 후 inventory/tool 변경으로 Remedy가 불가능해지면 유예된 Timer cost를 한 번만 적용한다.
- `foragingEngine.ts`: rarity의 region/season +3, location별 계산, FP 자동 성공과 부족분 지출, 동일 Reagent의 여러 Parts, same-card Foraging Encounter, Hunted interruption, gathered-method Tool Timer bonuses를 분리한다.
- `barterEngine.ts`: local/trade route/season/FAIR/TAG3/FOUL/Reputation의 별도 공식, Social 후 second draw, haggling, Wake Timer+1, Remedy 가능 시 Timer 유예를 지원한다.
- `travelEngine.ts`: over-encumbrance, Loch stop gate, Waterways/Soaking, Soar restrictions/Experimental Wagon3Days, Soar landing에서 Soar table을 유지한다.
- `treatmentEngine.ts`: 일반 TAG max와 FAIR/FOUL stack/net, 실제 available Tools와 broken/consumed 검증, OR/특수 요구조건, multi-Ailment 상태, selected ingredients/remaining uses, gifting/rewards, meaningful manual follow-up을 지원한다.
- `journeyEngine.ts`: canonical destination, pending transaction/manual effect, active local patient를 종료 전 검증하며, ending draft와 replay를 보존한다.

## 의도적으로 자동 교정하지 않은 원문 문제

Crestfallen/Nervefright/Seasonshift severity 충돌, Wagon15/20cost 충돌, Parts0의 forage-time X-1 해석, barter attempt scope, Groundhog/Wake의 일부 dose 해석, Woeful Waters 인덱스 누락 등은 앞선 독립 문서에 기록했다. 원문 충돌을 엔진의 fabricated errata로 조용히 해결하지 않았다.

## 검증

최종 focused run: `rulebookPlayLoopFidelity`, `gameplayEngine`, `customRemedyAcquisition`, `step3Canonical`, `phase3Engine`, `immediateRemedyEngine`의 **6개 파일 / 117개 테스트 모두 통과**.

새 회귀 테스트는 선택적 종료의 replay/save-resume, harvest와 preparation의 분리, seasonal Part 제한, Knife 정상/부재/broken 상태, specific Encounter FP exception을 검증한다. 전체 앱의 최종 build/UI 검증은 통합 담당 범위다.

전체 회귀 추가 검증: `npm test -- --reporter=json --outputFile=tmp/rulebook-independent/full-test-results.json`에서 **1,423개 중 1,422개 통과**. Rules/Data/Engine/Localization 테스트는 전부 통과했다. 유일한 실패는 App source의 정확한 문자열을 검사하는 `patientJourneyExperience.test.ts:51`의 'closes a cured patient hold when the last Scrounging Timer is spent'이며, 통합 담당에게 보고했다. 백업 dependency 폴더가 처음에는 Vitest에 수집되었지만, 통합 담당이 이를 저장소 밖으로 옮긴 뒤 이 전체 결과를 다시 확보했다.

새 엔진 메시지(선택적 종료, Knife/Tool 보정에 따른 FP0/1/2 이상)는 한국어 presentation layer와 동적 번역 회귀 검사에 반영했다. 수정한 Rules/Localization7파일의 ESLint도 통과했다. Ingenuitive Familiar의 Tool은 앱이 virtual CanonicalToolState로 제공하므로 Knife 보상 판정에서도 정상적으로 사용할 수 있다.

카드 경계 검증: 실제 App 콜백을 실행하는 `secondaryCardRuleBoundary.test.ts`에서 저장 K의 Junior 정산, 새 K의 Snap Quick 정산, K와 Q 목표의 Sain 값 매칭 및 명령을 검증한다. 관련 4개 파일 **51개 테스트**, 추가된 TS의 ESLint, `tsc -b`가 통과했다. 최신 전체 회귀는 **1,438개 중 1,437개 통과**했고, 유일한 실패는 `encounterExperience.test.ts:140`의 변경된 App UI 문자열 기대다. Rules/카드 경계 검사는 전부 통과했으며 해당 UI 검사 갱신은 통합 담당에게 전달했다.
