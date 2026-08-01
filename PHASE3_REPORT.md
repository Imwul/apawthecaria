# Phase 3 Journey, Barter and Printed Effects Report

## 구현 범위

Phase 2 canonical engine을 유지하면서 Journey, Barter, Ending, Leave/Pawn, Ailment 예외와 Archive를 pure transaction으로 확장했다. UI는 기존 구성을 유지하되 Journey Setup, Barter 단계, Goal 근거, Ending 차단 사유, Scrounge/Pawn과 canonical Archive를 새 상태에 연결했다. 최종 브라우저 검증에서 Archive 빈 상태 중복, 보류한 Encounter의 즉시 재개방, 모바일 환자 그리드 가로 넘침과 blocking save-import alert도 수정했다.

이번 Phase의 새 핵심 모듈:

- `src/rules/journeyEngine.ts`: graph Destination, 12 Goal, Journey 시작·진행·Ending
- `src/rules/barterEngine.ts`: 시작·Social·Offer·혼합 결제·포기 transaction
- `src/rules/leaveEngine.ts`: Scrounge, Make Do/Replacement 요구, Pawn, Leave
- `src/rules/ailmentEffectEngine.ts`: 일반식보다 우선하는 질환별 진단·Timer·결과
- `src/rules/printedEffects.ts`: 313 Encounter + 45 Ailment 상태 registry
- `src/rules/archiveEngine.ts`: canonical Archive와 실패 보존 정규화
- `src/rules/data/printedEncounterOverrides.ts`: 원문 경고 10행 대조 결과

## Printed Effect Executor

358개 owner가 trigger, prerequisites, 상태 변화 범주, follow-up, journal, manual reason, page, Rule ID, executor와 test를 가진다. 현재 3개는 자동 `implemented`, 355개는 `manual`이다. 수치로 안전하게 결정할 수 없는 지도 선택·후속 카드·아이템 정체·서술 결과를 임의 자동화하지 않았다.

경고 10행은 원본 PDF p77, p78, p86, p93, p95, p97, p171과 직접 대조했다. 선택이 필요한 행은 Resolve 전 진행을 막고, 선택·effect ID가 확정된 뒤 한 번만 적용한다.

## Barter Transaction

`resolveBarterStart()`가 실제 graph의 현재/인접 Settlement·City, 환자별 1/3회 한도, 비-Titan Reagent와 선택 Preparation을 검증한다. `calculateBarterBR()`은 Local, 3 Paths Trade Route, In Season, Curiosity, FAIR, Tag 3, FOUL, Reputation을 구조화된 modifier로 반환한다.

Social Encounter와 첫 카드를 저장한 뒤에만 두 번째 카드를 뽑는다. Q/K는 M=12이며 부족분은 Trinket과 Reputation을 섞어 정확히 지불한다. 성사 후에도 완성 Remedy가 없거나 포기하면 복수 Ailment의 모든 활성 Timer를 한 번 감소시킨다.

## Journey와 Goal

Destination 카드는 suit 방향, 카드값 거리와 위치 유형을 실제 지도 graph 후보에 강제한다. Journey 시작은 Origin, Season, Destination, Reason, Goal, Urgency를 한 transaction과 저널에 저장한다. Justice Evidence는 Weight 1이다.

12개 Goal은 Inventory, Reputation, Region/Location 방문, 치료와 저널 event를 근거로 평가한다. 서술 판단이 필요한 Goal은 자동 근거와 플레이어 선언을 분리한다. 자유 수동 카운터는 canonical 완료 판정에 사용하지 않는다.

## Ending

현재 위치가 실제 Destination이 아니거나 pending Encounter/Barter/Foraging, unresolved Patient가 있으면 Ending을 거부한다. 성공·부분 성공·실패·중단과 회고를 저장하고 Downtime을 요구한다. `original-1e-3p`에는 고정 +5/-3 Reputation이 없으며 기존 `legacy-campaign`만 호환용 stakes를 유지한다.

## Leave, Remedy Alternatives와 Pawn

Scrounge는 복수 Timer 전부의 잔여량, graph 인접 Region, 일반 Foraging, Potency 2 이하 보장 Part와 현재/인접 비용 1/2/3/4를 검증한다. 미완료 Encounter/Delve obligation은 다음 Move를 막는다.

Make Do는 +1 Potency 획득 조건을 저장하고 실제 canonical Part를 확인한다. Replacement는 이름, Preparation, Rarity 12, Weight 2/3의 pending 요구를 저장하며 원작 모드의 직접 placeholder 생성을 차단했다. 다만 Rarity 12 성공을 custom Inventory item으로 커밋하는 Forage/Barter transaction은 아직 연결되지 않아 `REMEDY-003 Partial`이다.

Pawn은 여러 Prepared Reagent/Tool/Oddment의 남은 Weight를 합산해 한 번 반올림하고 Inventory 제거와 Trinket 지급을 idempotent transaction으로 처리한다.

## Archive와 저장

canonical Archive는 case/patient ID와 이름, Personality/Descriptor, 복수 Ailment/Timer, Remedy, 결과, 성공/실패, 보상·패널티, 위치·시간, special effect, Journal/Journey/transaction ID와 여섯 상태를 저장한다. unresolved를 성공으로 바꾸지 않으며 실패를 stale write가 덮지 못한다.

schema v4는 pending Barter/Journey/Ending/Leave/Alternative Acquisition, Archive와 Ailment instance effect 상태를 보존한다. v3 이하 Save는 순차 migration하며 네 종류 hostile save로 검증했다.

## 변경된 Rule ID

| Rule ID | Before | After | 변경 근거 | 구현 | Test | 남은 제한 |
|---|---|---|---|---|---|---|
| `JOURNEY-001` | Partial | Exact | Reason 포함 시작 기록 | `journeyEngine.ts`, `App.tsx` | `[JOURNEY-001]` | 없음 |
| `JOURNEY-003` | Incorrect | Exact | graph 합법 후보만 선택 | `journeyEngine.ts` | `[JOURNEY-003]` | 후보 없음은 재추첨 필요 |
| `JOURNEY-004` | Partial | Exact | 12 Goal 상태 근거 판정 | `journeyEngine.ts` | `[JOURNEY-004]` | 서술 Goal은 선언 필요 |
| `JOURNEY-006` | Incorrect | Exact | Evidence Weight 1 | `journeyEngine.ts` | `[JOURNEY-001/JOURNEY-006]` | 없음 |
| `TRAVEL-008` | Partial | Exact | 103행 key와 경고행 대조 | `data/encounters.ts` | `[TRAVEL-008]` | 효과는 `TRAVEL-009` 추적 |
| `TRAVEL-010` | Incorrect | Exact | 목적지 외 Ending 차단 | `journeyEngine.ts` | `[TRAVEL-010]` | 없음 |
| `AILMENT-003` | UI-only | Partial | 핵심 11종 예외 상태화 | `ailmentEffectEngine.ts` | `[AILMENT-003]` | 다수 후속 효과 manual |
| `AILMENT-005` | Incorrect | Partial | 규칙을 바꾸는 핵심 오역 교정 | `gameData.ts` | `[AILMENT-003/AILMENT-005]` | 45종 전 문장 독립 대조 남음 |
| `REMEDY-001` | Partial | Exact | Forage/Barter 공통 Availability | `foragingEngine.ts`, `barterEngine.ts` | `[REMEDY-001]` | 없음 |
| `REMEDY-002` | Incorrect | Exact | 직접 생성 금지, +1 실제 Part | `leaveEngine.ts`, `App.tsx` | `[REMEDY-002]` | 없음 |
| `REMEDY-003` | Incorrect | Partial | pending Rarity 12 요구 저장 | `leaveEngine.ts`, `App.tsx` | `[REMEDY-003]` | 획득 commit 미연결 |
| `FORAGE-008` | Partial | Exact | 144행 분포·경고행 대조 | `data/encounters.ts` | `[FORAGE-008]` | 효과는 `FORAGE-006` 추적 |
| `BARTER-001` | Partial | Exact | graph 위치·Titan·Preparation | `barterEngine.ts` | `[BARTER-001]` | 없음 |
| `BARTER-003` | Incorrect | Exact | 인쇄 BR modifier 전부 구조화 | `barterEngine.ts` | `[BARTER-003]` | 없음 |
| `BARTER-005` | Partial | Exact | Social 후 두 번째 카드 | `barterEngine.ts` | `[BARTER-005]` | Social 효과는 manual 가능 |
| `BARTER-006` | Partial | Exact | 혼합 결제 | `barterEngine.ts` | `[BARTER-006]` | 없음 |
| `BARTER-007` | Partial | Exact | 복수 Timer 포기 비용 | `barterEngine.ts` | `[BARTER-007]` | 없음 |
| `BARTER-008` | Incorrect | Exact | Q/K=M=12 | `cards.ts`, `barterEngine.ts` | `[BARTER-008]` | 없음 |
| `LEAVE-001` | Partial | Exact | 모든 Timer 조건 | `leaveEngine.ts` | `[LEAVE-001]` | 없음 |
| `LEAVE-002` | Partial | Exact | graph 인접·일반 채집 | `leaveEngine.ts`, `App.tsx` | `[LEAVE-002]` | 없음 |
| `LEAVE-003` | Partial | Exact | Potency·비용 3/4 | `leaveEngine.ts` | `[LEAVE-003]` | 없음 |
| `LEAVE-005` | Incorrect | Exact | 총 Weight 한 번 반올림 | `leaveEngine.ts` | `[LEAVE-005]` | 없음 |
| `ENDING-001` | Partial | Exact | 목적지·Goal·pending 검증 | `journeyEngine.ts` | `[ENDING-001]` | 없음 |
| `ENDING-002` | House Rule | Exact | 원작 고정 평판 제거 | `journeyEngine.ts` | `[ENDING-002]` | legacy만 기존 stakes |
| `ENDING-003` | Partial | Exact | 회고·선택 결과·Downtime | `journeyEngine.ts` | `[ENDING-003]` | 없음 |
| `TABLE-001` | Partial | Exact | Travel key/분포/경고행 | `data/encounters.ts` | `[TABLE-001]` | 효과 자동화 별도 |
| `TABLE-004` | Partial | Exact | Foraging key/분포/경고행 | `data/encounters.ts` | `[TABLE-004]` | 효과 자동화 별도 |
| `ARCHIVE-001` | Partial | Exact | ID·정체성·상태 | `archiveEngine.ts` | `[ARCHIVE-001]` | 없음 |
| `ARCHIVE-002` | Partial | Exact | 결과 세부 필드 | `archiveEngine.ts` | `[ARCHIVE-002]` | 없음 |
| `ARCHIVE-003` | Incorrect | Exact | 실패 정규화·덮어쓰기 방지 | `archiveEngine.ts` | `[ARCHIVE-003]` | 없음 |
| `ARCHIVE-004` | Partial | Exact | v4 migration·hostile save | `migrations.ts` | `[ARCHIVE-004/SAVE-005]` | 없음 |

## 준수 숫자

| 상태 | Before | After | 변화 |
|---|---:|---:|---:|
| Exact | 44 | 72 | +28 |
| Partial | 65 | 49 | -16 |
| Incorrect | 23 | 13 | -10 |
| Missing | 5 | 5 | 0 |
| UI-only | 5 | 4 | -1 |
| Ambiguous | 2 | 2 | 0 |
| House Rule | 7 | 6 | -1 |

합계는 151개다. Registry row만 추가한 규칙이나 manual fallback만 있는 규칙은 Exact로 승격하지 않았다.

## 테스트와 검증

- Phase 3 engine test: 22 cases
- Validator 추가: 1 case
- 전체: 5 files / 61 tests
- `npx tsc --noEmit`: Pass
- `npm run validate:rules`: Pass, Error 0 / Warning 0
- `npm run build`: Pass. 단일 JS chunk 1,410.75 kB로 Vite의 500 kB 경고는 남는다.
- `src/rules`, `src/gameData.ts` lint: 새 오류 0. 전체 범위에는 기존 `App.tsx` 8 errors / 5 warnings가 남는다.
- Browser desktop/mobile: Journey Setup, Barter 결제, 강제 선택 Encounter, Ending, Archive를 확인했다. 콘솔 error/warn 0이며 좁은 viewport의 horizontal overflow는 0이다.

검증 스크린샷:

- `output/phase3/journey-setup-desktop.png`
- `output/phase3/journey-setup-candidates-desktop.png`
- `output/phase3/barter-payment-desktop.png`
- `output/phase3/encounter-forced-choice-desktop.png`
- `output/phase3/journey-ending-desktop.png`
- `output/phase3/patient-archive-desktop.png`
- `output/phase3/mobile-journey-390.png`

## 남은 Incorrect, Missing, UI-only

남은 13 Incorrect, 5 Missing, 4 UI-only의 권위 목록은 `RULE_TRACEABILITY.md`다. 주된 묶음은 Barrow, Guild Service, Tool/Upgrade, co-op/Send Package, offline outbox/RNG 복구와 아직 실행되지 않는 printed effect다.

## 다음 Phase 권장안

1. 355개 manual printed effect 중 결정 가능한 수치·조건 행부터 executor로 전사한다.
2. Replacement Rarity 12 획득을 Forage/Barter transaction에 연결한다.
3. legacy 환자 포기 UI를 `resolveLeave()`와 canonical Archive로 통합한다.
4. Barrow, Guild Service, Tool Upgrade를 기존 Rule ID와 schema에 연결한다.
5. 치료 draft 저장과 다중 장치 충돌 복구를 마친 뒤 legacy adapter를 줄인다.
