# BMAD TEA 실행 기록

감사 요청: 2026-10-09. 재개·최종 워크플로 기록: 2026-10-10 (Asia/Seoul). 이 문서는 실제로 적용한 공식 워크플로와 검증 범위를 기록한다.

## 공식 패키지 확인과 최소 설치

기존 BMAD 설치는 core-tools/CIS만 실제 설치되어 있었으며 QA/Test Architecture 스킬을 실행했다고 가정하지 않았다. 기존 `bmad` 설치 스킬과 setup 안내, find-skills 스킬을 읽고 공식 저장소를 확인했다. 출처: [공식 TEA 문서](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/), [공식 TEA 저장소](https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise), [BMAD 완료 작업 테스트 안내](https://docs.bmad-method.org/build/test-completed-work/).

탐색한 명령은 `npx --yes skills find bmad test --owner bmad-code-org` 및 공식 저장소의 `skills add --list`였다. 전체 프로젝트 재초기화 대신 아래 네 스킬만 설치했다.

```sh
npx --yes skills add bmad-code-org/bmad-method-test-architecture-enterprise --skill bmad-testarch-test-design bmad-testarch-test-review bmad-testarch-trace bmod-tea -g -y
```

설치된 TEA metadata는 **1.27.2**, 기존 core 요구 버전은 **6.13.0-next**다. 실제 스킬 원문 위치:

- `/Users/imwul/.agents/skills/bmad-testarch-test-design/SKILL.md`
- `/Users/imwul/.agents/skills/bmad-testarch-test-review/SKILL.md`
- `/Users/imwul/.agents/skills/bmad-testarch-trace/SKILL.md`
- `/Users/imwul/.agents/skills/bmod-tea/knowledge/tea-index.csv`

공식 `bmad/scripts/setup.py`를 `--module tea`와 프로젝트 답변 파일로 실행했다. 답변 파일은 설정 후 제거했다. `_bmad/config.toml`의 기존 core/bmm 설정을 보존하고 TEA 설정만 추가했다. 결과: current=true, dependency problem/pending question 없음. test_artifacts는 이 감사 폴더 내부이며 frontend/Vitest, browser=auto, execution=auto다. Playwright/Pact utils는 false, broker는 none으로 추가 앱 의존성을 만들지 않았다. actual browser는 기존 Playwright 라이브러리와 Chromium/Chrome을 사용했다. Playwright CLI 실행·설치를 주장하지 않는다.

## Test Design — 실제 적용

사용자의 명시한 요구를 여덟 QA 수용 기준으로 기록하고 Epic 모드의 다섯 단계(모드→맥락→위험→커버리지→산출물)를 실행했다. 기존 README/RULE_FOUNDATION/RULESET_MATRIX/KNOWN_LIMITATIONS/테스트 스택과 공식 risk-governance, probability-impact, test-levels, priorities, relevant NFR knowledge를 읽었다. source rule, 데이터 손실, 순서, 수동 효과, UI, 증거 품질의 위험/우선순위와 실제 브라우저 + 적절한 rule regression 역할을 나눴다.

산출물: `bmad-audit-requirements.md`, `bmad-test-artifacts/test-design/test-design-epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit.md`, 같은 폴더 progress 파일. 신규 기능·CI·테스트 프레임워크를 만들지 않았다.

## Test Review — 실제 적용

실제 변경한 규칙/입력/가져오기 회귀 **네 파일**을 authoritative scope로 읽었다. 그 밖의 실제 기존 테스트 여덟 파일에서 관례를 측정했다(기존 corpus140, nearby scanned40). 전체 역사 테스트 품질을 검토했다고 주장하지 않는다. 공식 criteria registry의 고정 severity/gate를 사용해 determinism/isolation/maintainability/performance 네 차원을 평가하고 각 JSON을 저장·읽어 집계했다. 네 슬롯이 모두 사용 중이어서 추가 자식 대신 순차 worker 단계를 실행한 이유를 명시했다.

결과 **100/100 A, Approve**는 네 회귀 파일의 테스트 구성에 한정한다. 규칙 담당자의 의도된 실패 단계에서 Wingbreak 두 실패를 실제 포착했고 구현 후 기대 규칙을 바꾸지 않고 통과했다. 최신 독립 focused 재실행 **4파일 / 33테스트 통과**, 2026-10-10 22:19 KST. 실제 App handler를 읽어 실행하는 제어 회귀와 실제 native FileReader browser 검증은 구분했다.

독립 변경 검토는 세 도구 무게/멱등 migration, Chatty/Wingbreak modifier, 수치 안전성/기술적 입력 한도, Journal canonical+legacy 재사용을 다뤘다. 실제 격리 Chrome에서 canonical+legacy count2, 메모, 북마크, pageerror0을 확인했다. FileReader 역순 덮어쓰기 가능성을 찾아 저장 담당자에게 전달했고, 그 담당자는 실제 native API로 수정 전/후를 재현하고 sequence/alive guard를 추가했다. 이후 여섯 handler 회귀를 다시 읽었다. Barrow 최신 수정은 p.116의 Delve 대체와 p.124 Building Trust 예외를 근거로 검토했다. 원래 있다고 추정했던 diagnose guard는 root가 새로 추가한 것으로 정정했다.

산출물: `bmad-test-artifacts/test-review/test-review-epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit.md`, `quality-*.json`, `convention-baseline.json`, 최신 focused log, 재실행 가능한 `verify-legacy-journal.cjs` 및 browser JSON/스크린샷.

## Trace / Gate — 실제 적용

사용자 요구를 formal oracle로 두고 실제 테스트 선언·assertion·파일 경로/줄을 매핑했다. **36개 고유 선언/스크립트, 9파일**(34 unit 선언, 2 E2E)만 accepted inventory에 넣었다. parameterized 선언 수는 실행된33개 케이스 및 전체 suite 수와 다르다. 기존 reference의 source-string 접근성 테스트는 실제 렌더/키보드 검증으로 인정하지 않았다. 220페이지/599개 이름·참조/3,380 lookup 구조 증거를 모든 서사·효과 의미 검증으로 확대하지 않았다.

Phase1 JSON을 run-key/timestamp가 있는 `/tmp`에 저장하고 경로를 progress에 기록했다. Phase2는 **그 경로의 같은 파일을 읽고** 공식 deterministic rule을 적용했다. durable coverage-matrix도 보관했다. configured formal live manifest는 없음으로 표시했으며 이 워크플로가 가짜 live 결과를 작성하지 않았다. waiver register도 없고 면제를 추정하지 않았다.

최종 갱신 시점의 넓은 사용자 기준8개 중6개는 PARTIAL, 확정 결함 수정·회귀인 QA-07과 정확한 종합 보고인 QA-08은 FULL이다. 최종 root 전체 테스트146파일/1509개와 독립 rule subset12파일/131개, 새 Barrow guard5개도 통과했다. 따라서 FULL만 계산하는 공식 Gate는 **FAIL (P0 0/4 FULL)**이다. 이는 실패한 회귀 테스트 수나 사이트 기능 커버리지0%가 아니다. 모든 규칙·분기·메뉴·계정·화면 상태를 완전히 증명하지 못했으므로 전수 인증을 하지 않는다는 의미다. root 최종 갱신 요청으로 새 Phase1 snapshot을 저장·동일 경로에서 다시 읽어36개 선언과 최종 브라우저/테스트 증거를 반영했다. 최종27화면에서 문서 overflow/pageerror/consoleerror는0이었다. 신규 배포나 외부 승인 동작은 수행하지 않았다.

산출물: `bmad-test-artifacts/trace/traceability-matrix-epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit.md`, `coverage-matrix-...json`, `e2e-trace-summary-...json`(schema0.3.0), `gate-decision-...json`(schema0.1.0). 공식 checklist로 수용 기준 누락·경로·고유 수·분류·산술·live/waiver 표현을 검증했다. 각 워크플로 completion hook은 empty여서 추가 실행 지시가 없었다.

## 남은 증거 경계

모든 printed/manual/nested encounter, reagent icon, 서비스/Clinic/Companion/Barrow lifecycle을 원문 의미와 실제 브라우저로 전수 검증했다는 증거는 없다. 현재 registry는358 printed effects(312 nonimplemented/manual)이며 과거 언급347을 현재 전수 개수로 사용하지 않는다. 실제 Google 로그인·cloud slot/multi-device·모바일 soft keyboard도 미검증이다. 원본의 Wagon 가격, 일부 Severity, Summer Loch10/J, Smokesnout 명칭, 정의 없는 Woeful Waters 등 충돌은 창작으로 수정하지 않았다. 실제 source/persistence 감사 및 최종 root 방문 보고서의 한계를 함께 읽어야 한다.

최종 JOUR-01 확장: canonical 완료 환자가 LivingArchive/Play 최근 기록에서도 비어 보이는 같은 결함을 읽기용 projection으로 수정했다. treated/failed만 legacy와 새 배열에서 병합·정렬하며 저장 구조/legacy 메모·북마크를 변경하지 않는지 독립 검토했다. 새 projection4 + Barrow5를 실제 재실행해9/9통과, 최종 전체146파일/1509개도 로그에서 확인했다. 위 테스트 구성100/A 점수는 기존 네 파일의 focused review에 한정하고 새 projection 검토는 별도 기록했다. Phase1 신규 snapshot을 정확한 저장 경로에서 다시 읽어36개 선언/8파일로 갱신했으며 전수 인증 Gate FAIL은 유지했다.

종합 보고서 최종 검증: full-site-qa-report.md 전체를 읽고38개 링크 모두 존재·확정12행·최종146파일1509·실제/미검증 구분을 확인했다. QA-08 보고 수용 기준을 FULL로 갱신했다. 추가 사진·일지 삭제/지도 편집·연결 경로는 actual extra-browser-checks 증거로 반영했고 Odoak 기본배율 근접 표시 겹침은 별도 재현 후 확대 한 번/검색 선택 가능을 확인했으며 모든 밀집 조합은 미검증으로 남겼다. QA worker가 browser-smoke.cjs를 별도 실제 브라우저 프로세스로 재실행해27화면/환자기록/새로고침/지도조작/오류0 PASS(exit0)를 확인했다. 재실행 가능한 스크립트1건을 E2E inventory에 추가해최종36개 선언/9파일;36은1509실행 케이스와 다른 수다. 새 Phase1을 저장하고 같은 경로 Phase2에서 다시 읽었으며 FULL2/8(25%)·P0미완료로GateFAIL을 유지했다.
