# Grand Experience Remaster

## Goal

기능 화면의 집합을 `장면 → 챕터 → 본문 → 메모 → 행동` 순서로 읽는 field journal로 바꿨다. Rules Engine, canonical transaction, schema migration, save payload와 offline queue는 변경하지 않았다.

## Experience Changes

- sidebar dashboard를 사용하지 않고 가로 journal bookmark와 한 열의 독서 흐름을 유지했다.
- 첫 화면은 현재 환자, 필요한 약초, 위치, 배낭과 최근 문장으로 하루를 시작한다.
- 나머지 8개 화면에 campaign-aware chapter opening을 추가했다.
- 진료 챕터는 현재 환자, 병증과 Timer를 먼저 읽고 현재 치료로 돌아갈 수 있다.
- 자연사 색인과 약초 화면은 card wall보다 2단 색인과 관찰 기록을 우선한다.
- 환자와 일지는 반복 card의 그림자와 둥근 모서리를 제거해 기록철과 본문처럼 읽힌다.
- mobile은 icon bookmark, 세로 chapter, 한 열 기록과 내부 가로 스크롤만 사용한다.

## Chapter Colour System

- 장식용 사진과 외부 작품을 제거했다.
- 9개 책갈피와 9개 장 표지는 서로 다른 저채도 단색으로 구분한다.
- 각 장의 Lucide 선 아이콘은 같은 색 계열의 옅은 표식으로만 사용한다.
- 색에만 의존하지 않고 icon, 장 제목, `aria-current`를 함께 제공한다.

## Accessibility And Responsive QA

- semantic heading과 landmark를 유지했다.
- icon-only bookmark에 accessible name과 tooltip을 제공한다.
- focus-visible과 prefers-reduced-motion 규칙을 유지했다.
- 실제 999px desktop 및 265px mobile 표시 폭에서 문서 가로 overflow가 없음을 확인했다.
- 지도는 문서 폭을 넓히지 않고 자체 영역 안에서 pan/zoom한다.

## Residual Work

- 긴 Downtime과 일부 legacy form은 첫 장 아래에서 여전히 정보 밀도가 높다.
- main bundle은 약 635 kB로 500 kB 경고를 유지한다.
- 시각 회귀 비교는 수동 breakpoint smoke이며 자동 snapshot diff는 아직 없다.
