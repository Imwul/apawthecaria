# Design Thinking Session: Apawthecaria 작업실 전면 수정

**Date:** 2026-10-03 (Asia/Seoul)
**Facilitator:** Codex — BMAD CIS Design Thinking
**Design Challenge:** 외부 룰북 없이 현재 차례를 이해하고 플레이를 이어가는, 사용자가 요청한 새 타이포와 고급스러운 작업실 디자인.

이 문서는 이전 감사·디자인 세션을 덮어쓰지 않는 구현 후 기록이다. 사용자는 감사 30개 중 **27번 협동 모드 확장만 제외**하고 나머지를 수정하도록 승인했다. “토의하면서 알아서”, “시간이 오래 걸려도 차근차근”이라는 요청에 따라 디자인 씽킹 단계별 관찰·판단을 공유하며 구현과 검증까지 진행했다. 단계마다 추가 승인을 요구하는 기본 진행 방식은 사용자의 자율 진행 요청에 맞췄다.

## 🎯 Design Challenge

기존 화면의 장식과 메뉴 패러다임을 바꾸고, 실제 게임 기능을 보존하면서 현재 행동·부족한 약효·남은 시간·판정과 기록을 연결한다. 원문은 `Apawthecaria v1.3.pdf`와 동일한 220페이지 추출본을 근거로 읽었다. 첨부 이미지와 룰북은 디자인·규칙의 자료이며 사용자의 실행 지시와 구별했다.

## 👥 EMPATHIZE: Understanding Users

### User Insights

- 기존 디자인을 조금 바꾸는 수준을 원하지 않았다. 게임 기능 외의 기존 패러다임을 버리라고 요청했다.
- 선 손그림을 명시적으로 금지했다. 초기 숲 선 일러스트와 작은 선 식물 장식도 최종 화면에서 제거했다.
- 영한 폰트를 모두 거절한 뒤, 현재 영문 Instrument Serif의 느낌을 전역에 사용하길 원했다.
- 한글의 “세로로 납작한”은 후속 답변에서 **자폭이 좁고 세로로 길쭉한 글자**로 명확해졌다.
- 캐릭터 생성의 줄 맞춤과 여정 카드 옆 설명이 한두 글자씩 줄바꿈되는 실패를 실제 스크린샷으로 알렸다.
- 사이트의 안내를 따라 룰북을 별도로 열지 않고 플레이하길 원한다.

### Key Observations

Empathy Mapping, Journey Mapping, 관찰 기반 점검, 문서·코드 대조를 사용했다. 사용자 발언은 직접 근거이고, 초보자의 인지 부담은 아직 실제 초보 사용자 실험으로 확인하지 않은 가설이다.

여정 준비에서 viewport는 충분해도 내부 grid의 두 번째 열이 너무 좁아질 수 있었다. viewport breakpoint만으로 해결되지 않아 fieldset 자체의 폭을 기준으로 카드와 설명을 배치했다. 실제 플레이 중에는 직접 판정 창과 원래 조우 창의 z-index가 같아 클릭이 가려지는 별도 문제도 발견했다.

### Empathy Map Summary

| 관점 | 관찰·요구 |
| --- | --- |
| 말 | 전면 교체, 선 손그림 금지, 폰트 불만, 줄 맞춤 실패 |
| 행동 | 실제 화면을 보고 반복적으로 방향과 실패를 전달 |
| 필요한 것 | 현재 행동을 찾고 자료와 도구를 구별하며 저장한 차례를 재개 |
| 감정의 직접 근거 | “마음에 안 들어”, “개 박살이 났네” |
| 미검증 가설 | 중복 정보와 작은 글자가 초보 플레이를 방해할 수 있음 |

## 🎨 DEFINE: Frame the Problem

### Point of View Statement

이 사용자는 고유한 분위기와 명확한 현재 작업을 갖춘 게임 공간이 필요하다. 데이터와 규칙이 있어도 일부 획득·조제 경계가 끊기고, 안내·상태·입력 창과 실제 차례가 다르게 보였기 때문이다.

### How Might We Questions

1. 선 그림 없이 색면·회화·서체·여백으로 분위기를 만들 수 있을까?
2. 폰트를 전역 적용하면서 좁은 한국어·긴 영문 규칙 용어를 읽기 쉽게 배치할 수 있을까?
3. 홈·길잡이·실행 버튼을 한 상태 판단에 연결할 수 있을까?
4. 원문이 플레이어에게 남긴 서사를 유지하면서 자원 처리와 재개를 안전하게 연결할 수 있을까?
5. 좁은 내부 영역에서도 카드 옆 설명과 필수 선택을 충분한 폭으로 보여줄 수 있을까?

### Key Insights

현재 위치·환자·기한은 장식이나 사전 검색 결과가 대신할 수 없다. 판정의 준비물과 누락 조건을 행동 옆에 제공해야 한다. 디자인 만족도와 자동 테스트 통과는 서로 다른 평가이며, 구현 후에도 사용자가 만족했다고 추정하지 않는다.

## 💡 IDEATE: Generate Solutions

### Selected Methods

Brainstorming, SCAMPER Design, Analogous Inspiration, Affinity Clustering과 How Might We로 선택지를 만들고 현재 작업·타이포·규칙 연결로 묶었다. 초기 선 일러스트·레일안은 사용자 피드백으로 기각했다.

### Generated Ideas

1. 회화적 색면 풍경을 작은 분위기 영역에 사용한다.
2. 현재 작업과 주 행동을 첫 화면의 중심으로 둔다.
3. 상단에 위치·계절·무게·가장 급한 치료 시간을 둔다.
4. 한글에는 좁고 세로로 긴 고딕을 사용한다.
5. 모든 Latin 영문·숫자를 Instrument Serif로 통일한다.
6. 아이보리·먹색·자주색으로 표면과 행동을 구별한다.
7. 영구 sidebar를 상단 5개 도구와 보조 자료 메뉴로 바꾼다.
8. 중복 여정·환자 기록을 선택적 상세로 둔다.
9. 캐릭터 소개와 실제 입력의 기준선을 맞춘다.
10. 여정 준비는 작업 폭 전체를 사용하고 지도를 접는다.
11. 카드 설명은 container 폭에 따라 옆 또는 아래에 둔다.
12. 다음 행동·길잡이·실행 우선순위를 공유한다.
13. 가장 급한 Timer와 선택 질환 Timer를 구별한다.
14. 조우의 누락 선택과 해당 입력으로 이동하는 버튼을 제공한다.
15. 원문을 앱 안의 키보드 가능한 서랍으로 제공한다.
16. 직접 판정의 선택과 메모를 보류·재개한다.
17. 대체재·외국 약재를 조제·소비·영구 도감까지 연결한다.
18. 획득 직후 즉시 조제 기회를 우선 표시한다.
19. 백업·불러오기·초기화·용량 복구를 한 메뉴에 둔다.
20. 한 차례 전체를 실제 UI로 실행해 화면과 저장 경계를 점검한다.

### Top Concepts

- **작업실:** 타이포·표면·상단 탐색과 작은 회화 이미지.
- **현재 차례:** 공통 next-action·timer projection, 기존 작업 재개와 맥락 도움말.
- **끝까지 연결되는 규칙:** 대안 획득·별도 회분·저장·소비·보상과 판정 재개.

## 🛠️ PROTOTYPE: Make Ideas Tangible

### Prototype Approach

초기 화면 구조를 비교한 뒤 실제 저장·규칙 엔진을 사용하는 Vite 앱에 반영했다. 룰북 수치와 저장 경계를 가짜 성공 상태로 대신하지 않았다. 자동 처리 가능한 규칙과 플레이어가 서술·선택해야 하는 규칙을 구별했다.

### Prototype Description

현재 entry는 `index.css`와 `workspace.css`다. 폐기한 shell 규칙을 정리하고 초기 CSS·선 SVG·사용하지 않는 서체와 원본 PNG를 `output/design-archive/`로 옮겼다. 실제 게임 지도와 카드 자료는 유지한다. 한글은 Freesentation, 영문·숫자는 Latin 범위 Instrument Serif이며 두 서체는 로컬 WOFF2와 OFL 라이선스를 사용한다. 가짜 영문 굵기를 합성하지 않는다.

캐릭터 생성은 정렬한 소개와 8단계 입력으로 구성한다. 모험은 현재 차례와 필요한 작업을 우선 보여준다. 여정 목적지와 목표는 한 열이며 카드 rail은 112px, 내부 폭 420px 이하에서는 설명을 아래로 보낸다. 조우·직접 판정·선택·서랍은 공유 포커스 관리로 키보드 진입·순환·Escape·복귀를 처리한다.

### Key Features to Test / 승인 29개 대응표

| 번호 | 긴급도 | 구현 결과 | 확인 근거 |
| --- | --- | --- | --- |
| 1 | 상 | 상단 작업실·회화 색면·중성 표면으로 전면 교체, 선 장식 제거 | 데스크톱·모바일 실제 화면 |
| 2 | 상 | Instrument Serif 전역 Latin + Freesentation 전역 한글 | 실제 computed font, 로컬 WOFF2/OFL |
| 3 | 상 | Replacement 자체 BR12 채집/거래→조제·소비·영구 도감 | p30, engine-chain·migration·결제 재개 테스트 |
| 4 | 상 | Foreign TAG2의 준비·도구·uses·조제·소비 연결 | p195, 사용자 정의 약재 테스트 |
| 5 | 상 | 곰 영주 별도 2회분·중복 부위 방지·도구·potency·소비·후속 처리 | p183, 별도 회분 테스트 |
| 6 | 상 | 원문 모드 정확한 Speed 경로, sandbox 한도 이내 | p24, 경로 판정·UI 테스트 |
| 7 | 상 | 활성 질환의 최소/선택 Timer 공유 projection | p29, projection 테스트·UI |
| 8 | 상 | pending 판정·조우·보상·획득 직후 조제를 공통 CTA로 재개 | p33/35, continuity·homeResume 테스트 |
| 9 | 상 | 조우·직접 판정·서랍·선택·계승·클라우드 포커스 관리 | 실제 중첩 Tab/Escape·메모 재개 |
| 10 | 상 | 첫 치료부터 여정 종료·휴식·다음 계절의 UI 루프 검증 | 아래 실제 시나리오와 한계 |
| 11 | 중 | 현재 작업 우선, 반복 현황·기록·현지 진료 상세 접기 | 모험 화면 |
| 12 | 중 | 병증 사전과 현재 진료 탐색 구별 | 독립 사전 이동·모바일 화면 |
| 13 | 중 | 앱 지도에서 거리·경로·미확인 상태 안내 | p19/24, map·route 테스트 |
| 14 | 중 | 9화면 맥락 도움말·첫 플레이·용어·원문 연결 | PlayGuide·context 테스트 |
| 15 | 중 | 비활성 조건·누락 준비물을 인접 안내하고 입력으로 이동 | EncounterReadiness·모바일 |
| 16 | 중 | 경로·카드·하루 소모 실행 전 미리보기 | RouteComposer 테스트·실제 이동 |
| 17 | 중 | 현재 장소별 거래 한도와 남은 횟수 표시 | 정착지 1 / 도시 3, 거래 테스트 |
| 18 | 중 | Make Do/Replacement 조건과 실행 경로 안내 | p30, 획득·길잡이 테스트 |
| 19 | 중 | native prompt를 맥락·취소·자원 예고가 있는 입력 창으로 교체 | 소스·실제 계절 선택 창 |
| 20 | 중 | 약효·조제·도구 명칭을 한영 병기, 엔진 식별자는 보존 | localization·조제 테스트·UI |
| 21 | 중 | 클라우드 UTF-8용량·복구·기기 저장 상태 안내 | 용량/복구 테스트 2개, 원격 로그인 미실시 |
| 22 | 중 | 기록·설정에 최신 초안 백업·불러오기·초기화 안내 | 소스·백업 버튼 실행, 다운로드 파일 왕복 미검증 |
| 23 | 중 | 모바일 주 도구 5개+자료·기록 펼침 메뉴 | 360px 9화면·메뉴 screenshot |
| 24 | 중 | 계속하기가 기존 작업을 펼치고 focus·scroll하며 재시작 방지 | navigation 테스트·실제 재개 |
| 25 | 하 | 여분 채집 Timer >0, 1/2/3/4소모·실행 전 안내 | p33, 공유 projection·UI |
| 26 | 하 | 첫 플레이 이정표를 실제 획득 provenance로 판정 | milestone 테스트 |
| 28 | 하 | 폐기 CSS·자산 정리, 현재 entry와 스타일 기준 통합 | main entry·archive·diff 검사 |
| 29 | 하 | 현재 상태와 과거 baseline을 구별하여 문서 갱신 | DESIGN_SYSTEM·RULE_ENGINE_STATUS·RULE_TRACEABILITY·PRINTED_EFFECT_STATUS |
| 30 | 하 | 마차 p43 20개 / p68 15개 원문 충돌 공개, 채택 가격 20개 | 원문 링크·registry fixture·UI |

**27번 협동 모드 확장은 요청대로 제외했다.** 이 목록의 “구현”은 실제 초보 사용자 만족도나 모든 가능한 조우의 브라우저 종단 검증을 뜻하지 않는다. printed-effect registry는 358개 중 implemented 46 / manual 312다. 서사 선택을 원문과 직접 판정 UI로 제공하며 자동 결과를 만들어 넣지 않는다.

## ✅ TEST: Validate with Users

### Testing Plan

이번 구현 검증은 에이전트의 실제 UI 조작과 자동 검사다. 실제 초보 사용자 5–7명의 독립 과제 관찰은 실시하지 않았다. 후속 관찰 과제는 외부 룰북 없이 첫 여정·첫 치료·중단 재개·여정 마감·휴식을 완료하고, 다음 행동과 치료 기한을 자기 말로 설명하는 것이다.

### User Feedback

직접 피드백은 폰트·전체 디자인·선 손그림 거부, 좁고 긴 한글 요청, 영문 전역 적용 제안, 생성 소개 정렬 실패, 여정 설명 줄바꿈 실패다. 최종안에 대한 사용자 만족 또는 승인은 아직 확인하지 않았다.

### Key Learnings / 실제 수행 결과

자동 검사: **125개 파일 / 1,287개 테스트 통과**. `npm run build`는 규칙·원문 registry·TypeScript를 포함해 통과했다. `npm run lint`, `git diff --check` 통과. 기존 큰 App bundle 경고는 남아 있으며 이번 결과를 성능 최적화 완료로 표현하지 않는다.

현재 로컬 검증은 `http://127.0.0.1:5196/#play`의 별도 검증 기록을 사용했다. 원래 5174의 사용자 플레이 저장을 초기화하지 않았다. 상태 주입 대신 실제 카드·입력·선택 버튼을 사용했다.

1. 토끼 약제사와 도움이 되는 두꺼비 길동무를 생성하고 이동력 2, 소지 한도 5를 확인했다. Odoak에서 목적지·직접 목표·이유·12일 기한을 확정했다.
2. 하루 정확히 2경로 이동해 봄 축제 조우를 판정했다. 원문 서랍 안에서 Tab/Shift+Tab순환, Escape후 원래 조우 복귀를 확인했다. 메모를 입력하고 보류·reload했을 때 같은 조우와 메모가 재개됐다.
3. 환자 카드를 통해 맷닭·Monthly Chore Lesser를 생성했다. 비늘(SCALE)2·통증(PAIN)1, 도움이 되는 길동무를 반영한 Timer 8을 확인했다. 첫 채집 후 Timer 7, 두 번째 획득 직후 조제 기회를 확인했다.
4. 딱정벌레 껍질과 쐐기풀 잎을 실제 채집했다. Collector 교환에서 실제 부위 선택·동일 부위 교환을 처리하고 두 부위를 절구·주전자와 조제했다. 조제 취소 후 재시도에서 재료와 초안이 보존됐다.
5. 보상 전 checkpoint를 저장 완료 상태에서 reload해 재개했다. 장신구·길드 보상을 한 번 확정하고 재료 소비, 진료 마감과 여분 채집 전환을 확인했다. HMR 중 즉시 reload한 시도는 검증 성공으로 세지 않고 저장이 안정된 상태에서 재시험했다.
6. 이후 실제 연결 지도 경로로 Widrowe에 도착했다. 후속 이동에서 요구되는 현지 진료는 **외부 진료 기록 UI 검증용 fixture**로 처리했다. 이 경로를 추가 자동 치료 사례로 세지 않는다.
7. 숲 말벌 조우에서 절구 손실을 직접 판정했다. 판정 창이 원래 조우 뒤에 가리는 문제를 수정했다. 메모 입력→Escape보류→계속하기 후 절구 선택과 메모가 복원되고 한 번 적용됐다.
8. 직접 목표는 자동으로 성공 판정하지 않고 부분 성공·미달성 확인으로 여정을 마감했다. 휴식기의 도움의 손길에서 Guild Reputation +5를 적용하고 여름으로 전환했다. 새 여정 준비가 열리고 완료한 활동·계절 단계를 올바르게 표시했다.

화면 검증: 1529px 데스크톱, 720px 여정 준비, 360px의 모험·세계 지도·병증 사전·약초·배낭·자료실·진료 기록·발견·이야기에서 페이지 가로 overflow 0. 360px 여정 fieldset 폭 286px, 내부 overflow 0. 실제 카드 설명의 줄바꿈과 주 도구·자료 메뉴를 육안 확인했다.

증거:

- `screenshots/renewal-desktop-final.png` — 현재 타이포·표면·탐색과 넓어진 목적지 설명.
- `screenshots/renewal-journey-720.png` — 중간 폭의 여정 준비.
- `screenshots/renewal-journey-360.png` — 카드와 설명의 세로 배치.
- `screenshots/renewal-treatment-360.png` — 실제 치료 비교·선택 workspace.
- `screenshots/renewal-mobile-menu-360.png` — 모바일 자료·기록 메뉴.

검증 한계: JSON 백업 버튼은 실행했지만 브라우저 다운로드 완료 파일을 회수하지 못해 파일 import 왕복으로 기록하지 않는다. 로그인 클라우드의 실제 원격 업로드·복구, 가능한 모든 조우, 실제 초보 사용자의 과제 성공률·만족도, 운영 배포는 미실시다. 이번 변경은 로컬 코드와 preview다.

## 🚀 Next Steps

### Refinements Needed

현재 반영 사항은 사용자에게 실제 화면으로 제시한다. 새로운 시각 피드백이 오면 현재 서체·작업 폭·기능 계약을 근거로 후속 수정한다. 초보 사용자 관찰과 원격 클라우드 검증은 이번 수행 사실과 구별해 남긴다.

### Action Items

승인 29개를 코드·문서·자동 검사·UI 검증에 반영했다. 남은 검증 과제는 독립 초보 플레이 관찰, 다운로드 파일 왕복, 로그인 클라우드 원격 확인이다. 사용자 승인 없는 배포나 협동 확장은 수행하지 않았다.

### Success Metrics

| 기준 | 이번 확인 |
| --- | --- |
| 금지한 선 장식과 이전 서체 사용 | 현재 entry·UI에서 제거, 이전 자료 archive 보존 |
| 카드 설명 폭과 모바일 메뉴 | 실제 화면·내부 overflow 0 |
| 대안 약재의 획득→조제→소비→영구 도감 | engine-chain·migration·결제 재개 테스트 |
| 실제 치료·보상·마감·휴식·계절의 연결 | UI로 확인, 추가 외부 진료 fixture 구별 |
| 중단한 선택·메모·보상 재개 | UI와 자동 검사로 확인 |
| 사용자 시각 만족·초보 이해도 | 아직 측정하지 않음 |

## Asset provenance

Freesentation 공식 출처: https://freesentation.blog/freesentation 와 공식 FreesentationVF 2.001 배포. 공식 variable TTF를 WOFF2로 변환했으며 글자 형태를 인위적으로 늘리거나 줄이지 않았다. Instrument Serif는 공식 Google Fonts Latin regular 배포본이다. 둘의 OFL을 `public/fonts/`에 보관한다.

최종 회화 자산은 `public/art/woodland-pigment.jpg`다. 원본 생성물은 `/Users/imwul/.codex/generated_images/01a0ff65-7c4f-7543-b116-b8b8d72582b8/exec-da8d3a8e-e755-4e11-87bf-86bd3d77eda9.png`, 보존 사본은 `output/design-archive/woodland-pigment.png`다. 원본1536×1024 이미지를 같은 구도의 JPEG로 인코딩해 약685KB로 제공한다. 참고 이미지의 고유 그림을 복제하지 않았다.

생성 prompt:

> Use case: stylized-concept. Asset type: a small atmospheric artwork for an Apawthecaria woodland apothecary game workspace, not a website screenshot. Create an original, painterly gouache and oil-pastel landscape with a meandering warm terracotta path, masses of deep moss and olive foliage, pale butter-yellow light, subtle dusty rose and blue-grey accents. Composition: horizontal landscape around 3:2, softly cropped trees and foliage, a quiet clearing, no focal character, no writing. Use dense opaque color shapes, broad soft brush marks, visible pigment and canvas grain, sophisticated calm composition inspired by organic landscape painting. The entire scene is built from filled color masses and texture. Absolutely no outlined shapes, no black contour drawing, no line-art, no hatching, no sketched trees, no pen drawing, no vector-art appearance, no UI, no typography, no border, no logos, no watermark.

_Generated using BMAD Creative Intelligence Suite — Design Thinking Workflow. 직접 사용자 피드백, 원문·코드 근거, 에이전트 UI 관찰, 자동 검사와 미실시 검증을 구별해 기록._
