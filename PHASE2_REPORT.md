# Phase 2 Gameplay Engine Integration Report

## 완료 범위

Phase 1 canonical data를 실제 gameplay transaction의 유일한 입력으로 연결했다. 일반 Move, 도착 Encounter, Foraging, Treatment, Patient 생성, Timer, Downtime, Season 경계는 `src/rules` resolver를 거쳐 상태를 변경한다. 기존 UI 형태는 유지하고 현재 행동, 환자·Timer, Inventory, 미완료 판정을 Action Hub에 노출했다.

## 구현된 Rule ID

- 지도·이동: `MAP-002/003/005`, `TRAVEL-001/002/004-009`
- 환자·질환: `PATIENT-001-005`, `AILMENT-001/002/004/006/007`
- 채집·치료: `REMEDY-001/004-010`, `FORAGE-001-008`
- 휴식기·계절: `DOWNTIME-001/003-007`, `CLINIC-002/005/006`, `COMPANION-003`
- 표·저장·UX: `TABLE-001-005`, `SAVE-001-008`, `UX-001-003`

`Partial`로 남긴 ID는 기능이 없어서가 아니라 일부 printed effect, legacy action, 동시 편집 정책 또는 실제 지도 인접성 검증이 아직 완전하지 않기 때문이다.

## Stub에서 구현으로 변경

| 함수 | Phase 1 | Phase 2 |
|---|---|---|
| `resolveTravel()` | Encounter family 조회 | 실제 route/Speed/Carry/Waterway/Loch/Soar/일수/상태 transaction |
| `resolveEncounter()` | 정확한 행 조회 | choice 강제, 자동 효과, manual fallback, effect idempotency |
| `resolveForaging()` | Encounter 조회 | Availability/BR/FP/Tool/Inventory/Timer transaction |
| `resolveTreatment()` | Requirement AST 평가 | Part/Tool/Catalyse/FAIR/FOUL/Uses/보상/실패/저널 원자 transaction |
| `resolvePatient()` | 주어진 Ailment graph 생성 | 카드 기반 정체성/Severity/Reputation/Monarch/복수 Timer 생성 |
| `resolveSeason()` | 다음 계절 반환 | Downtime/Clinic/Garden/Income/Goodwill/Companion 경계 transaction |
| `resolveTimer()` | 기본 순수 감소 | UI 행동과 복수 Timer/실패 transaction 연결 |
| `resolveDowntime()` | 없음 | 활동 1회 제한과 자동/수동 결과 분리 |

## 판정 변화

| 상태 | 이전 | 현재 | 변화 |
|---|---:|---:|---:|
| Exact | 6 | 44 | +38 |
| Partial | 63 | 65 | +2 |
| Incorrect | 51 | 23 | -28 |
| Missing | 14 | 5 | -9 |
| UI-only | 7 | 5 | -2 |
| Ambiguous | 3 | 2 | -1 |
| House Rule | 7 | 7 | 0 |

상태 변경 ID:

`MAP-002/003/005`, `TRAVEL-001/004-009`, `PATIENT-001-004`, `AILMENT-001/002/004/006`, `REMEDY-001/004-007/009/010`, `FORAGE-002/003/005-008`, `DOWNTIME-001/003/004/006/007`, `CLINIC-002/006`, `COMPANION-003`, `TABLE-001-005`, `SAVE-002/003/005-008`, `UX-003`.

## 테스트

- Phase 1: 25 tests
- Phase 2 추가: 13 tests
- 현재: 4 files / 38 tests

추가 테스트는 실제 route/Soar, Encounter 중복 방지, Foraging FP/Part/Timer, Treatment 원자성·Tool·선물, 카드 기반 Patient, 복수 Timer, Downtime, Season/Clinic/Companion, schema v3 migration을 검증한다. 테스트 이름에 기존 `RULE_TRACEABILITY.md` ID를 사용했으며 새 Rule ID는 만들지 않았다.

브라우저 QA는 desktop/mobile에서 핵심 진행판과 지도를 확인했다. 문서 가로 넘침은 제거했고 지도 캔버스만 내부 스크롤하며, 현재 위치·서비스 안내 라벨은 고대비 배경으로 판독 가능하다. console error/warning은 0건이다.

## 남은 Stub과 Risk

- Encounter 경고 행 10개와 다수 Ailment 고유 효과가 `manual-only`다.
- Barter, Barrow Delve, Journey 생성·Goal·Ending, Guild Service, Tool Upgrade 일부가 legacy 계산을 사용한다.
- 인접 Foraging Region을 실제 지도 edge로 검증하지 않는다.
- Rumour와 Downtime 세부 선택 결과는 manual adapter다.
- 치료 확정 전 draft는 저장하지 않으며, 동일 revision의 다중 장치 편집 merge/outbox가 없다.
- `App.tsx`의 기존 lint 8 errors / 5 warnings와 큰 bundle chunk 경고가 남아 있다.

## 다음 Phase 권장 작업

1. Encounter/Ailment printed effect 전사와 executor 확장.
2. Barter와 모든 Timer 비용을 canonical transaction으로 통합.
3. Journey 목적지·Goal·Ending을 지도 graph와 resolver로 이동.
4. Barrow/Guild Service/Tool Upgrade/Downtime 세부 규칙 구현.
5. legacy write path 제거, 치료 draft 및 동시 편집 복구 강화.
