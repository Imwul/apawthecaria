# Printed Effect Automation Plan

## 원칙

Rulebook가 유일한 권위다. Registry에 구조 필드가 있다는 이유만으로 자동 구현으로 판정하지 않는다. executor, resulting transaction, idempotency와 자동 테스트가 모두 있을 때만 `implemented`로 올린다.

## A. Deterministic

플레이어 해석 없이 상태로 계산 가능한 효과다.

- 고정 Reputation, Timer, Trinket 증감
- 명시적 item add/remove 또는 condition flag
- 고정 card draw와 forced follow-up state
- 명시적 map flag

필수 구조: ownerId, sourcePage, trigger, prerequisites, automatic effects, transaction ID, journal prompt, test ID.

현재 실행 확인 family: Pinned by Pine, Quagmire's Scale, Stingshock, Wake, Wormridden와 기존 deterministic Encounter 3개.

## B. Structured Choice

선택지는 원문에 명확하지만 target을 플레이어가 골라야 하는 효과다.

- A 또는 B 선택
- 특정 Tool/Reagent/Location/Patient 선택
- 선택 뒤 수치 결과가 결정되는 effect

UI는 선택을 먼저 저장하고 resolver transaction을 commit한다. Brand Care와 Forager's Twitch는 이 범주의 기준 구현이다.

## C. Narrative Resolution

서술, 관계, 장면의 의미 또는 플레이어 해석이 결과의 일부인 효과다. 자동화하지 않는다.

Manual UI는 `직접 처리 필요`, 결과 요약, journal note, transaction ID, resolvedAt, 완료/보류 상태를 보존해야 한다.

## D. Ambiguous

판본 안에서 문구가 충돌하거나 대상 범위를 확정할 수 없는 효과다. `manual + source ambiguity`로 유지하고 권장 해석과 대안을 `RULE_DIFFERENCES.md`에 연결한다.

## 다음 Batch

1. Ailment의 남은 고정 success/failure 자원 변화
2. Travel Encounter의 고정 Reputation/Timer/item 변화
3. Foraging Encounter의 고정 FP/Timer/item 변화
4. Social Encounter의 고정 Barter 변화
5. target selector가 명확한 structured choice
6. 저장 가능한 timer/map follow-up flag

각 batch는 Rule ID가 포함된 테스트, retry idempotency, save/resume와 manual fallback을 함께 추가한다. narrative 행을 숫자로 치환해 자동화 수를 늘리지 않는다.
