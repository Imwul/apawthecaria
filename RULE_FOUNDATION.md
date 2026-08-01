# Rule Foundation

## 범위와 권위

이 문서는 Phase 1 Rule Foundation의 구현 구조를 설명한다. 규칙의 유일한 권위는 *Apawthecaria*, First Edition, Third Printing (May 2023) 룰북이다. 감사 문서는 문제 위치와 추적 ID를 제공하지만 규칙값을 대체하지 않는다.

이번 Phase는 기존 화면을 유지하면서 다음 계층을 추가했다.

```text
Rulebook Data -> Rule Engine -> Application State -> UI -> Persistence
```

현재 UI의 레거시 계산을 한 번에 제거하지는 않았다. 대신 새 기능과 다음 Phase의 교체 작업이 반드시 거칠 순수 진입점을 만들었다.

## Canonical Data

`src/rules/` 아래의 권위 데이터는 UI 표시 문자열과 분리되어 있다. 모든 레코드는 `rulebookEdition`, `sourcePage`, `source`를 가지며 `source`에는 문서 ID, 제목, 판본, 페이지가 함께 기록된다.

| 데이터셋 | 파일 | 구조 |
|---|---|---|
| Reagents | `data/reagents.ts` | 83개, Type, BR, Region/Season 3상태, Preparation 참조 |
| Preparations | `data/reagentPreparations.ts` | 189개, Part, Method, Tool[], Weight, Uses, Tag[], Special Rule |
| Ailments | `data/ailments.ts` | 45개, Severity, Timer, Requirement AST, Success/Failure/Special, 복수 여부 |
| Encounters | `data/encounters.ts` | Travel 103, Foraging 144, Social 66, 명시적 복합키 |
| Regions | `data/regions.ts` | Bog, Forest, Loch, Meadow, Mountain, Titan, Soar의 용도별 지원 여부 |
| Seasons | `data/seasons.ts` | Spring, Summer, Autumn, Winter와 순서/다음 계절 |
| Tools | `data/tools.ts` | 기본 도구 5개와 연감 항목 18개를 개별 참조 가능한 ID로 보존 |
| Tags | `tags.ts` | 치료 Tag 20개와 FAIR/FOUL, 별칭 정규화 |

Tools 데이터는 총 23개 레코드다. 룰북 p12의 물리적 Basic Tool 5개와 p62-65의 연감 항목 18개를 모두 표현한다. 연감의 `Basic Tools`는 잃어버린 세 도구를 교체하는 구매 항목이므로 `replacement` 레코드이며, 준비법은 실제 물리 도구 ID를 참조한다.

## Data Model

태그는 문자열 파싱 결과가 아니라 `RuleTag`와 `TagValue`로 저장된다. 질환 요구 조건은 `tag`, `allOf`, `anyOf`, `alternatives`, `special` 노드로 구성된 AST다. 따라서 AND/OR, 대체 처방, 수동 판정이 필요한 특수 요구를 손실 없이 구분할 수 있다.

조우 선택키는 배열 위치나 modulo가 아니다.

- Travel: `type + region + cardKey + season`
- Foraging: `type + region + cardKey + season`
- Social: `type + region/city + locationType + suit + season`

효과는 `StructuredRuleEffect`로 저장하고 자동화 수준을 `implemented`, `structured-but-not-executed`, `manual-only`, `ambiguous`로 표시한다. 실행하지 않는 규칙을 실행된 것처럼 취급하지 않는다.

## Rule Engine

`src/rules/engine.ts`에 다음 순수 진입점이 있다.

- `resolveTravel()`
- `resolveForaging()`
- `resolveTreatment()`
- `resolveEncounter()`
- `resolveSeason()`
- `resolveTimer()`
- `resolvePatient()`

엔진은 React, 브라우저 저장소, Firebase에 의존하지 않는다. 현재 구현 범위와 Stub은 `RULE_ENGINE_STATUS.md`에 기록한다.

## Patient State

`src/rules/state.ts`의 새 상태는 다음 관계를 표현한다.

```text
Patient
  Ailments[]
  Timers[]
  Conditions[]
  TreatmentHistory[]
  JournalEvents[]
```

각 Ailment instance는 하나 이상의 Timer ID, Condition ID, TreatmentHistory ID를 참조한다. Fight Marks, Groundhog Syndrome, Soured Dough 같은 반복 질환은 별도 Ailment와 Timer 레코드로 확장된다. 기존 `activeAilment`와 `activeAilments`는 UI 호환을 위해 삭제하지 않았으며 새 상태의 권위 필드는 `patients[]`와 `activePatientId`다.

## Rulesets

- `original-1e-3p`: 새 게임 기본값. 앱에서 생긴 House Rule 스위치가 모두 꺼진다.
- `legacy-campaign`: 메타데이터 없는 기존 Save의 호환 모드.
- `sandbox`: 기존 복구/검사용 명시적 모드이며 새 게임 기본값이 아니다.

House Rule 스위치는 `rulesets.ts`에만 정의된다. 원작 규칙 데이터와 섞이지 않는다.

## Migration

현재 `schemaVersion`은 `2`다. `SAVE_MIGRATIONS`가 순서대로 실행된다.

1. `v0 -> v1`: Ruleset/Edition을 부여하고 legacy Bag reagent를 canonical Reagent/Preparation ID에 연결한다.
2. `v1 -> v2`: 단일/복수 legacy active Ailment를 Patient/Ailments/Timers 그래프로 복사한다.

알 수 없는 사용자 필드, 저널, 가방 수량, 사용자 메모는 삭제하지 않는다. 메타데이터 없는 Save는 `legacy-campaign`이 되며, 이미 최신 버전인 Save는 그대로 반환된다.

## Validator

`validateCanonicalData()`는 중복 ID, Tag/Page/Source/Edition, Region/Season/Tool 참조, Preparation, Severity/Timer, Encounter card key와 개수를 검사한다. `npm run validate:rules`로 단독 실행할 수 있고 `npm run build`의 선행 단계로 강제된다.

테스트 이름은 `RULE_TRACEABILITY.md`의 `CORE-*`, `PATIENT-*`, `AILMENT-*`, `REMEDY-*`, `TRAVEL-*`, `TABLE-*`, `SAVE-005` ID를 포함한다.

## 다음 Phase

1. UI의 이동/채집/치료 계산을 새 resolver 호출로 교체한다.
2. 카드 기반 Patient 생성과 Monarch 복수 질환 추첨을 구현한다.
3. Ailment 특수 성공/실패와 Encounter 효과를 상태 전이로 구현한다.
4. 조우 수동 전사 경고 10개를 룰북 본문과 대조해 완전한 prompt/effect로 교체한다.
5. legacy `activeAilment` 쓰기를 Patient graph 쓰기로 전환한 뒤 읽기 전용 adapter로 축소한다.
