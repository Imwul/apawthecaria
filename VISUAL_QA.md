# Visual QA

## Environment

- Date: 2026-08-08
- Browser: Codex in-app browser, Vite development build
- Widths: 360, 390, 768, 1024, 1440, 1920px

## Results

| Check | Result |
|---|---|
| Document horizontal overflow | Pass at all six widths; 360px stamp overflow fixed |
| Map | Pass; labels and added overlays remain readable and the map remains internally pannable |
| Today/navigation | Pass; current patient, place, bag, next action and journal bookmarks remain visible |
| Patient/Treatment/Inventory | Pass; no viewport clipping in sampled states |
| 자연사 색인 | Pass; 번역된 제목, search/filter labels, source page, locked state and 80-row staged rendering |
| Keyboard/focus | Pass for native navigation, buttons, inputs and visible focus styles |
| Reduced Motion | Pass; global reduced-motion media query present |
| Touch target | Pass; interactive controls use 44px minimum |
| Console | Fresh 5179 URL produced no current error/warning; one historical 5177 HMR dependency message was excluded after clean navigation |

## Phase 6 Remaster Checks

- Desktop: 단색 chapter opener에서 title, action과 다음 section이 겹치지 않는다.
- Mobile 390 x 844: header is 75px, actions collapse to labelled icons, bookmarks scroll horizontally, document `scrollWidth === clientWidth`.
- 자연사 색인 desktop: 520 indexed records render as two editorial columns; 80-row staged DOM remains active.
- Map desktop: source map, labels, zoom controls and added marker text are readable; document `scrollWidth === clientWidth`.
- 장식용 photo element와 `/art/` asset 참조가 없다.

## Grand Experience Remaster Checks

- 인앱 브라우저가 제공한 실제 desktop 표시 폭 999px, mobile 표시 폭 265px에서 전 화면 chapter opening을 확인했다.
- `오늘의 여행`, `진료 수첩`, `약초 도감`, `배낭과 약제사`, `접어둔 지도`, `자연사 색인`, `환자 기록장`, `표본과 기억`, `들녘의 일지`는 각각 다른 저채도 단색 책갈피와 장 표지를 사용한다.
- mobile 265px에서 journal casebook의 280px grid track이 문서 폭을 47px 밀던 문제를 수정했다. 최종 `document.scrollWidth === document.clientWidth`다.
- chapter opening은 사진과 overlay 없이 단색 paper, 짙은 ink, 같은 hue의 tonal Lucide mark만 사용한다.
- 지도 본문을 실제로 스크롤해 원본 지명, 추가 위치 label의 불투명 배경, zoom control과 내부 pan 영역을 확인했다.
- mobile icon-only 책갈피는 52px 고정 폭, 접근성 이름과 `title` tooltip을 유지한다.
- 화면 장식 문구에서 저장된 예시 이름 `Moss`와 `Apo`를 제거했다. 실제 campaign profile 값과 룰북 데이터 `Haircap Moss`는 보존한다.

## Typography and Warmth Audit

- 실제 렌더링된 제목·본문·버튼·입력은 모두 `Hahmlet` 한 계열을 사용한다. fallback만 `Noto Serif KR`, `Apple SD Gothic Neo`, `serif` 순서로 둔다.
- 별도 영문 display font였던 `Marcellus`/`Marcellus SC`와 component 안의 직접 `Pretendard`/browser serif 선언을 제거했다.
- `오늘의 여행`, `약초 도감`, `환자 기록장`, `들녘의 일지`에서 warm ivory paper, deep brown ink, muted berry metadata, olive rules가 동일하게 적용된다.
- 인앱 브라우저의 desktop 표시 폭 887px와 mobile 표시 폭 265px에서 동일한 글꼴 계열이 계산되었으며 document horizontal overflow가 없다.

## Pastel Chapter Audit

- 9개 journal bookmark가 각각 apricot, rose, sage, ochre, mist blue, lavender, peach, eucalyptus, stone rose 단색으로 렌더링된다.
- 8개 chapter opening은 해당 bookmark와 같은 paper/accent 조합을 사용하며 장식용 사진 수는 0이다.
- 실제 desktop 표시 폭 887px와 mobile 표시 폭 265px에서 `document.scrollWidth === document.clientWidth`다.
- `자연사 색인`의 bookmark, chapter title, panel title, loading text와 count label을 한글화했고 화면 안에 영문 `Almanack` 제목이 남지 않았다.
- 탭 전환 뒤 이전 장의 세로 스크롤이 유지되던 문제를 수정해 새 장이 항상 맨 위에서 열린다.

Barrow와 Manual Effect는 현재 저장의 활성 상태가 없어 빈/비활성 패널로 확인했다. 강제로 게임 state를 조작해 성공 화면을 연출하지 않았다.

## Residual Issues

- App main chunk가 628.44 kB라 500 kB 경고가 남는다.
- Barrow field note는 canonical 정보를 표시하지만 일부 조작부와 legacy Downtime 본문은 여전히 정보 밀도가 높다. 첫 장의 독서 흐름은 개선됐으나 이 긴 본문은 후속 component 분해 대상이다.
- automated screenshot comparison은 없으며 이번 검증은 breakpoint별 smoke와 저장된 기준 이미지다.
