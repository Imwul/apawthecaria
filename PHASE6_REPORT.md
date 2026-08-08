# Phase 6 Report

## 범위

Phase 6은 schema v6 저장 무결성, Replacement 획득 완결, 공통 Tool trigger 계층, Printed Effect 분류, Almanack 상태 표시와 canonical Barrow 정보 UI를 다뤘다. 같은 실행에서 전체 화면을 warm botanical field journal 방향으로 재구성했다.

## 완료된 Closure

- `REMEDY-003`: custom name, Preparation, BR 12, Weight 2/3, target tag와 선택한 획득 출처를 저장한다.
- 원작 ruleset에서는 직접 생성하지 않는다. 실제 Forage 또는 Barter 성공 뒤 `commitAlternativeAcquisition()`이 provenance를 가진 item을 Inventory에 한 번만 추가한다.
- `SAVE-004`: schema v6 `TreatmentDraft`가 Patient/Ailment, Part, Preparation, Tool, FAIR/FOUL, Purify, Catalyse와 replacement context를 저장한다.
- 새로고침은 미완료 draft를 복원하고, 이미 적용된 transaction의 committed draft는 다시 열지 않는다.
- `resolveToolEffects()`가 phase, trigger, 선택, 파손, charge, consumed와 transaction idempotency를 한 계층에서 처리한다.
- Almanack은 Printed Effect Registry를 직접 사용해 `자동 처리 / 선택 필요 / 직접 처리 / 모호함`을 표시하고 필터링한다.
- 더 이상 호출되지 않던 화면 직접 계산형 치료 handler를 제거했다. 구버전 save read migration은 유지했다.

## Printed Effect Pass 1

Registry 총 358개 중 `implemented 3 → 10`, `manual 355 → 348`이다.

이번에 실행 상태를 맞춘 Ailment family:

`Brand Care`, `Forager's Twitch`, `Pinned by Pine`, `Quagmire's Scale`, `Stingshock`, `Wake`, `Wormridden`.

원문 서술, 지도 선택, 대상 item 선택 또는 장기 follow-up이 필요한 행은 자동 수치를 창작하지 않고 manual로 유지했다.

## Barrow

`BarrowPanel`은 8개 canonical Delve definition을 사용해 이름, 단계, Suit, 카드, 요구 조건, 진행도, 선택 item, Timer, Flee cost, reward, map consequence와 unresolved choice를 표시한다. 새로고침 뒤 저장된 legacy/canonical state를 같은 field note로 복원한다.

단, 실제 조작 handler 일부는 아직 legacy adapter다. 따라서 `BARROW-001-009`는 `Partial`을 유지한다. canonical UI only 완료로 과장하지 않는다.

## Visual Remaster

- `오늘의 여행`을 첫 화면으로 만들고 현재 캠페인 상태를 동적으로 사용한다. 약제사 이름은 프로필 본문 외의 장식 문구에 노출하지 않는다.
- Smithsonian CC0 수채화 `Forest, 1891`을 chapter opener로 사용하고 앱 안과 attribution 문서에 출처를 표시한다.
- 기존 sidebar dashboard는 새 journal bookmark navigation으로 대체했다.
- 환자, 필요한 약초, 위치, 배낭, 최근 저널을 독서 순서로 배치했다.
- Almanack은 card grid 대신 2단 자연사 색인으로 바꿨다.
- 기존 gameplay panel은 박스/그림자를 줄이고 field-note 선과 여백으로 통일했다.
- 모바일에서는 헤더 행동과 책갈피를 icon 중심으로 줄이고 접근성 이름을 유지한다.

## Compliance 변화

| 상태 | 이전 | 현재 |
|---|---:|---:|
| Exact | 82 | 84 |
| Partial | 59 | 57 |
| Incorrect | 0 | 0 |
| Missing | 0 | 0 |
| UI-only | 0 | 0 |
| Logic-only | 2 | 2 |
| Ambiguous | 2 | 2 |
| House Rule | 6 | 6 |

상태 변경 Rule ID: `REMEDY-003`, `SAVE-004`.

## 검증

- Validator: Error 0, Warning 0
- Tests: 9 files, 84 tests pass
- Lint: 0 errors, 0 warnings
- TypeScript: pass
- Production build: pass; main 627.22 kB, 500 kB warning 1개
- Browser: desktop/mobile horizontal overflow 0, image load pass, Almanack/Map smoke pass

## 남은 Partial

- 8 Barrow 조작 handler의 canonical transaction 직접 연결
- Tool layer를 Travel/Forage/Treatment/Barter/Barrow/Downtime/Season 모든 진입점에서 호출
- 348 narrative/manual Printed Effect의 원문 보존 UX와 다음 deterministic batch
- `resolveLeave()`와 legacy 환자 포기 UI 통합
- main bundle 추가 분할

## 다음 권장 작업

다음 단계는 디자인 확장이 아니라 write path closure다. Barrow 조작부를 먼저 canonical resolver로 옮기고, 이어 공통 Tool layer를 모든 gameplay transaction 입구에 연결한 뒤 Printed Effect A/B batch를 원문 페이지 순으로 진행한다.
