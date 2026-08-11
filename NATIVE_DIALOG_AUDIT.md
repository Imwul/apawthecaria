# Native Dialog Audit

## Scope

Release Gate Repair와 한국어 표시 전수 검사에서 `src/App.tsx`의 `prompt`, `alert`, `confirm` 호출을 다시 검색했다. 규칙 엔진과 저장 데이터는 변경하지 않고, 표시와 입력 표면만 판정했다.

## Inventory

| API | Call sites | Classification |
|---|---:|---|
| Controlled in-app prompt | 17 | Core campaign gameplay-critical |
| Native `prompt()` / `window.prompt()` | 53 | Optional feature input 48, manual/recovery input 5 |
| `showAlert()` | 210 | Informational; 한국어 표시 변환을 거친 단일 wrapper |
| Native `alert()` | 0 | 없음 |
| Native `confirm()` / `window.confirm()` | 34 | Transaction confirmation 24, destructive confirmation 10 |

`showAlert()` 내부의 `window.alert()` 1곳은 wrapper 구현이며 개별 gameplay call site가 아니다.

## Core Gameplay-Critical Inputs

다음 입력은 native prompt 의존성을 제거하고 `ControlledPromptDialog`로 연결했다.

| Flow | Inputs | Result contract |
|---|---|---|
| Foraging | 부위, 수량, 적용 타이머 | 기존 채집 transaction 입력과 동일 |
| Encounter | 판정 기록 | 기존 journal note와 동일 |
| Patient | 질환, 환자 이름, 종/생김새, 첫인상 | `resolvePatient()` 입력과 동일 |
| Leave | 떠나보내기 기록 | `resolveLeave()` transaction과 동일 |
| Barter | 거래 부위 | barter resolver 입력과 동일 |
| Treatment | 수동 태그, 진료 일지 | treatment transaction 입력과 동일 |
| Journey ending | 결과 선택, 회고 | journey ending resolver 입력과 동일 |
| Manual discovery | 영약재와 부위 | 기존 수동 발견 기록과 동일 |

공통 입력창은 취소, 빈 입력, 기본값, Enter 확정, Escape 취소, 중복 클릭 차단을 제공한다. Patient 생성은 입력창이 닫힌 뒤 한 번만 canonical transaction을 실행한다.

## Remaining Native Prompts

남은 53곳은 한국어 안내를 사용하며 아래처럼 분류된다. 모두 해당 보조 기능을 플레이어가 명시적으로 선택했을 때만 열린다.

| Lines | Count | Classification | Purpose |
|---|---:|---|---|
| `4653` | 1 | Manual/recovery | 도감에서 영약재 수동 추가 |
| `4863-4945` | 4 | Manual/recovery | 구조화되지 않은 조우 효과의 수치, 영약재, 손실, 이동 대상 기록 |
| `6399-6424` | 4 | Optional gameplay | 승객 이름, 목적지, 역할, 도구 선택 |
| `6778-6784` | 2 | Optional gameplay | 휴식기 재고 보충 부위와 수량 |
| `6851` | 1 | Optional gameplay | 도구 교체 대상 |
| `6909-6942` | 4 | Optional gameplay | 길드 서비스 선택, 복수 선택, 이용 기록, Survey Paths 방식 |
| `7130-7153` | 2 | Optional gameplay | Clay Pots 재배와 동료 선택 |
| `7267-7283` | 3 | Optional gameplay | 여정 시작 시 Clay Pots, Resourceful, Ingenuitive 선택 |
| `7428-7432` | 2 | Optional gameplay | Brave 보상 영약재와 부위 |
| `8233` | 1 | Optional gameplay | 여분 채집 조제 부위 |
| `8362` | 1 | Optional gameplay | 뜨개질 프로젝트 |
| `8420-8451` | 7 | Optional gameplay | 휴식기 지도 연결, 정착지, 지역, 설명 |
| `8526-8597` | 4 | Optional gameplay | 약제소 아젠다: Sodden Logs, 약제소 이름, Mailbox, Pantry |
| `8680-8718` | 2 | Optional gameplay | Gardens와 Sodden Logs 수확 부위 |
| `8982` | 1 | Optional gameplay | 수동 물꼬 거래 부위 |
| `9015-9033` | 5 | Optional gameplay | Make Do / Replacement 조건과 획득 방식 |
| `9191-9219` | 4 | Optional gameplay | Bad Idea Inspiration의 도구와 개조 선택 |
| `10653` | 1 | Optional gameplay | Reconnecting with Guildmates 목적 도시 |
| `12282` | 1 | Manual/recovery | 수동 채집 완료 처리 |
| `14033` | 1 | Manual/recovery | 약초 도감의 수동 가방 추가 |
| `14143-14145` | 3 | Manual/recovery | 질병 도감의 수동 환자 메타데이터 |

이 호출들은 실제 브라우저에서 지원되는 native input이며 core clean-campaign smoke의 필수 경로에는 없다. 향후 접근성 개선에서는 동일한 controlled input으로 옮길 수 있지만, v1.0.0 Release Gate의 Patient 생성 실패 원인과는 분리한다.

## Confirmations

- Destructive confirmation: 새 기록지 초기화, 은퇴, 로그아웃, 가방/장신구/사진/일지 삭제, 환자 떠나보내기, 동료 방생.
- Transaction confirmation: 결제, 도구 효과 사용, 기부, 계절 전환, 여정 종료, 보상 교환.
- Cloud restore confirmation: 원격 백업이 현재 로컬 진행을 덮어쓰기 전에 확인.

모든 확인 문구는 한국어이며, 고유명사와 canonical rule tag만 원문 표기를 유지한다.

## Release Assessment

- Patient creation native prompt dependency: **REMOVED**
- Core clean-campaign prompt dependency: **REMOVED**
- `prompt() is not supported` on the certified core path: **NOT REPRODUCED**
- Rule engine, schema v8, migration semantics: **UNCHANGED**
