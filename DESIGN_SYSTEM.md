# Design System

## Principles

- 조용하고 정밀한 travelling healer field journal을 유지한다.
- 게임 상태의 중요도와 다음 행동을 장식보다 먼저 보여준다.
- 자동 판정, 선택 필요, 직접 처리, 완료 상태를 텍스트와 색상으로 함께 구분한다.
- 페이지 전체를 카드로 채우지 않고 반복 항목과 실제 도구만 경계로 묶는다.

## Foundations

- **Spacing:** 4, 8, 12, 16, 24, 32, 48, 64px scale
- **Radius:** compact controls 4px, panels/cards 최대 8px
- **Motion:** 150–250ms; `prefers-reduced-motion`에서 사실상 제거
- **Body width:** 읽기 영역을 제한하고 긴 한글/영문 이름은 줄바꿈
- **Typography:** App title, page title, section title, entry title, body, rule text, metadata, numeric/timer 순

## Color Roles

`background`, `surface`, `surface-muted`, `text`, `text-muted`, `border`, `accent`, `success`, `warning`, `danger`, `manual`, `unresolved` 역할 토큰을 사용한다. 상태는 색만으로 전달하지 않고 레이블을 병기한다.

## Components

- **Status strip:** 위치, Season, Journey, Patient, Timer, Carry, next action
- **Action hub:** unresolved transaction 재개와 다음 합법 행동
- **Almanack index:** 검색, 분류, automation filter, 발견/보유/잠금, source page
- **Barrow panel:** step, suit, progress, timer, flee cost, requirements
- **Manual effect:** mandatory conditions, choices, canonical actions, required result/journal
- **Save status:** local/cloud/outbox 상태를 live status로 표시

## Responsive and Accessibility

- 720px 아래에서 status grid와 Almanack controls를 한 열로 전환한다.
- 버튼/입력 최소 높이 44px, visible focus, semantic heading/landmark를 유지한다.
- 지도는 자체 영역에서 pan하고 문서 전체 가로 넘침을 만들지 않는다.
- modal은 viewport 안에서 scroll하며 pending state와 focus return을 잃지 않는다.
- 긴 이름, Timer, 수치는 고정 grid를 밀지 않고 줄바꿈한다.
