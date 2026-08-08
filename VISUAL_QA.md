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
| Almanack | Pass; search/filter labels, source page, locked state and 80-row staged rendering |
| Keyboard/focus | Pass for native navigation, buttons, inputs and visible focus styles |
| Reduced Motion | Pass; global reduced-motion media query present |
| Touch target | Pass; interactive controls use 44px minimum |
| Console | Fresh 5179 URL produced no current error/warning; one historical 5177 HMR dependency message was excluded after clean navigation |

## Phase 6 Remaster Checks

- Desktop 1440 x 900: watercolor scene is cropped to a stable 410px chapter opener; title, action, credit and the next section are visible without overlap.
- Mobile 390 x 844: header is 75px, actions collapse to labelled icons, bookmarks scroll horizontally, document `scrollWidth === clientWidth`.
- Almanack desktop: 520 indexed records render as two editorial columns; 80-row staged DOM remains active.
- Map desktop: source map, labels, zoom controls and added marker text are readable; document `scrollWidth === clientWidth`.
- Hero image loaded with a non-zero natural width in both sampled viewports.

## Grand Experience Remaster Checks

- 인앱 브라우저가 제공한 실제 desktop 표시 폭 999px, mobile 표시 폭 265px에서 전 화면 chapter opening을 확인했다.
- `오늘의 여행`, `진료 수첩`, `약초 도감`, `배낭과 약제사`, `접어둔 지도`, `Almanack`, `환자 기록장`, `표본과 기억`, `들녘의 일지`에서 이미지가 모두 로드되고 본문 시작점이 첫 화면 아래에 보였다.
- mobile 265px에서 journal casebook의 280px grid track이 문서 폭을 47px 밀던 문제를 수정했다. 최종 `document.scrollWidth === document.clientWidth`다.
- chapter artwork는 viewport와 화면 의미에 맞춰 별도 crop을 사용한다. 약병, 약용 식물 도판, 토끼 가족, 식물 표본과 숲 장면의 주제가 모두 식별된다.
- 밝은 도판은 짙은 갈색 글자와 종이색 단일 overlay, 어두운 장면은 밝은 글자와 단일 먹색 overlay를 사용한다. gradient overlay는 없다.
- 지도 본문을 실제로 스크롤해 원본 지명, 추가 위치 label의 불투명 배경, zoom control과 내부 pan 영역을 확인했다.
- mobile icon-only 책갈피는 52px 고정 폭, 접근성 이름과 `title` tooltip을 유지한다.
- 화면 장식 문구에서 저장된 예시 이름 `Moss`와 `Apo`를 제거했다. 실제 campaign profile 값과 룰북 데이터 `Haircap Moss`는 보존한다.

## Typography and Warmth Audit

- 실제 렌더링된 글꼴은 두 계열뿐이다. 제목·본문·일지 문장은 `Hahmlet`, 버튼·입력·metadata·rule label은 `Noto Sans KR` 계열을 사용한다.
- 별도 영문 display font였던 `Marcellus`/`Marcellus SC`와 component 안의 직접 `Pretendard`/browser serif 선언을 제거했다.
- `오늘의 여행`, `약초 도감`, `환자 기록장`, `들녘의 일지`에서 warm ivory paper, deep brown ink, muted berry metadata, olive rules가 동일하게 적용된다.
- 인앱 브라우저의 desktop 표시 폭 1073px와 mobile 표시 폭 265px에서 두 글꼴 계열만 계산되었으며 document horizontal overflow가 없다.

## Screenshots

- `output/visual-qa/desktop-1440-dashboard.png`
- `output/visual-qa/desktop-1440-journey-content.png`
- `output/visual-qa/desktop-1440-map-content.png`
- `output/visual-qa/desktop-1440-patient-content.png`
- `output/visual-qa/desktop-1440-inventory-content.png`
- `output/visual-qa/desktop-1440-almanack-content.png`
- `output/visual-qa/desktop-1440-archive.png`
- `output/visual-qa/mobile-390-dashboard.png`

Barrow와 Manual Effect는 현재 저장의 활성 상태가 없어 빈/비활성 패널로 확인했다. 강제로 게임 state를 조작해 성공 화면을 연출하지 않았다.

## Residual Issues

- App main chunk가 약 635 kB라 500 kB 경고가 남는다.
- Barrow field note는 canonical 정보를 표시하지만 일부 조작부와 legacy Downtime 본문은 여전히 정보 밀도가 높다. 첫 장의 독서 흐름은 개선됐으나 이 긴 본문은 후속 component 분해 대상이다.
- automated screenshot comparison은 없으며 이번 검증은 breakpoint별 smoke와 저장된 기준 이미지다.
