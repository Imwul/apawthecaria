# 웹앱 품질 감사 및 수정 보고서

감사 시작 2026-10-09 · 최종 검증 2026-10-10, Asia/Seoul.

**확정한 문제 12건을 수정했고, 전체 회귀 146파일/1,509테스트, 빌드, 린트가 통과했다. 실제 Chromium에서 주요 9개 페이지와 대표 플레이·저장 흐름을 조작했다. 다만 모든 중첩 규칙 분기와 실제 계정 기능까지 전수 증명하지 못했으므로, 전체 사이트 전수 인증은 아직 통과로 보고하지 않는다.**

## 실행 환경과 변경 범위

- 실제 Vite 개발 서버 `http://127.0.0.1:5173`에 Chromium 1234를 연결했다. Playwright로 DOM을 읽고 실제 버튼·입력·파일 선택·마우스 끌기·새로고침을 실행했다. 정적 분석이나 단위 테스트를 브라우저 확인으로 대체하지 않았다.
- 비영구 브라우저 컨텍스트와 합성 QA 캠페인을 사용했다. 생성→이동→진단→채집→조제→보상→출발은 실제 화면에서 진행했다. 도시 거래·Clinic·Barrow 같은 별도 경계는 저장 상태를 준비한 뒤 실제 UI로 조작했으며, 준비한 상태까지 자연 플레이로 도달했다고 주장하지 않는다.
- 360×1000, 768×1000, 1440×1000에서 주요 9개 페이지를 반복 방문했다. 최종 27개 화면의 문서 가로 넘침, pageerror, console error는 0이었다. 이는 실제 iOS/Android 기기나 모든 모달 상태의 검증을 뜻하지 않는다.
- 작업 시작 당시 존재한 코드·디자인 변경을 보존했다. [기존 변경 목록](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/preexisting-diff-stat.txt>)과 별도 기준 사본을 남겼다. 이번 변경은 확인된 결함의 규칙 연결, 입력·가져오기 안전성, 기존 진료 기록 컴포넌트 재사용, 지도 팝업 위치와 숫자 표시 수정이다. 신규 게임 기능·저장 스키마·디자인 리뉴얼을 추가하지 않았다.

## 룰북 대조 결과

최우선 근거는 제공된 [Apawthecaria v1.3.pdf](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/Apawthecaria v1.3.pdf>), First Edition, Third Printing, May 2023이다. 아래 페이지는 인쇄 페이지이며 해당 PDF 페이지와 일치한다. 이전 감사 문서를 원문 규칙의 대체 근거로 사용하지 않았다.

| 대조 대상 | 확인 결과 | 증거의 범위 |
|---|---|---|
| 원본과 앱 원문 자료 | SHA-256 일치, 220개 페이지의 새 추출 텍스트와 정규화 대조에서 불일치 0 | 원문 자료 무결성. 모든 문장의 자동 적용 정확성을 뜻하지 않음 |
| 정규 데이터 이름·참조 | 599개 중 596개 원문 페이지에 존재. 3개는 원문 표기·누락 예외로 기록 | 이름·출처 검증. 모든 효과의 의미 대조는 아님 |
| 카드·랜덤 테이블 조회 | A=1, J=11, Q/K=M=12. 계절·지역·카드에 대한 3,380 lookup 모두 결과 존재 | 결과 범위·참조 구조. 모든 선택 결과의 정확성을 뜻하지 않음 |
| 핵심 계산·절차 | 이동/초과 소지 p.22–25, 진단·재료·제조 p.26–35, Barter p.34–35, 보상·출발 p.36–37, Clinic p.44–47 등을 코드·회귀와 대조 | 대표 실제 플레이를 추가 검증. 모든 목표·실패·특수 복용은 미완료 |
| 확정 원문 불일치 | p.62 도구 무게, p.14 Chatty, p.115 Wingbreak, p.116 일반 진료/Delve 경계 수정 | 아래 RB-01~04의 재현·수정·회귀 증거 |
| 다른 룰북 혼합·편의 기능 | 확인한 출처 메타데이터는 제공 판본을 가리킨다. 공식/Legacy/Sandbox 경계가 존재하며 공식 모드의 은퇴·계승 제한 안내를 실제 확인 | 이번 범위에서 다른 룰북 혼합의 확정 증거 없음. 모든 모드의 모든 노출은 미검증 |

직접 판정 보정과 합성 저장 복구는 편의 기능이다. 장신구 회당 ±1,000 입력 제한은 브라우저 배열 생성 오류를 막는 기술적 제한이며, 룰북의 장신구 보유 한도로 표시하지 않았다. 1,001개 보유 상태에서 +2로 1,003개가 되는 회귀도 통과했다.

세부 원문 페이지·규칙 목록·테스트는 [룰북 감사 보고서](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/rulebook-audit.md>)에 기록했다. 원문 아이콘은 [p.62 무게](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/source-p62-tool-weights.png>)와 [p.14 Familiar](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/source-p14-familiar.png>)를 직접 렌더해 확인했다.

## 발견·수정한 문제

P1은 잘못된 규칙·계산, 데이터 손상 또는 화면 중단, P2는 흐름·기록 접근 장애, P3는 표시·용어 오류로 분류했다. 확인한 P0 문제는 없었다.

| ID / 심각도 | 수정 전 | 수정 내용 | 수정 후 실제 확인 |
|---|---|---|---|
| RB-01 / P1 | Canvas Tent, Big Iron Cauldron, Bark Coracle이 모두 무게 1. p.62의 2·2·3과 불일치 | 정규 데이터·상점 표시 수정. 알려진 이전 무게 1만 migration으로 복구하고 ID·수량·명시적 Bad Idea 감소·비표준 사용자 무게 보존 | 세 도구 획득 및 기존 파일 가져오기 후 2·2·3, 배낭 8/Carry 5, 과적 속도 1. 새로고침 유지. 새 원문 회귀는 수정 전 5개 실패→6개 모두 통과 |
| RB-02 / P1 | Chatty의 거래 희귀도 -2가 설명에만 있고 계산·preview·실제 거래에는 누락 | 현재 활성 Familiar를 preview/start에 전달. 일반 부위와 Replacement에 p.14 modifier 적용 | Odoak Marigold 거래 BR 2 표시, 부위 획득, 거래 횟수 3→2, Timer 3→2. 원문 회귀 3개 수정 전 실패→통과 |
| RB-03 / P1 | Wingbreak 조건은 저장되지만 BR +2 계산에 미반영. 같은 계절이 다음 해 돌아오면 조건 재사용 가능 | 현재 계절 조건을 거래 계산에 연결하고 중복 비중첩. 계절 전환에서 만료 조건 제거 | 준비한 Spring 조건에서 Chatty와 함께 BR 4. 거래 선택 취소, Summer 전환 후 조건 [] 확인. 새 회귀 2개 실패→통과. native 실패→조건 생성 전체 흐름은 미검증 |
| RB-04 / P1 | 거수 고분에서 일반 환자 접수·현지 진료 UI가 열려 p.116의 Delve 대체와 불일치 | 현재 고분/진행 Delve의 일반 접수 guard와 잘못된 안내 제거. 기존 active care와 p.124 Building Trust 예외 유지 | 수정 전 일반 성격 selector가 열림→수정 후 일반 접수·현지 도움 UI 0. 도전 초안 새로고침·빈 메모 오류·후퇴 1일/다음 속도 1 확인. Building Trust의 Intermediate Brand Care 생성과 진료·재료 조사 UI 유지. 경계 5테스트 통과 |
| NUM-01 / P1 | 장신구 보정 4,294,967,296 적용 시 Invalid array length와 빈 화면 | 수동 보정값·결과에 안전한 정수 검사. 장신구의 회당 ±1,000 한도와 오류/비활성 상태 표시 | 빈 값·0·소수·큰 정수 비활성. +2, 새로고침, -2 정상. 전체 보유 한도는 추가하지 않음 |
| SAVE-02 / P1 | reputation: "broken" 파일을 성공으로 가져와 정상 캠페인을 손상 | migration 전에 명시된 값의 유한 숫자 여부 검사. 명확한 옛 숫자 문자열은 복사본에서 변환 | 손상 파일은 원래 캠페인 유지. "7"→숫자 7, +2→9, 새로고침 유지 |
| SAVE-03 / P1 | 큰 A 다음 작은 B를 선택하면 실제 FileReader 완료 B→A에서 이전 A가 최신 B를 덮어씀 | 헤더·일지에 선택 순서 guard. 일지 화면 이탈 뒤 늦은 읽기 결과 무시 | 실제 native FileReader의 같은 역순 완료를 재현해도 헤더·일지 모두 B 유지 |
| SAVE-01 / P2 | 잘못된 일지 파일을 고친 뒤 같은 파일을 다시 선택하면 change 미발생 | 파일 포착 뒤 input 초기화. 읽기 실패 안내 추가 | 같은 경로 두 선택 이벤트 1→2. 수정한 파일의 재선택·복원 성공 |
| JOUR-01 / P2 | 현재 진료 기록은 존재하지만 일지 count 0/빈 서랍. 발견과 기억·최근 진료도 legacy만 읽음 | 일지에 기존 PatientArchiveView 재사용. 완료된 현재 기록과 legacy 기록의 읽기용 projection 공유. 저장 구조 변경 없음 | 일지 count 1/실제 환자 표시, 진료 기록·발견과 기억·진행 최근 진료에서 동일 환자 확인, 새로고침 유지. 별도 legacy 혼합 count 2·메모·북마크 유지. projection 4테스트 통과 |
| MAP-01 / P2 | 검색 팝업이 두 번째 지도 도구 행을 덮어 검색 닫기·겹침 버튼 클릭을 가로챔 | 기존 도구와 팝업을 같은 위치 기준으로 묶어 팝업이 도구 아래 열리도록 수정. 모바일 하단 배치 유지 | 360/768/1440에서 검색 열기·잘못된 검색·닫기·겹침 체크 해제/복귀를 정상 클릭으로 확인 |
| UI-01 / P3 | 일지 오류 안내의 게임 이름이 ‘아포테카리아’ | Apawthecaria로 통일 | 실제 오류 경로와 안내 확인 |
| UI-02 / P3 | 경로 과적 안내에 7.999999999999 같은 부동소수점 표시 | 기존 무게 formatter 재사용 | 실제 배낭 8/5와 과적 속도 1 안내가 일관되게 표시 |

핵심 수정 파일은 [App.tsx](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/src/App.tsx>), [거래 계산](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/src/rules/barterEngine.ts>), [도구](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/src/rules/data/tools.ts>), [migration](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/src/rules/migrations.ts>), [저장 입력 검증](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/src/persistence/campaignSave.ts>), [지도](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/src/map/PaperMap.tsx>), [지도 배치](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/src/feature-layout.css>), [경로 안내](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/src/components/RouteComposer.tsx>)다. 다른 기존 수정 파일 전체를 이번 작업의 변경으로 계산하지 않았다.

## 실제 방문·조작한 페이지와 기능

아래 결과는 기재된 경로에 한정한다. ‘방문’이나 ‘표시 확인’을 기능 전체의 정상 판정으로 확대하지 않는다.

| 화면 | 실제 조작과 관찰 | 결과·경계 |
|---|---|---|
| 신규 약제사 | 8단계 생성, 작성 초안 새로고침, 무작위/직접 카드, 종·이동·Familiar 도움·관계·기념품·확정 | 생성·초안 복원 성공. 모든 카드 조합은 미실행 |
| 진행 | 목표 없이 시작 오류, ♥A 목표/Locsid 목적지/이유, 2경로 이동, 달력 0→1, 실제 ♦Q 축제 조우 미루기·새로고침·복귀·기록 확정 | 처음부터 끝까지 실제 여정 진행. 모든 Journey goal 완수는 미실행 |
| 환자·채집·조제·출발 | 성격 8/묘사 Q/M/맷닭 선택, Severe가 명성 5에서 Lesser로 제한, Monthly Chore Timer 6. 두 ♥10 채집/향 따라가기/부위 획득, Timer 6→4→3. 즉시 치료 가능 시 일반 후속 시간 처리 순서. 조제 취소→다시 조제, staged reward 저장·복원, +1명성/+1장신구, 재료 1회 소모, Scrounge 3, 출발 정산 | 정상 대표 경로 완주. 실패 결과·모든 반복 복용·모든 조제 방식은 미실행 |
| 지도 | 확대/축소/맞춤/현재, 검색 0결과·Odoak 선택·닫기·겹침, 표시 저장. 추가로 ⌘+빈 곳 생성/취소, 형태·지형·이름 지정, 새로고침 검색 복귀, 이름·지형 편집, 잠금 뒤 마우스 끌기, 연결 생성 취소/육로 확정/실선·빗금 변경/끊기, 표시 삭제·새로고침 | 해당 조작 성공. 계정 지도 게시·모든 연결 히스토리 복원은 미실행. 가까운 Odoak/현재 위치 표시는 기본 배율에서 중심이 겹치지만 확대 한 번 뒤 정상 클릭 확인 |
| 약제사·배낭 | 프로필 편집 취소/저장/새로고침, Chatty 선택, 수동 수치 정상·오류·극단 입력, 정규 도구 3개 획득·무게·Carry·속도, 이전 도구 저장 import | 수정 후 정상. 모든 장비의 파손·사용·업그레이드 lifecycle은 미실행 |
| 영약재 | Marigold 검색·상세·부위·태그·Preparation·필요 도구, 없는 이름 0결과, Winter 0결과와 reset, TITAN/PAIN 3 필터 | 해당 검색·필터·자료 표시 확인. 83종 전체 아이콘/도구 의미의 브라우저 전수 대조는 미완료 |
| 규칙 자료실 | Canvas Tent 검색·무게·출처·관련 절차, 없는 이름 0결과, Tools category, 북마크·새로고침 | 해당 경로 정상. 모든 개인 메모·외부 PDF·교차링크 조합은 미실행 |
| 질환 사전 | Paw Rot 검색·상세, infection/PAIN 필터, 없는 이름 0결과, 원문 drawer·Escape·브라우저 뒤로 가기 | 검색·원문 보기·복귀 확인. 모든 45질환의 치료/실패 UI는 미실행 |
| 일지 | 여섯 서브탭(진료/세계 도감/여정/개인/방랑/은퇴) 방문·목록/빈 상태, 제목·본문 저장/필수 입력, 백업 다운로드·잘못된/같은/역순 파일 가져오기. 사진 첨부 저장·새로고침·확대/닫기, 사진 및 일지 삭제 취소→확정→새로고침 | 실행한 생성·복원·사진·삭제 정상. 세계 도감의 모든 항목·사진 대용량/모든 포맷은 미실행 |
| 진료 기록 | 현재 환자 기록, legacy 혼합 기록, 북마크·메모 보존 | 별도 Chrome 재검증에서 count 2 및 legacy 북마크 유지. 모든 archive edit 조합은 미실행 |
| 발견과 기억 | 현재 완료 환자, 길동무·표본지·지도 기록·선물 목록, 최근 진료 연계 | 원래 false-empty 수정 후 동일 환자 표시. 모든 기념품 소모 후속 연결은 미실행 |
| 도시 거래 | 준비한 Odoak 환자 상태에서 장소별 거래 가능/차단, 0결과 검색, 선택 취소, Chatty BR preview, 실제 두 후속 카드와 부위 획득·Timer·횟수 감소 | 대표 거래 완료. 모든 지불·포기·Replacement 거래 UI는 미실행 |
| Downtime·도구·동반자 | 준비한 상태에서 판매/서비스/recruit 패널, 장소·자금 차단, Saddlebags 구매 30→27, Wagon 취소/commission 27→7, Carry/Speed, Caterpillar 7→4, 활동 완료·Summer 전환 | 해당 거래·모집·계절 흐름 완료. 모든 서비스·동반자 조건은 미실행 |
| Clinic | 4계절 완료·야생 치료 완료 상태에서 Pantry 조건 차단, Mailbox 선택, 건설 취소/확정 20→5, 건설 중, 빈 메모 오류, Lend A Paw로 명성 6→11, Downtime 완료/Summer 완공 | 해당 건설·활동·완공 정상. 다른 Agenda 전수 lifecycle은 미실행 |
| Barrow | 준비한 Uneasy Sleep 입구, 빈 기록 오류, 초안 새로고침, 정상 후퇴/달력 1/다음 속도 1, 일반 접수 차단. Building Trust 특별 환자 생성·진료 패널 | 해당 경계 정상. Building Trust 완전 치료와 모든 고분 승패는 미실행 |
| 기록·설정/기기 저장 | 헤더·일지 JSON 백업/가져오기, 손상 구조·손상 명성, native FileReader 경쟁, actual IndexedDB 대체 저장·새로고침, actual 두 탭 StorageEvent 뒤 오래된 탭 쓰기 차단, 공식 모드 은퇴 제한 안내 | 로컬 검증 완료. 실제 Google 로그인·cloud slot·multi-device는 미실행 |

실제 조작 결과는 [주요 브라우저 기록](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/root-browser-checks.json>), [최종 27화면 및 환자 기록 확인](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/final-browser-smoke.json>), [사진·지도 편집 추가 확인](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/extra-browser-checks.json>), [저장 감사](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/persistence-audit.md>)에 남겼다. 대표 27화면·지도 팝업·환자 기록 확인은 독립 실행 가능한 [브라우저 회귀 스크립트](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/browser-smoke.cjs>)로 다시 실행해 PASS를 확인했다.

## UI Before / After

데스크톱 비교는 동일 1440×1000 viewport에서 촬영했다. full-page 캡처는 내용 삭제에 따라 전체 높이가 달라질 수 있다. 녹색·종이 질감·타이포그래피 등 기존 디자인을 유지했다.

| 문제 | Before | After |
|---|---|---|
| 지도 검색이 도구 행을 덮음 | [Before](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/map-search-1440-before.png>) | [After](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/map-search-1440-after.png>) |
| 일지의 현재 진료 false-empty | [Before](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/journal-casebook-1440-before.png>) | [After](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/journal-casebook-1440-after.png>), [360px](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/journal-casebook-360-after.png>) |
| 발견과 기억의 현재 환자 누락 | [Before](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/living-casebook-1440-before.png>) | [After](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/living-casebook-1440-after.png>), [360px](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/living-casebook-360-after.png>) |
| 고분의 일반 진료 노출 | [Before](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/barrow-care-1440-before.png>) | [After](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/barrow-care-1440-after.png>), [Building Trust 예외](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/barrow-building-trust-care-after.png>) |
| 극단 장신구 보정의 빈 화면 | [Before](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/persistence-huge-trinket-before.png>) | [After](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/persistence-huge-trinket-after.png>) |

지도 검색 Before는 최종 브라우저에 이전 CSS 배치를 일시 적용해 겹침을 재현한 캡처다. 그 재현을 실제 초기 캡처로 혼동하지 않는다. 초기 비편집 화면도 map-1440-before.png에 보관했다. 최종 27페이지 PNG는 파일명에 page와 viewport 폭을 기록했다.

## 자동 테스트·BMAD 검토

| 실행 | 결과 | 의미 |
|---|---|---|
| 수정 전 전체 `npm test` | 140파일 / 1,457테스트 통과 | 기존 회귀가 이번 결함을 모두 검출하지는 못했음 |
| 최종 `npm test` | **146파일 / 1,509테스트 통과** | 원문·저장·수치·고분·기록 회귀 52개 추가. 기존 테스트 기대값을 통과 목적으로 바꾸지 않음 |
| `npm run build` | **통과** | TypeScript 및 production build. 큰 번들 경고는 아래 제한으로 기록 |
| `npm run lint` | **통과** | 오류 없음. 큰 App/기준 사본의 Babel 출력 note만 존재 |
| 규칙 집중 회귀 | 12파일 / 131테스트 통과 | 원문 계산·복원·transaction 관련 subset |
| 저장·입력 집중 회귀 | 11파일 / 142테스트 통과 | 기존 110 + 새 32 |
| BMAD 독립 집중 회귀 | 4파일 / 33테스트 통과 | 검토한 회귀 네 파일의 품질 100/A. 사이트 전체 품질 점수는 아님 |
| 최신 기록·고분 경계 | 2파일 / 9테스트 통과 | canonical/legacy projection 4, 고분 guard 5 |
| 실제 브라우저 재실행 | 27화면 + 환자 기록/새로고침/지도 조작 PASS | pageerror/consoleerror 0. 전체 게임 분기 E2E는 아님 |

최종 로그: [전체 테스트](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/final-test.log>), [빌드](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/final-build.log>), [린트](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/final-lint.log>), [브라우저 재실행](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/replay-browser-smoke.log>).

BMAD는 이름만 언급하지 않고 공식 **TEA 1.27.2 Test Design → Test Review → Trace/Gate**를 실제 실행했다. 필요한 QA 스킬만 설치하고 기존 설정을 보존했다. 위험·수용 기준·테스트 품질·고유 선언·브라우저 증거를 산출물로 남겼다. [BMAD 실행 기록](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/bmad-workflow.md>)과 [추적 행렬](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/bmad-test-artifacts/trace/traceability-matrix-epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit.md>)을 참고한다.

**공식 전체 범위 Gate는 FAIL이다.** 통과한 회귀와 별개로 사용자가 요구한 ‘모든 규칙·분기·컨트롤’의 완전한 증거가 부족하기 때문이다. 실패한 실행 테스트가 있다는 뜻이나 기능 커버리지가 0%라는 뜻은 아니다. 이 결과를 면제하거나 사이트 전체 PASS로 바꾸지 않았다.

## 보류한 규칙·미해결 사항과 이유

다음은 원문 충돌·누락이므로 추측해 수정하지 않았다.

1. Wagon commission: p.43은 20 Trinkets, p.68 Base Unit은 15. 실제 UI commission은 20, catalogue는 15를 따른다. 이번 브라우저에서 27→7을 확인했으나 원문 가격의 완전한 일관성을 인증하지 않는다. 저자 정오표/판본 확인이 필요하다.
2. Nervefright·Seasonshift: p.103 index는 Severe, p.110/111 개별 설명은 Lesser. 현재 draw는 index를 따른다. 어느 쪽을 정답으로 바꿀지 보류했다.
3. Summer Loch Foraging 10/J: p.169의 중복·누락을 명시적 예외 행으로 두었다. 이 두 선택의 실제 UX와 후속 처리 전체는 미검증이며 임의 조우를 채워 넣지 않았다.
4. Smokesnout/Smoker’s Snout 표기, 일부 Wormridden/Bite The Paw 참조 차이는 실제 본문 출처와 함께 기록했다. 이름만으로 별도 질환을 창작하지 않았다.
5. The Runs p.113의 Woeful Waters 후속 질환은 제공 룰북에 독립 정의가 없다. Timer·태그를 만들지 않았다.
6. Wake·Broken Beaks의 반복 dose 조건, 모든 동시 질환·FAIR/FOUL·촉매·조제 도구 조합, 모든 Barrow/Clinic/Service/Companion lifecycle과 nested/manual encounter는 실제 브라우저 전수 완주 증거가 없다. 단위 테스트/lookup 존재를 완주로 보고하지 않는다.

추가 관찰과 환경 경계:

- 지도 편집 추가 확인 중 준비한 캠페인의 Odoak 중심 클릭이 가까운 현재 위치 표시의 hit target에 가로막혔다. 제공 좌표의 y 간격은 약 3.18%였다. 별도 브라우저에서 기본 배율의 겹침을 재현한 뒤 **확대 한 번으로 Odoak 정상 클릭**을 확인했고, 검색 선택도 가능했다. 위치를 임의로 재배치하지 않았다. 모든 밀집 표시·배율의 선택 우선순위는 미검증이다. [재현 결과](</Users/imwul/Library/Mobile Documents/com~apple~CloudDocs/apawthecaria-apo/output/full-site-qa-2026-10-09/map-dense-marker-check.json>)를 남겼다.
- 실제 Google 로그인, 클라우드 슬롯 업로드·다운로드·삭제, 다중 기기 동기화 및 관리자 지도 게시를 실행하지 않았다. 사용 가능한 합성 계정이 없는 상태에서 실제 계정 데이터를 쓰지 않았으며, 관련 단위 테스트 통과만 확인했다.
- 실제 모바일 기기·soft keyboard·핀치·Safari/Firefox, localStorage와 IndexedDB 동시 거절, OS 파일 읽기 권한 거절은 미재현이다. FileReader.onerror는 실제 handler 제어 회귀로만 확인했다.
- production App 번들은 약 2.60MB, gzip 약 666KB이며 500KB chunk 경고가 남는다. 이번 명백한 결함 수정과 별개의 성능 측정·분할 작업이 필요하다. 로드 시간을 정상이라고 인증하지 않는다.
- 수정 도중 발견된 타입 오류/임시 미정의 참조는 최종 검사 전에 수정했다. 최종 새 브라우저에서 runtime/console 오류 0, 빌드·린트 통과를 확인했다. 잘못된 파일의 의도된 오류 로그와 개발 중 오류를 최종 정상 세션 결과에 섞지 않았다.

확정한 12개 결함의 수정·관련 회귀는 완료됐다. 남은 항목은 이 보고서에서 전수 검증 공백 또는 원문 확인 필요 사항으로 유지한다.
