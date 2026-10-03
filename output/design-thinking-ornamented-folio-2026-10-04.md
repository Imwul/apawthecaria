# Design Thinking Session: Ornamented Forest Folio

**Date:** 2026-10-04
**Facilitator:** Codex, BMAD Design Thinking
**Design Challenge:** 건조한 문서 도구처럼 느껴지는 Forest Folio에 풍부한 숲의 장식과 여행책의 물성을 더한다.

## Design Challenge

사용자는 현재 화면을 프레젠테이션/노션처럼 느끼며 장식 요소의 대폭 보강과 푸시를 요청했다. 기능을 해치지 않으면서 첫인상부터 달라지는 회화·제본·문장·장별 판면을 만든다. 이전 요청의 큰 글씨, 좁고 길쭉한 한글/현재 영문 폰트, 숲빛+아이보리, 선 위주의 손그림 금지를 유지한다. 최신 요청이 이전 attention pass의 CSS 변경 금지보다 우선한다.

BMAD skill의 customization/defaults, template, 모든 design methods를 읽었다. 이 프로젝트의 resolver/config scripts는 없고 customization은 빈 기본값이다. 설치 작업을 섞지 않고 기존 세션처럼 neutral defaults를 사용한다. 사용자 ‘토의를 통해 알아서’에 따라 단계별 확인 대기 없이 관점 토의와 결과를 이 문서에 저장한다. 새 subagent는 생성하지 않는다.

## EMPATHIZE: Understanding Users

### User Insights

실제 사용자 발언: 너무 건조함, 장식이 없어 프레젠테이션/노션 같음. 과거 맥락: 디자인 전면 변경, 선 손그림 거부, 작은 글씨 거부, 3440×1440 모니터, 숲빛/아이보리와 회화 선호. 새 인터뷰나 만족도 검사는 수행하지 않았다.

선택 방법: Empathy Mapping(명시 발언과 추정 분리), Journey Mapping(모험/자료/기록의 연결), 기존 화면을 통한 Shadowing의 제한된 구현 관찰. 주 플레이어는 룰북을 따로 보지 않고 여행/채집/치료/기록을 하는 한국어 사용자다.

### Key Observations

구현에서 chapter art와 folio를 display:none으로 두고 장 도입을 텍스트 두 열로 구성한다. 계속된 border:0/background:transparent 규칙이 색면과 구획의 물성을 없앴다. 모험만 한 개 회화가 있고 모바일에서는 숨겨진다. 기능 위계는 개선되었으나 각 장을 기억할 시각적 소재가 부족하다. 이는 사용자 만족도의 직접 측정이 아니라 코드와 화면 관찰이다.

### Empathy Map Summary

Say: ‘건조해’, ‘장식이 너무 없어’. Do: 실제 플레이하면서 디자인을 반복 수정 요청. Think(가설): 장부를 관리하기보다 책 속 숲에 들어가고 싶다. Feel(가설): 정리된 레이아웃만으로는 흥미/애착을 느끼기 어렵다. 유지해야 할 것: 읽을 수 있는 큰 글씨와 이미 검증된 게임/복귀 동작.

## DEFINE: Frame the Problem

### Point of View Statement

여행하는 약제사로 플레이하는 사용자는 화면마다 숲과 책의 개성을 느낄 장식적 실마리가 필요하다. 기능이 정리되어도 표지와 판면이 텍스트/선만 남으면 세계를 탐험하는 경험이 문서 작성으로 느껴지기 때문이다.

### How Might We Questions

- 어떻게 회화를 장마다 보이게 하면서 실제 작업을 가리지 않을까?
- 어떻게 장식과 기능 상태를 구별하면서 책의 물성을 만들까?
- 어떻게 3440 화면의 넓은 바깥 숲과 360 화면의 작은 판면 모두 풍부하게 만들까?
- 어떻게 기존 그림·서체를 살려 일관된 문장과 제본 표현을 만들까?

### Key Insights / 관점 토의

미술 관점: 숲을 작은 삽화로만 남기지 말고 endpaper, chapter plate, 문장에 반복해 세계를 만든다.
읽기 관점의 반론: 풍부함을 본문 뒤 이미지나 작은 장식 글씨로 해결하면 피곤하다. 이미지는 별도 판면/여백, 긴 본문은 밝은 평면이어야 한다.
플레이 관점의 반론: 장식을 위해 새 CTA/위저드/자동 진행 상태를 만들 필요가 없다. 접힌 안내, urgent 전면, 입력/검색/원문/복귀를 유지한다.
결론: ‘Illuminated Forest Folio’—외곽은 식물 태피스트리, 각 장은 회화 판면과 황동 문장, 실제 작업은 밝고 넓은 종이. 장식을 실제 버튼처럼 보이게 하지 않는다.

## IDEATE: Generate Solutions

### Selected Methods

Analogous Inspiration(장정/식물 직물/표본책), SCAMPER Design(평면 구분선→제본/리본), Crazy 8s(표지/장 도입/모바일 변형), Brainstorming(발산 후 읽기 제약으로 수렴).

### Generated Ideas

1. 숲 식물 endpaper 배경
2. 표지의 황동 메달 문장
3. 겹친 종이 가장자리
4. 제본 안쪽 음영
5. 골드와 구리의 소량 장식
6. 각 장 회화 판면
7. 장별 그림 크롭
8. 장 번호 인장
9. 영문을 회화 위 책 제목으로
10. 작은 색면 제목 리본
11. 책갈피 형태의 현재 탭
12. 메타데이터를 인쇄된 표식으로
13. 약초 항목의 표본 번호 도장
14. 병증 항목의 처방지 틀
15. 일지 입력의 실제 종이 구획
16. 배낭의 채비 목록 판면
17. 캐릭터 시작의 장정 표지
18. 규칙 서랍의 식물 endpaper 머리말
19. footer의 화관과 판권 판면
20. 카드 뒷면의 식물 직물
21. 모든 본문 뒤에 회화(가독성 때문에 제외)
22. 큰 장식 hero를 모바일마다 반복(작업 거리 때문에 제외)
23. 새로운 장식 대시보드(기존 플레이 흐름 때문에 제외)
24. 작은 손그림 아이콘 일괄 추가(사용자 금지 때문에 제외)
25. 본문 dropcap와 난삽한 글꼴 혼합(현재 폰트/읽기 유지 때문에 제외)
26. 반짝이는 반복 애니메이션(주의 경쟁 때문에 제외)

### Top Concepts

1. Botanical binding: 식물 endpaper + 표지 문장 + 종이 층과 제본.
2. Chapter plates: 원래 회화의 장별 크롭 + 번호 인장 + 장 제목, 큰 한글 정보 별도 유지.
3. Printed field pages: 기존 항목에 색면/인장/종이 구획을 더하고 조작/저장 구조는 유지.

## PROTOTYPE: Make Ideas Tangible

### Prototype Approach

작은 실제 React/CSS 판면 prototype을 만든 뒤 브라우저로 넓은/일반/모바일 폭에서 확인하고 수정한다. 코드에서만 결론내지 않는다. 기본 서체, 의미/라벨, nav 목적지, 규칙/저장 스키마를 유지한다. 새 raster endpaper는 builtin imagegen을 사용한다.

### Artwork

Builtin imagegen generated an original dense gouache botanical endpaper. Local source: `/Users/imwul/.codex/generated_images/01a0ff65-7c4f-7543-b116-b8b8d72582b8/exec-0fe5b215-dfb0-49f3-80e3-b4c31511e623.png`. Repository asset: `public/art/botanical-endpaper.webp` (1536×1024, 376,638 bytes), compressed with Pillow without composition edits. Exact prompt is recorded in `public/art/botanical-endpaper.prompt.md`. Existing `forest-folio.jpg` is retained and used in the chapter plates and play landscape. New art is decorative and does not purport to depict a rulebook herb precisely.

### Prototype Description

공유 ChapterOpening/TodayOverview/표지에 장식 요소를 배치하고 기존 workspace presentation layer를 수정한다. 새 장식은 aria-hidden, 빈 alt, pointer-events:none을 사용하고 게임 상태를 표현하지 않는다. 작업 표면은 불투명 아이보리, 큰 글씨와 기존 입력 대비를 유지한다.

### Key Features to Test

9개 장의 장식 일관성, 3440/1280/720/360 가로 overflow, 모바일 작업 거리, 주 CTA/카드/검색/일지/원문 닫기/포커스, 이미지 실패 시 읽기, 큰 글씨, 저장 상태, 모험과 자료 왕복 시 초안 보존.

## TEST: Validate with Users

### Testing Plan

브라우저 실제 UI 조작과 screenshot으로 전후를 기록한다. 변경에 맞는 기존 테스트와 전체 lint/build를 실행한다. 실제 5–7명 사용자 관찰은 이번 실행에 포함되지 않으며 만족도/수행속도 개선을 주장하지 않는다. 배포 여부와 별개로 요청된 Git commit/push의 원격 hash를 확인한다.

### User Feedback

이번 작업 시작 시 명시된 사용자 피드백 외 새 피드백 없음.

### Key Learnings

- 세 관점의 토의를 공유 판면에 적용했다. 외곽 endpaper, 황동 문장, 책갈피 목차, 장별 회화/인장, 원고지/표본/처방의 종이 표현을 실제 React/CSS에 구현했다.
- 본문/조작 서체, 큰 글씨 토큰, 기존 게임/nav 라벨과 저장 스키마를 변경하지 않았다. 모바일/태블릿은 CSS에서 한 열/표지 줄바꿈으로 재배치하며, 실제 폭별 브라우저 측정은 아직 하지 못했다.
- 전체 126개 파일/1,291개 테스트 통과. 마지막 CSS 대응 후 기존 mobile layout/guide/notice/almanack 4개 파일의 40개 테스트도 통과. 새 외관을 그대로 되풀이하는 테스트는 만들지 않았다.
- 전체 ESLint 통과: iCloud 의존성 읽기가 지연돼 package-lock 동일 버전을 임시 로컬 폴더에 offline/ignore-scripts로 복원하고, 동일 config로 원래 작업 폴더 전체를 검사했다. 프로젝트 package/lock/의존성 버전은 변경하지 않았다.
- 첫 production build 및 마지막 태블릿/작은 폭 대응까지 포함한 최종 `npm run build` 모두 통과했다(규칙 4개, reference 8개, tsc, Vite). 기존 큰 App chunk 경고를 이 디자인 작업에서 해소했다고 주장하지 않는다.
- **브라우저 검증의 제한:** 서버를 다시 실행했으나 기존 탭이 `data:` 오류 페이지로 바뀌어 자동 브라우저 URL 정책이 재접속을 차단했다. HTTP 직접 복원도 기존 오류 탭 때문에 차단돼 사용자가 주소창으로 다시 여는 것을 요청했다. 차단을 다른 브라우저/API로 우회하지 않았다. 현재 화면 screenshot/3440·360 overflow/현재 UI 조작은 이번 실행에서 확인하지 못했고, 이전 screenshot을 새 결과로 제시하지 않는다. 이 제한 때문에 디자인 만족도나 현재 실제 화면의 적합성을 검증 완료로 표현하지 않는다.
- 원래 캠페인 데이터는 브라우저에서 조작하지 않았다. 이전 일지 초안/탭 복구와 urgent 안내 분기는 유지하며 기존 테스트가 통과한다.


## Next Steps

### Refinements Needed

실제 화면에서 회화 면적, 본문 대비, 좁은 열 줄바꿈을 조정한다.

### Action Items

회화 생성 → 공유 판면 구현 → 9개 장/폭별 검사 → 적절한 tests/lint/build → 승인된 로컬 변경을 coherent commit으로 정리 → 현재 branch push → 원격 확인.

### Success Metrics

장식이 실제 화면에 보임, 본문/조작 가로 overflow 0, 게임/저장/탐색 라벨과 동작 보존, 3440 본문/메타 크기 유지, 새 artwork repo 포함, 검증 통과, commit/push 원격 반영. 사용자 감정 평가는 구현 검증과 구별한다.

## Execution record

- 작업 branch: `codex/forest-play-experience`. 원격 `main`의 별도 디자인/서비스 수정은 덮어쓰지 않는다.
- 기존 사용자 승인 범위의 미커밋 게임/안내/Forest Folio 수정과 필요한 파일을 함께 커밋할 준비를 했다. 새 장식 변경만으로 이 기반 파일을 누락하면 동작이 불완전해진다.
- Git push 후 원격 branch hash를 확인한다. Production main으로의 병합/배포 완료를 주장하지 않는다.

- 최종 production build 종료 코드 0 확인. 최종 bundle에 endpaper 자산과 표지의 tablet wrap/작은 폭 브랜드 대응이 포함되는지 파일 검사했다. 실제 browser screenshot 확인과는 구별한다.
- 새로 포함하는 OFL license 파일의 CRLF/줄 끝 공백만 LF로 정규화했다. license 문구는 바꾸지 않았다.
