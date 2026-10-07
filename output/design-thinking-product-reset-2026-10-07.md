# Apawthecaria — Ground-Up Product Reset

Date: 2026-10-07 (Asia/Seoul)
Design challenge: 캠페인의 기능·데이터를 그대로 이어받으면서, 반복 플레이의 판단·탐색·서사 작성을 위한 인터페이스를 처음부터 설계한다.

## BMAD 적용과 근거
사용자 영역에서 설치된 bmad, bmad-cis-design-thinking, bmad-cis-problem-solving의 SKILL.md, customization defaults, method CSV, Design Thinking template을 실제로 읽었다. knowledge.py로 CIS/core-tools 설치 상태를 확인했다. 프로젝트 .agents/skills와 _bmad 실행 설정은 없다. resolver 호출은 파일 부재로 실패했다. 설치·구성 변경은 하지 않았다. 사용자의 중간 승인 없이 구현까지 진행하라는 지시에 따라 대화형 checkpoint를 자동 진행으로 대체했다. 적용한 방법은 Journey Mapping, Empathy Mapping, Jobs to be Done, How Might We, Analogous Inspiration, Assumption Busting, Morphological Analysis, Decision Matrix, Assumption Testing, PDCA와 Design System Creation이다. UX 전용 BMAD 스킬을 실행했다고 주장하지 않는다.

## 1. Product Model — EMPATHIZE
### 실제 사용 관찰
로컬 앱을 127.0.0.1:5181에서 실행했다. 이 주소의 신규 테스트 캠페인만 사용했다. 약제사 모스 / 길동무 루 생성, 여정 Odoak → Obridge 준비·확정, Marigold 검색과 표본 선택, 긴 개인 저널 작성·저장을 직접 수행했다. 실제 사용자 인터뷰는 없으며 아래 사용자 모델은 제품과 직접 사용에 기반한 가설이다.

Primary user: 혼자 카드 기반 Apawthecaria를 진행하는 한국어 플레이어. 카드 판정과 시간·배낭·규칙 관리는 앱에 맡기고, 서사적 선택은 직접 기록한다.
Primary jobs: 중단한 판정 재개, 경로 설정·이동, 환자 진단·채집·치료·결과 기록.
Secondary jobs: 약효에 맞는 재료 비교, 원문 규칙 열람, 배낭 확인, 장소 탐색, 개인 서사 입력.
Rare jobs: 클라우드 슬롯, 백업·복원, 수동 보정, 은퇴, 지도 연결 편집.
Interaction modes: 순차 판정 / 탐색·비교 / 지도 공간 편집 / 긴 글 읽기·쓰기.
Always visible: 위치·계절, 저장 상태, 작업 색인, 현재 절차. Contextual: 환자 기한·필요 약효·배낭 과적. On demand: 전체 규칙, 장기 이력, 설정.
Desktop: 자료와 상세를 동시에 읽고 작업을 오간다. Tablet: 한 화면의 주요 절차를 유지하고 보조 자료를 이어서 읽는다. Mobile: 한 작업씩, 충분한 터치 영역, 펼친 상세를 목록 앞에 표시한다.

### Empathy map (가설)
Say: “지금 무엇부터 해야 하지?” Think: “이 행동이 시간을 쓸까? 이 재료로 치료할 수 있을까?” Do: 진행·약재·지도·배낭·일지를 반복해서 오간다. Feel: 판정과 저장에 대한 신뢰, 서사에 집중할 여유를 원한다.
Journey: 재개 → 남은 절차 확인 → 경로/현지 행동 → 판정 → 재료 비교 → 치료 → 결과·기억 → 다음 이동.

## 2. Existing UX Problems — DEFINE
- 제목·영문 대제목·삽화·사용 설명·현재 상황·기능 제목이 반복되어 실제 검색·입력이 아래로 밀린다.
- 실제 진행 버튼과 가능한 현지 행동이 분리되고 행동 목록은 닫힌 disclosure 안에 있다.
- 자료·기록 4개 목적지가 메뉴 안에 있어 반복 탐색은 2회 클릭이 필요하다.
- 모든 영문과 숫자까지 장식용 serif를 사용해 조작·데이터와 서사의 리듬이 구분되지 않는다.
- 질환 사전은 모든 설명과 성공·실패 내용을 펼쳐 빠른 이름·기한 비교가 어렵다.
- CSS 12,498줄이 테마와 여러 후속 override로 누적되어 디자인 원칙을 일관되게 적용하기 어렵다.
POV: 반복 플레이어는 현재 절차와 필요한 자료를 짧은 거리에서 왕복해야 한다. 결정할 때마다 설명·장식을 통과하면 서사의 집중이 끊기기 때문이다.
HMW: 남은 판정은 명확하게, 자유 탐색은 직접 접근하게 만들 수 있을까? 글을 쓸 때에는 절차 UI의 무게를 줄일 수 있을까?

## 3. Three Directions — IDEATE
### A. 야전 작업소 / Field Station
Concept: 행동, 탐색, 기억을 분리한 고정 색인과 작업 대장. 작업 본문에는 현재 사건·필요 조건·실행을 가장 먼저 배치한다.
Product fit: 캠페인 관리 도구이며 카드 판정과 서사 입력을 번갈아 수행한다.
Navigation: desktop의 세 업무 그룹에 9개 목적지를 전부 노출. mobile은 3개 모드와 모드 안 목적지를 두 줄로 제공.
Density & hierarchy: compact status bar, 현재 작업 dossier, 구분선 기반 목록, 목록/상세 비교.
Typography: 한국어 sans 본문·조작, serif wordmark, monospace folio·수치.
Component language: 직선 버튼, 밑줄 선택, 분리선 대장, 명확한 입력 테두리. terracotta ink / charcoal rail / warm white.
UX advantages: 기록 1회 접근, 자료 검색이 화면 위로, 현재 작업과 대체 행동을 동시에 발견.
Risks: 많은 목적지가 초보자에게 낯설 수 있음. 업무 그룹과 보조 설명으로 완화.
Signature interaction: 약재 목록에서 항목 선택 → desktop 오른쪽 조제 대장, mobile 목록 위 상세. 선택은 기존 저장·판정과 독립.

### B. 길 위의 지도책 / Trail Atlas
Concept: 지도 공간이 앱의 시작점이며 장소의 서랍에서 진료·채집·여정을 실행한다.
Navigation: 지도 장소 → 현지 절차 → 결과. 자료는 장소 옆 인덱스.
Density & hierarchy: 넓은 지도, 공간 표식, 낮은 텍스트 밀도. 지명 serif / 간단한 지도 sans.
Product fit: 여행과 장소 기반 조우가 강한 제품 정체성.
UX advantages: 이동 후보와 장소 관계를 가장 빠르게 이해.
Risks: 환자 치료·긴 저널·비공간 자료 탐색이 지도 클릭을 경유. mobile 편집이 어려움.
Signature interaction: 길목 표식을 선택하여 같은 위치의 조우/약재/기억을 꺼냄.

### C. 장면 진행기 / Scene Conductor
Concept: 현재 판정 장면 하나와 다음 단계만 표시하는 순차 인터페이스.
Navigation: 이어가기/뒤로, 별도 reference sheet. 기록은 결과 장면에 통합.
Density & hierarchy: 낮은 밀도, 한 결정씩, 큰 카드와 짧은 단계 스트립. serif 서사 / sans 조작.
Product fit: 원문 규칙의 순차 해결과 신규 플레이어 안내.
UX advantages: 다음 행동의 혼란 최소화, mobile 진행에 적합.
Risks: 자유로운 재료 비교와 이미 방문한 작업 복귀 비용. 검증된 자유 플레이 흐름을 과도하게 제한.
Signature interaction: 카드 → 선택 → 기한 변화 → 서사 기록 → 다음 장면을 연속 수행.

### 발산 과정 — 20개 아이디어
1. 현재 판정 대장 2. 장소 중심 화면 3. 장면 단위 진행 4. 직접 기록 색인 5. 환자 기한 strip 6. 약효 우선 목록 7. 검색/상세 split 8. 필요한 규칙만 옆에서 읽기 9. 여정 달력의 눈금 10. 작업 전환 메뉴 항상 노출 11. 지도는 필요할 때 펼침 12. 질환의 요약/상세 분리 13. 모바일 두 줄 mode navigation 14. 초보자 설명 별도 열람 15. 장식 대제목 제거 16. 서사와 시스템 결과 분리 17. 저장 상태 항상 노출 18. numeric mono 스타일 19. 재개 동작에 기존 target 유지 20. 백업·초기화는 설정에 유지.
Analogy: 현장 진료소의 접수 대장, 약재 분류함, 작업 지시서에서 정보 구조를 가져왔다. 기존 UI 모양은 출발점으로 사용하지 않았다.

## 4. Selected Direction — Decision Matrix
평가는 디자인 판단이며 실제 사용자 측정값이 아니다. 1–5점. 우선순위 가중치: 작업 수행성 7, 탐색 속도 6, 인지 부하 5, 반복 효율 4, 정체성 3, 독창성 2, 구현 가능성 1.

| 기준 | A 작업소 | B 지도책 | C 진행기 |
|---|---:|---:|---:|
| 작업 수행성 | 5 | 3 | 4 |
| 정보 탐색 | 5 | 3 | 2 |
| 인지 부하 | 4 | 3 | 5 |
| 반복 효율 | 5 | 3 | 3 |
| 정체성 | 4 | 5 | 4 |
| 독창성 | 4 | 5 | 4 |
| 구현 가능성 | 5 | 2 | 3 |
| 가중 합계 / 140 | 131 | 93 | 100 |

A 선택: 비순차적 자료 탐색과 순차 판정을 함께 지원한다. 9개 접근 경로, 기존 hash/history, 재개 target, rule engine, 저장 schema를 모두 유지할 수 있다. 강한 기능 대장을 중심으로 기존 큰 책 펼침 구조에서 벗어난다.

## 5. New Design System — PROTOTYPE / IMPLEMENT
Typography: wordmark Instrument Serif 30px; page title Freesentation 34px, mobile 28px; section 22px/1.35 700; body 18px/1.65, 작은 화면 17px; controls 16px/1.45; metadata 12–15px; numeric/folio system monospace tabular-nums. 한글 본문은 serif를 혼합하지 않는다. 긴 글 입력은 별도의 넓은 작성 면과 1.7 line-height를 사용한다.
Spatial: 4/8/12/16/24/32/48/64px. Desktop rail 232px(1250px 이하 208px) + main max 1280px, content gutter 40px. Grouping은 밑줄과 24–32px 간격, 중첩 카드를 피한다. 지도는 좌표·확대·경로 입력을 수행하는 작업 면으로 유지한다.
Surface: warm white #faf9f5, quiet #eeeae2, dark rail #263330, ink #25332f, action rust #ad482e. elevation은 실제 overlay에만. Radius 2–4px, 1px separator.
Buttons: rust primary, outlined secondary, underlined contextual. Inputs: 44px 이상, 명확한 label, 흰 배경. Navigation: 그룹 안 직접 목적지, selected rust marker. Lists: 요약 행과 한 상세. Tables: aligned labels + tabular numeric. Status: 설명과 색, 색만으로 상태를 전달하지 않는다. Tooltips: 기존 title과 rule tag semantic 보존. Overlays: 기존 focus control을 보존하고 하나의 읽기 sheet로 표시.
States: hover tone 변화; focus 3px offset outline; active pressed; selected side marker+label; disabled 낮은 대비와 disabled semantic; loading status; error alert와 복원 action; empty 이유와 clear action. Motion은 120–180ms, reduced-motion 존중.
Responsive: 1050px 이하 rail을 상단 mode navigation으로 전환. 760px 이하 한 작업 column, 약재 상세는 목록 위, 560px 이하 status와 utility를 두 줄로 재배치한다. Control touch target 최소44px. 지도 geometry/zoom과 route track horizontal scrolling 보존. 좁은 생성 화면은 카드 80×120px와 설명을 나란히 놓고 실행 버튼을 아래 한 줄에 배치한다.

## 6. Structural Changes

| 대상 | 새 구조 | 제품적 이유 |
|---|---|---|
| 앱 IA | 여행(지금 할 일·지도·배낭), 찾기(영약재·질환·규칙), 기록(이야기·진료·발견)의 세 업무 그룹 | 판정, 비교, 서사 작성이라는 다른 interaction mode를 구분 |
| Desktop navigation | 고정 색인의 9개 직접 목적지 | 기록과 자료를 반복해서 오갈 때 메뉴를 열 필요가 없음 |
| Mobile navigation | 3개 mode + 현재 mode의 3개 목적지 | 9개 항목을 좁게 압축하지 않고 현재 업무의 선택지만 표시 |
| 상단 | 위치·계절·배낭·가장 급한 기한·저장 상태와 utility | 다음 판단에 필요한 상태를 페이지 제목과 분리 |
| 진행 화면 | 현재 작업 대장 → 실제 절차 → 필요할 때 펼치는 지도/치료 문맥 → 다른 현지 행동 | 현재 판정을 가장 먼저 찾고 자유 플레이의 대안도 발견 |
| 규칙과 안내 | 문맥 규칙 버튼, 별도 disclosure와 drawer | 긴 공통 설명을 매번 읽지 않고 해당 판정의 근거만 열기 |
| 약재 | 압축 목록 + 선택 상세, 모바일은 상세를 목록 앞에 표시 | 이름·약효를 스캔하고 부위·조제법은 한 항목씩 비교 |
| 질환 | 이름·중증도·기한 요약 행 + native details | 필요한 질환을 먼저 찾고 성공/실패 전문은 선택 후 읽기 |
| 약제사·배낭 | 현재 값 6개를 두 열의 등록부로 표시, 긴 프로필은 별도 열람 | 상태 요약 때문에 실제 소지품 관리가 밀리지 않도록 함 |
| 시작 | 짧은 제품 안내 바로 뒤에 기존 8단계 생성 절차 | 장식 hero를 통과하지 않고 첫 입력을 시작 |

단순 CSS order 변경에 그치지 않고 진행 화면의 실제 DOM도 절차가 지도보다 먼저 오도록 옮겼다. 기존 hash 목적지와 재개 focus target, native controls, 규칙 drawer의 Escape·초점 복귀는 보존했다. 현재 상황의 장문·초보자 안내는 disclosure 안에서 계속 읽을 수 있다.

## 7. Implementation

- `src/components/JournalExperience.tsx`: navigation, chapter opening, 현재 작업 대장을 다시 작성했다. 실제 선택한 환자의 canonical ailment ID에서 질환명과 전체 처방을 읽는다. 오래된 legacy 질환 snapshot이 새 환자의 처방을 덮거나 완료 환자를 다시 표시하지 않도록 했다. 이는 표시 계층의 수정이며 판정 엔진은 바꾸지 않았다.
- `src/App.tsx`: 새 rail/workspace/header/canvas 구조, 시작 화면, 절차의 DOM 순서, 항상 열려 있는 현지 행동 목록, 약재 중복 설명 제거, 질환 요약/상세, 배낭 등록부를 구현했다. 카드 판정·저장·시간 계산의 기존 handler를 연결했다.
- `src/index.css`: 기존 11,411줄의 기초/테마 누적 파일을 새 font, token, form, focus, status, dialog 기초로 교체했다.
- `src/feature-layout.css`: 지도 좌표와 각 기능의 필요한 배치·responsive 규칙을 별도 계층으로 정리했다. 선택자와 media context가 같은 누적 규칙을 합치고 이전 시각 테마를 제거했다. 신규 카드 배치와 충돌하던 이전 카드 크기 규칙도 삭제했다.
- `src/workspace.css`: 작업소의 navigation·layout·목록·상세·서사 입력·responsive 표현을 정의했다.
- `src/main.tsx`: 새로운 세 CSS 계층만 로드한다. 사용하지 않는 `src/storybook.css`, `src/woodland.css`를 삭제했다.
- 8개 기존 presentation contract test 파일을 새 구조에 맞췄다. domain assertion은 유지했다. 실제 브라우저에서 발견한 canonical 환자 처방 문제에 대한 회귀 검사를 추가했다.

데이터셋, 저장 schema 9, persistence module, generators, calculations와 domain engine 파일은 수정하지 않았다. 기존 자료·성공/실패 내용·수동 판정 보정·백업/복원·클라우드 관리·은퇴 동작은 유지했다. 사용자 캠페인 대신 별도 localhost origin의 신규 테스트 기록으로 검증했다.

## 8. Validation — TEST

실제 in-app browser에서 직접 조작하고 스크린샷을 검토했다. 사용자를 모집하지 않았으므로 real-user usability study로 표현하지 않는다.

| 작업 | 직접 확인한 결과 |
|---|---|
| 캐릭터·길동무 생성 | 변경 전 신규 테스트 캠페인의 8단계 완료. 변경 후 390px 첫 입력·단계 이동, 이름과 동물 입력이 reload 후 보존됨 |
| 여정 준비·경로 | Odoak → Obridge 여정을 확정하고 경로 1개를 선택. 1/3 이동력과 추가 2경로 필요 안내, reload 후 경로 선택 유지 |
| 환자 접수 | 성격·동물·중증도 카드를 뽑고 선택하여 Monthly Chore 환자를 실제 생성. 현재 처방 SCALE 2 + PAIN 1과 기한 6시간이 작업 대장·규칙 색인에 일치 |
| 치료 재개 | 모바일 이어가기의 초점이 treatment-workspace로 이동. 빈 배낭에서 0/2·0/1과 완료 불가 이유 표시 |
| 약재 탐색 | Marigold 검색·선택, p.141 부위·필요 도구·조제법 확인. 자료 → 기록 → 자료 왕복 시 검색과 선택 보존 |
| 질환 탐색 | Monthly Chore 1개 결과, 키보드 Enter로 상세를 열어 전체 처방·성공/실패 내용 읽기 |
| 규칙 검색 | Monthly Chore가 질환과 원문 효과 2개 결과로 표시. 모바일 drawer의 전문과 링크를 읽고 Escape로 닫기, 호출 버튼으로 초점 복귀 |
| 긴 이야기 | 약 733자의 한국어 이야기와 문단을 작성·저장. reload 후 유지, 모바일에서 읽기 펼치기 확인 |
| Empty/selection | 존재하지 않는 약초 이름의 0개 결과와 전체 도감 복귀, 약재 선택 강조, 현재 navigation 선택, 지도 선택 표식 확인 |
| 지도 | 820×1180에서 지도와 도구 검토. 390×844에서 장소 검색 → Obridge 선택 → 선택한 표시 drawer 확인 |
| 나머지 주요 화면 | 약제사·배낭, 진료 기록(진행 사례 1개), 발견과 기억, 규칙 자료실을 실제 열어 콘텐츠와 hierarchy 검토 |
| 좁은 화면 | 390px의 진행·치료·약재·질환·지도·배낭·이야기·시작에서 document 폭=viewport 폭. 긴 처방 태그와 관계 버튼은 줄바꿈. 수평 스크롤은 지도/단계 탐색 같은 의도한 내부 면에 한정 |

PDCA 수정: 현재 환자 처방이 legacy snapshot에서 잘못 읽히는 표시 문제, 배낭 상태가 세로로 늘어지는 문제, empty reset 중복, 질환 펼침 표시, 모바일 시작 카드가 설명을 덮는 문제를 발견하고 수정했다. 마지막 카드 문제는 사용자가 첨부한 화면에서도 확인됐으며, 수정 후 카드 80×120px·설명 bounding box overlap=false를 직접 측정했다.

자동 검사: `npm test` 135개 파일·1,375개 검사 통과. `npm run build`의 규칙 감사 4개·reference 감사 8개, TypeScript와 Vite 빌드 통과. `npm run lint` 통과. `git diff --check` 통과. 검증 실행 경로는 `/tmp/apaw-design-verify`다. iCloud 소스 파일 hydration/변경 감지로 개발 서버가 반복 reload되어, 원본과 동일한 소스 snapshot·동일 lockfile의 별도 runtime을 사용했다. 변경한 14개 소스/테스트 및 package/lockfile의 byte equality를 확인했다. Firebase 설정은 검증 snapshot에서 제외했으므로 클라우드 왕복 검증은 포함하지 않는다.

최종 검증은 HMR이 없는 production preview로 반복했다. 1529px에서 9개 목적지를 직접 열고 현재 목적지 표시가 정확히 한 개인지, document 수평 넘침이 없는지 확인했다. 이어서 390px에서 빈 검색 결과의 복귀 버튼 1개, Marigold 상세, 시작 카드의 겹침 해소를 재확인했다. 이 최종 검증 구간의 새 console error/warning은 0개다. localhost 5181은 테스트 캠페인, 5182는 시작 초안의 미리보기다. 공개 배포는 수행하지 않았다. 검증 log와 동일 소스 SHA-256 manifest를 이미지와 함께 보관했다.

## 9. Before / After

1529×1233, 같은 약제사·길동무와 Odoak → Obridge 여정, 경과일 0/12인 상태에서 비교했다. 이후 환자 접수는 별도 후속 작업으로 수행했다. 실제 작업 성공 시간이나 사용자 오답률을 측정했다고 주장하지 않는다.

| 비교 항목 | Before | After | 해석 |
|---|---:|---:|---|
| 상단 masthead | 175.9px | 88px | 상시 상태·utility만 남김 |
| 현재 작업 요약 높이 | 1,031.8px | 302px | 약 71% 감소, 실제 절차가 첫 화면에 보임 |
| 경로 작업의 문서 y 위치 | 1,228.4px | 450px | 찾기까지 수직 거리 약 63% 감소 |
| 진행 페이지 전체 높이 | 3,658px | 3,031px | 현재 판정을 앞에 배치하면서 보조 자료 유지 |
| Desktop 기록 목적지 접근 | 2회 클릭 | 1회 클릭 | 메뉴 열기 단계 제거 |
| Marigold 검색 후 선택 | 입력 + 1회 선택 | 입력 + 1회 선택 | 클릭 수 동일, 목록과 상세의 반복 읽기 부담 감소 |
| 진행 화면의 보조 지도 | 바로 펼쳐짐 | 1회 펼치기 | 경로 절차 우선순위의 tradeoff. 세계 지도 목적지는 직접 접근 |
| 로드하는 CSS 원문 | 345,179 bytes | 171,290 bytes | 50.4% 감소. 줄 수는 압축 형식이 달라 품질 지표로 사용하지 않음 |

변경 전후 화면과 모바일·태블릿 근거 이미지는 `output/design-reset-evidence/`에 보관한다. 아래 비교는 장식 변화뿐 아니라 navigation 위치, 작업 요약, 실제 절차 시작 위치, 목록/상세 구조가 달라진 것을 보여준다.

| 동일 작업 | Before | After |
|---|---|---|
| 진행 중 여정 | [이전 화면](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/before-active-play.png>) | [새 작업소](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/after-play.png>) |
| Marigold 상세 | [이전 표본](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/before-specimen.png>) | [새 목록과 상세](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/after-specimen.png>) |
| 이야기 읽기·쓰기 | [이전 저널](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/before-journal.png>) | [새 서사 작업 면](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/after-journal.png>) |
| 첫 생성 화면 | [이전 시작](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/before-onboarding.png>) | [새 시작](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/after-onboarding.png>) |

모바일 카드 수정: [겹침이 해소된 실제 화면](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/after-mobile-onboarding.png>). 지도: [820px 화면](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/after-tablet-map.png>). 배낭: [등록부 화면](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/design-reset-evidence/after-bio.png>).

## 10. Remaining Problems / Next iteration

- 실제 사용자 5–7명과 첫 캠페인·치료·재개 과제로 usability study가 필요하다. 직접 사용으로 작업 가능성과 배치를 검증했지만 실제 초보자의 학습 비용·완료 시간은 알 수 없다.
- 약 31,000줄의 App.tsx가 domain과 presentation을 함께 담는다. production App chunk는 약 2.6MB, gzip 약 664KB로 Vite의 큰 chunk 경고가 남는다. 화면 단위 분리와 lazy loading은 다음 유지보수 과제다.
- 드문 관리/보정 화면의 일부 inline style·기존 내부 컨테이너가 남는다. 공통 shell·타이포·controls·overlay는 새 시스템을 사용하나 모든 inline style을 제거한 것은 아니다.
- 전체 치료 완료·모든 조우/휴식기 분기·클라우드 네트워크 왕복을 브라우저에서 모두 수행하지는 않았다. 해당 domain 동작은 기존 자동 검사로 확인했으며, 실서비스 Firebase 연결 검증은 별도다.
- 모바일 mode 변경 후 목적지를 고르는 왕복 비용과 닫힌 보조 지도의 발견성은 사용자 조사에서 확인할 항목이다. 선택한 방향의 tradeoff를 숨기지 않는다.
