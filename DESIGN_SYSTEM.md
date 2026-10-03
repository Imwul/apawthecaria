# Design System — Forest Folio

Updated: 2026-10-04 (Asia/Seoul)

Latest pass: Ornamented Forest Folio. 사용자의 ‘건조하고 문서 도구 같다’는 피드백에 따라 장식과 책의 물성을 보강했다. 관점 토의, 생성 회화, 구현과 검증은 `output/design-thinking-ornamented-folio-2026-10-04.md`에 기록한다. 이전 attention calibration의 안내/복귀 동작은 유지한다.

## Direction

사용자가 선택한 **짙은 숲빛 + 아이보리, 큰 타이포와 회화 색면**을 실제 게임 UI에 적용한다. 식물 endpaper와 황동 문장의 숲빛 표지, 책갈피 목차, 제본과 종이 가장자리, 회화 판면을 하나의 여행책처럼 구성한다. 선 손그림과 반복되는 큰 둥근 카드는 사용하지 않는다. 모험과 첫 기록의 풍경은 아치형 판면으로, 자료 장은 직사각형 회화와 장 번호 인장으로 구별한다. 본문과 입력 뒤에는 장식 무늬를 넣지 않는다.

현재 행동과 환자·시간·준비물은 실제 게임 상태에서 읽는다. 풍경은 분위기를 위한 장식이며 위치나 게임 지형을 대신하지 않는다. 영문은 Instrument Serif, 한글은 좁고 세로로 긴 Freesentation을 유지한다. 영문 장면 제목은 장식이며 실제 다음 행동의 한국어 제목과 조작을 우선한다.

이전 자주색·중성 workspace와 초기 고정 레일은 이전 반복이다. 과거 결정과 검증은 `output/design-thinking-workspace-renewal-2026-10-03.md` 등 각 세션 보고서에 보존한다.

## Information Architecture

| 계층 | 요소 | 역할 |
| --- | --- | --- |
| 표지 | 큰 브랜드, 위치·계절·배낭·급한 치료 기한 | 현재 맥락과 실제 도구 연결 |
| 목차 | 01 모험 / 02 세계 지도 / 03 병증 사전 / 04 약초 / 05 배낭 | 주 게임 작업과 자료 탐색 |
| 자료 · 기록 | 자료실 / 진료 기록 / 발견 / 이야기 | 보조 자료와 기록 접근 |
| 현재 차례 | 상태별 영문, 한국어 다음 행동, 이유, 주 CTA | 지금 수행할 행동을 한눈에 제공 |
| 작업 페이지 | 여정 준비 / 진료·조제 / 휴식 / 도감 / 기록 | 입력과 결과의 명확한 구획 |
| 상세 | 나의 여행 기록 / 길잡이 / 다른 행동 / 원문 서랍 | 필요할 때 펼치는 상태와 절차 |
| 기록 · 설정 | JSON 백업·불러오기·초기화·클라우드 | 저장과 복구 |

기존 `JournalTab` 식별자와 저장 호환성을 보존한다. 병증 사전은 참고자료이고 실제 진료는 모험 화면에서 수행한다. 다음 행동은 기존 `getCampaignNextAction`을 사용하며 장식용 영문이 별도 판정이나 가짜 상태를 만들지 않는다.

## Typography and Reading Size

| 역할 | 서체 | 기준 |
| --- | --- | --- |
| 한글 | Freesentation | 로컬 variable WOFF2, 100–900 |
| 영문·숫자 | Instrument Serif | 로컬 regular WOFF2, 400, Latin unicode range |
| 본문·규칙 설명 | 공통 언어별 stack | 기본 20px, line-height 1.7–1.8 |
| 버튼·입력 | 공통 stack | 기본 18px, 조작 높이 최소 44px |
| 상태·태그·날짜 | 공통 stack | 기본 17px 이상 |
| 장면 제목 | Instrument Serif | 기본 42–68px, 넓은 화면 86px |
| 회화 판면의 영문 장 제목 | Instrument Serif | 기본 44–64px, 모바일 44px, 넓은 화면 76px |
| 한글 소제목 | Freesentation | h3 24px / h4 22px |
| 한글 장 제목 | Freesentation | 기본 32px, 모바일 28px, 넓은 화면 40.5px, weight 600 |
| 분류·장 통계·등급/기한 주석 | 언어별 stack | 17px / 넓은 화면 19.125px, line-height 1.6 |

1800px 이상 viewport에서는 root를 18px로 바꾸고 rem 기준 읽기 크기를 확장한다. 본문은 22.5px, 버튼·입력은 약 20.25px, 메타데이터는 19.125px 이상이다. 표지 브랜드는 92px, h3는 28px, h4는 26px다. 3440×1440 모니터에서도 문장이 끝없이 길어지지 않도록 작업 페이지와 설명 폭을 제한한다.

작은 기존 inline 설명, `<time>`, 생성 최종 요약, 병증 성공·실패 문구에도 읽기 기준을 적용한다. 지도 내부의 SVG 지형 심볼과 좌표 표식은 지도 확대와 함께 움직이는 별도 그래픽이며 일반 본문 기준으로 키우지 않는다.

`--folio-body-size`, `--folio-control-size`, `--folio-meta-size`, `--folio-heading-size`는 역할별 크기를 정의한다. 의미 있는 본문 최소 크기는 유지하되 분류·통계·파일 선택이 부모 제목의 크기를 상속하지 않도록 구분한다. 일반 copy/inline 최소 크기의 예외는 `:where()`로 지정해 과도한 selector specificity를 쌓지 않는다.

`--font-base/body/ui`: `'Instrument Serif', 'Freesentation', system-ui, sans-serif`. `--font-display`: `'Instrument Serif', 'Freesentation', serif`. `font-synthesis: none`, local preload, `font-display: swap`을 사용한다. 두 OFL 라이선스는 `public/fonts/`에 보관한다. 이모지는 OS fallback을 사용한다.

## Color and Shape

| 역할 | 값 |
| --- | --- |
| 표지·바깥 숲빛 | `#19392f` |
| 짙은 숲빛 | `#102d24` |
| 아이보리 페이지 | `#f6f3e9` |
| 밝은 입력 표면 | `#fffdf6` |
| 본문 잉크 | `#243c32` |
| 주 행동 | `#294f3c` |
| 보조 구리색 | `#895847` |
| 황동 장식 / 밝은 인장 | `#b4945b` / `#d8be82` |
| 선택 표면 | `#e4e9d8` |
| 경계 | `#d3d3bf` |
| 조작 경계 | `#7d8a77` |
| 주의 | `#a44737` |

숲빛은 표지와 주 행동에, 구리색은 참고 연결과 작은 분류에 사용한다. 상태는 색과 문구를 함께 표시한다. 기본 모서리는 3px, 대화창은 5px다. 표본 번호 인장, 황동 틀, 장정 문장, 작은 종이 층과 리본 색면으로 장식을 만든다. 큰 둥근 카드·본문 배경 격자·반복되는 무거운 그림자는 사용하지 않는다. 선택한 조제 항목은 배경과 경계를 함께 바꾼다.

## Layout

- 기본 작업 페이지 최대 폭 1280px, 데스크톱 바깥 여백 40px, 내부 36px. 1800px 이상 화면에서 최대 폭 1600px, 내부 48px.
- 표지·목차·작업 페이지·footer는 같은 좌우 기준을 사용한다. 생성 소개의 이미지와 제목·설명도 같은 기준에 맞춘다.
- 모험은 현재 차례와 우측 회화 판면으로 구성한다. 우측 그림은 기본 약 38% 폭이고, 모바일에서는 140px의 짧은 회화 판면으로 바뀐다. 장면 주 CTA와 규칙 접근은 같은 copy에 유지한다.
- 760px 이하에서 바깥 여백 12px, 내부 18px. 380px 이하 내부는 14px다. 주 목차는 글씨를 작게 줄이지 않고 긴 한국어를 두 줄로 배치한다. 보조 메뉴는 별도로 유지한다.
- 생성은 데스크톱 소개 34%와 입력 영역, 모바일 한 열이다. 단계 탐색만 자체 영역에서 가로로 넘긴다. 버튼 글씨와 실제 입력 폭은 유지한다.
- 여정 준비는 전체 작업 폭을 사용하고 지도를 접힌 상세로 둔다. 목적지·목표는 한 열이다. 카드 설명은 내부 fieldset 폭 420px 이하에서 카드 아래로 내려간다. viewport 크기만 기준으로 좁은 내부 열을 만들지 않는다.
- 병증 약효·도감 태그는 줄바꿈한다. 도감은 필요한 기록만 펼치고 실제 부위·조제법·약효·보유량을 함께 보여준다. 배낭의 작은 도장은 회전과 고정 높이를 제거해 글씨와 함께 자라게 한다.
- 모달은 viewport 안에서 스크롤하고 지도는 자체 영역에서 pan/zoom한다.
- 자료 장의 도입은 데스크톱에서 34% 회화 판면과 실무 정보의 두 열, 40px 간격이다. 원래 영문 제목은 회화 판면에, 한국어 제목·설명·참고는 옆의 밝은 종이에 둔다. 760px 이하에서는 148px 회화 판면과 실무 정보가 한 열로 흐른다. 장 번호와 별 장식은 aria-hidden이며 새 버튼이나 게임 상태를 만들지 않는다.
- 간격 토큰은 가까운 요소 8px, 관련 정보 12px, 그룹 24px, 섹션 32px다. 길잡이는 옅은 여백 쪽지와 황동 왼쪽 띠로, 여정 fieldset과 생성 단계는 상단 선으로 구분한다. legend/입력/조작은 유지한다.
- 일지 작업 제목과 파일 도구는 같은 header 안의 별도 요소다. 제목은 리본 색면, 작성·사진 첨부는 연속 페이지 안의 밝은 원고지 판면으로 둔다. 병증의 외부 반복 상자를 줄이고 성공/실패 비교와 약효의 의미 있는 색 표시는 유지한다.

## Control Hierarchy

주 버튼은 숲빛과 아이보리 글씨, 보조 버튼·파일 선택·랜덤 카드 뽑기는 윤곽선과 숲빛 글씨다. 일반 길잡이의 CTA는 보조 조작이며 긴급 안내는 강조를 유지한다. hover는 색을 바꾸고 임의의 수직 이동을 하지 않는다. 선택은 기존 `aria-current`/`aria-pressed`와 색으로 함께 표시한다. 입력 포커스는 2px 숲빛 윤곽선, 버튼·파일 label은 visible focus를 유지한다. 실제 file input을 투명하게 배치해 키보드 접근과 focus-within을 제공한다. 비활성 항목의 설명은 읽을 수 있는 대비를 유지하고 기능상의 disabled는 그대로다.

작업 구분선과 실제 입력·윤곽 버튼의 경계는 역할을 나눈다. `--folio-control-border`는 밝은 입력 표면에 대해 약 3.57:1의 대비를 갖고, 구조선은 기존 연한 색을 유지한다. 오류 입력은 `--folio-field-border`로 경계색을 바꿀 수 있어 기본 표면 규칙의 specificity에 가려지지 않는다.

## Attention and Return Behavior

2026-10-03 attention calibration에서 정한 동작이다. 이후 장식 보강에서도 이 안내와 복귀 규칙을 유지한다. 비긴급 현재 모험 안내는 자료 장에서 기존 접힌 길잡이 안에 설명과 CTA를 함께 둔다. 기존 `getCampaignNextAction().urgent`가 true인 미완료 판정/절차는 전면 안내를 유지한다. 모험은 기존 주 장면 CTA 하나를 중심으로 한다. 안내를 접더라도 모험 목차·브랜드·실제 환자 치료 복귀·원문 닫기·자료실 복귀를 보존한다.

일지의 미등록 제목/본문/완료된 사진 선택과 선택한 하위 탭은 같은 App 세션에서 자료 왕복 동안 유지한다. 캠페인 교체에는 기존 `resetCampaignScopedUi`에서 초기화한다. 등록/원문/사진 handler와 저장 스키마는 보존하며, 페이지 reload/종료 후 미등록 초안 복구를 새로 만들지 않는다. 외부 기록과 canonical 기록은 실제 데이터가 다르므로 메뉴 이름만 보고 합치지 않는다.

자료실의 ‘현재 질환’은 실제 진단 ID가 있을 때 해당 항목에만 붙인다. 환자 없는 상태의 일반 챕터에 맥락 표식을 만들어 내지 않는다. 실제 자료의 풍부함, 장 도입·실무 제목·시작 기억·의도적인 펼침은 유지한다.

## Artwork and Styling

`public/art/botanical-endpaper.webp`는 2026-10-04 builtin imagegen으로 생성한 식물 endpaper 회화다. 1536×1024, WebP quality 85, 376,638 bytes. 표지 바깥/문장/자료 장 판면/미선택 카드의 뒷면에 사용한다. 전체 prompt는 `public/art/botanical-endpaper.prompt.md`에 저장한다.

`public/art/forest-folio.jpg`는 이전 반복에 builtin imagegen으로 생성한 원본 색면 회화다. 1536×1024, JPEG quality 82, 약 613KB. 첨부 참고 이미지의 원화를 복제하지 않았다. 그림은 장식용 빈 `alt`를 사용한다. 생성 prompt와 원본 경로는 이번 디자인 사고 보고서에 기록했다.

이전 `woodland-pigment.jpg`, 원본 PNG, 선 SVG, SUITE·Wanted Sans·DM Sans 및 라이선스, 폐기된 forest/adventure/workspace CSS는 `output/design-archive/`에 보존한다. 현재 화면과 배포 자산에서 제외했다.

`src/main.tsx`는 `index.css` → `workspace.css` 순서로 로드한다. `workspace.css`는 현재 shell·타이포·표면 기준이다. `index.css`는 게임 컴포넌트 구조와 공통 읽기 기준을 유지한다. 현재 디자인 파일에 이전 시안을 계속 덧붙이지 않는다.

## Accessibility and Saves

본문 건너뛰기, semantic main/nav/heading, `aria-current`, visible focus, 저장 live status와 reduced motion을 유지한다. 파일 불러오기 입력은 label 안에서 접근 가능한 투명 input으로 제공하고 focus-within 표시를 제공한다.

여행·채집 조우, 직접 판정, controlled 선택·안내·클라우드·원문 서랍, 두 장 카드 선택과 계승 창은 기존 공유 포커스 관리로 진입·Tab순환·배경 inert·닫은 뒤 복귀를 처리한다. 미해결 조우와 직접 판정의 Escape 보류 저장을 보존한다.

게임 판정, canonical transaction, schema·migration·revision ownership, 로컬 기록·클라우드 slots·offline queue는 이번 디자인 반복에서 변경하지 않는다. 이전 승인된 규칙 수정의 근거는 `RULE_TRACEABILITY.md`, `RULE_ENGINE_STATUS.md`와 이전 세션 보고서에 남긴다.

## Validation — Ornamented Folio

- 전체 126개 파일/1,291개 테스트, UI guard 40개, 전체 lint, 최종 production build 통과. 서체/큰 글씨 토큰, 규칙/저장/nav 동작은 유지했다.
- 이번 브라우저 화면 검증은 오류 탭의 `data:` URL 재접속 정책에 차단돼 완료하지 못했다. 사용자가 허용된 HTTP 주소로 탭을 다시 열어주는 것을 요청했다. 현재 3440/360 overflow나 디자인 만족도가 검증되었다고 주장하지 않는다.
- 새 artwork는 `public/art/botanical-endpaper.webp`, prompt는 같은 폴더의 `.prompt.md`. 관점 토의와 구현/검증 제한은 `output/design-thinking-ornamented-folio-2026-10-04.md`에 기록한다.

## Validation — Attention Calibration

- 126개 파일 / 1,291개 테스트, 전체 lint, production build, diff check 통과. 비긴급/긴급 안내와 실제 질환 표식 렌더를 검증했다.
- 360px의 8개 자료/기록 장에서 안내 323.47→85.59px, 본문이 237.88px 앞에 나타남. 1280 약초 본문은 765.45→662.38px. CSS/글씨 크기를 변경하지 않은 화면 구조 측정이다.
- 동일한 일지 초안→약초→Back에서 입력/선택 탭이 복구된다. 원문 Escape와 opener focus, 약초 검색/상세, 기존 여정 연결을 유지했다. 별도 localhost 복제본에서 자료 왕복→일지 등록→백업/재가져오기까지 확인했으며 원래 기록의 29건은 유지한다.
- 3440 본문 22.5px/메타 19.125px와 기존 판면, 360의 8개 자료 장 overflow 0. 증거와 A–E 판정은 `output/design-thinking-attention-flow-2026-10-03.md` 및 `output/screenshots/attention-*`.
- 실제 사용자 수행 시간·만족도 개선을 측정하지 않았다. 로컬 구현이며 배포하지 않았다.

## Validation — Previous Visual Refinement

- 이번 refinement: 전체 1,287개 테스트 및 최종 UI 관련 45개 재검사, build/lint/diff check 통과. 1280/360의 9개 화면, 3440 이야기, 720/360 여정 양식, 360 생성 8단계의 page/main/입력 내부 가로 overflow 0.
- 3440 이야기에서 장 도입 369.7→309.0px, 길잡이 213.8→157.6px, 작업 시작 y=1001→889px. 본문 22.5/주석 19.125/조작 20.25px를 유지한다. 이는 화면 공간 측정이며 실제 사용자 수행 시간의 검증이 아니다.
- Tab으로 일지 불러오기·사진 선택 접근, 검색 빈 결과·해제, 약초 펼침, 모바일 원문 서랍과 Escape 포커스 복귀를 확인했다. 긴급/오류 경로는 기존 캠페인에 해당 상황을 만들지 않고 표시 코드·스타일을 검토했다.
- 이번 증거는 `output/screenshots/refinement-before-*` / `refinement-after-*`다. 기존 폰트·그림·내용·메뉴·규칙/저장 기능을 유지하며 배포하지 않았다. 사용자 만족도와 독립 사용성 연구는 아직 확인하지 않았다.

아래는 이전 Forest Folio 전면 적용 단계의 검증이다.

- `npm test`: 125개 파일 / 1,287개 테스트 통과. `npm run build`, `npm run lint`, `git diff --check` 통과.
- 실제 3440×1440 모험·생성, 1280px 모험, 720px 여정 준비, 360px 9개 화면과 생성 8단계를 확인했다. 페이지·main·여정 fieldset·생성 입력 표면의 가로 overflow 0.
- 360px 직접 텍스트 검사에서 일반 화면의 17px 미만 글씨를 정리했다. 지도 그래픽의 SVG `T` 심볼 15개는 지도 기호로 남긴다.
- 실제 여정 준비 CTA와 원문 서랍을 확인했다. 서랍은 모바일 폭 안에서 표시되고 원문을 펼친 후 Escape로 닫으면 기존 규칙 버튼으로 포커스가 돌아갔다.
- 이번 화면 증거: `output/screenshots/folio-*.png`. 세부 결과: `output/design-thinking-forest-folio-2026-10-03.md`.
- 전체 치료·보상·계절 전환 UI 검증은 이전 반복의 결과로 구별한다. 실제 초보 사용자 관찰과 최종 디자인 만족도는 아직 확인하지 않았다. 배포하지 않았다. 기존 큰 App bundle 경고는 남아 있다.
