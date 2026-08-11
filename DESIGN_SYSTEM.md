# Design System

## Art Direction: Botanical Field Journal

- 첫 화면은 dashboard가 아니라 `오늘의 여행` 한 장으로 시작한다.
- 환자, 위치, 계절, Timer, 필요한 효능, 배낭과 최근 저널이 이야기 순서로 이어진다. 저장된 약제사 이름은 프로필 본문 외의 장식 문구에 노출하지 않으며 특정 예시 이름을 UI에 고정하지 않는다.
- warm ivory paper를 바탕으로 각 장마다 muted apricot, rose, sage, ochre, mist blue, lavender, eucalyptus를 한 가지씩 배정한다.
- 순수 검정, 큰 그림자, 둥근 SaaS card, 장식용 gradient를 사용하지 않는다.
- 사진이나 외부 삽화에 기대지 않는다. 장 표지는 저채도 단색 종이와 같은 색 계열의 Lucide 선 아이콘만 사용한다.
- 기능 패널은 도감의 선과 여백으로 나누며, 화면의 구분은 장별 종이색과 텍스트 레이블을 함께 사용한다.

## Chapter Architecture

모든 주요 화면은 `장면 → 챕터 제목 → 현재 상태 메모 → 본문 → 행동` 순서로 읽힌다.

- **오늘의 여행:** 살구색 첫 장, 현재 환자, 필요한 약초, 위치, 배낭, 최근 문장
- **진료 수첩:** 현재 환자의 이름, 병증, Timer를 먼저 읽고 병증 참고 기록으로 이어진다.
- **약초 도감 / 자연사 색인:** 각 장의 단색 표지 뒤에 검색 가능한 자연사 색인이 이어진다.
- **배낭과 약제사:** 여행 도구와 길동무를 소개한 뒤 실제 기록 시트가 이어진다.
- **접어둔 지도:** 현재 위치와 발자국 요약 뒤에 내부 pan/zoom 지도를 펼친다.
- **환자 기록장:** 장미빛 표지 뒤에 환자별 기록철을 시간 순으로 읽는다.
- **표본과 기억 / 들녘의 일지:** 각 장의 단색 표지 뒤에 발견, 기념품, 계절별 문장을 둔다.

## Principles

- 조용하고 따뜻한 travelling healer field journal을 유지한다.
- 게임 상태의 중요도와 다음 행동을 장식보다 먼저 보여준다.
- 자동 판정, 선택 필요, 직접 처리, 완료 상태를 텍스트와 색상으로 함께 구분한다.
- 페이지 전체를 카드로 채우지 않고 반복 항목과 실제 도구만 경계로 묶는다.

## Foundations

- **Spacing:** 4, 8, 12, 16, 24, 32, 48, 64px scale
- **Radius:** compact controls 4px, panels/cards 최대 8px
- **Motion:** 150–250ms; `prefers-reduced-motion`에서 사실상 제거
- **Body width:** 읽기 영역을 제한하고 긴 한글/영문 이름은 줄바꿈
- **Typography:** 두 계열만 사용한다. App/page/section/entry title과 본문은 `Hahmlet`, 버튼·입력·metadata·rule label은 `Noto Sans KR`을 사용한다. 별도 영문 display font와 브라우저 기본 serif를 섞지 않는다.

## Color Roles

`background`, `surface`, `surface-muted`, `text`, `text-muted`, `border`, `accent`, `success`, `warning`, `danger`, `manual`, `unresolved` 역할 토큰을 사용한다. 상태는 색만으로 전달하지 않고 레이블을 병기한다.

- Paper: `#f6f1e5`, `#fffdf6`
- Botanical: `#87937b`, `#657255`, `#3f4c3a`
- Earth and weather: `#705943`, `#657d85`
- Small accents: `#8c4055`, `#d89ba4`, `#d59a68`
- Ink: `#342f27`; pure black은 사용하지 않는다.
- Chapter papers: apricot `#ead9c5`, rose `#e7d2d6`, sage `#d9e2d2`, ochre `#e8dfc5`, mist `#d8e1e1`, lavender `#dfd9e5`, peach `#ead8cf`, eucalyptus `#d7e2dc`, stone rose `#e1dad7`

## Components

- **Status strip:** 위치, Season, Journey, Patient, Timer, Carry, next action
- **Today overview:** 살구색 단색 표지, 오늘의 환자, 필요한 약초, 현재 위치, 배낭, 최근 저널
- **Chapter opening:** 화면마다 구분되는 저채도 단색 종이, tonal Lucide mark, 현재 캠페인 메모
- **Journal bookmarks:** Lucide icon과 짧은 제목을 쓰는 가로 책갈피; 모바일에서는 icon-only와 접근성 이름 사용
- **Action hub:** unresolved transaction 재개와 다음 합법 행동
- **자연사 색인:** 2단 색인, 검색, 분류, automation filter, 발견/보유/잠금, source page
- **Barrow panel:** step, suit, progress, timer, flee cost, requirements
- **Manual effect:** mandatory conditions, choices, canonical actions, required result/journal
- **Save status:** local/cloud/outbox 상태를 live status로 표시

## Responsive and Accessibility

- 720px 아래에서 status grid와 자연사 색인 controls를 한 열로 전환한다.
- 버튼/입력 최소 높이 44px, visible focus, semantic heading/landmark를 유지한다.
- 지도는 자체 영역에서 pan하고 문서 전체 가로 넘침을 만들지 않는다.
- modal은 viewport 안에서 scroll하며 pending state와 focus return을 잃지 않는다.
- 긴 이름, Timer, 수치는 고정 grid를 밀지 않고 줄바꿈한다.
- 720px 아래에서 헤더 행동은 icon-only가 되며 `aria-label`과 tooltip을 유지한다.
- Today scene은 안정적인 최소 높이와 단색 배경을 사용해 본문 진입점이 흔들리지 않게 한다.
- chapter opening도 고정 높이를 유지하며, 모바일에서 제목과 다음 본문이 같은 첫 스크롤 안에 이어진다.
- icon-only 책갈피는 접근성 이름과 hover tooltip을 함께 제공한다.
