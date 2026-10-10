# 저장·복원·수치 입력 QA

검증일: 2026-10-10 (Asia/Seoul). 최초 감사 요청과 증거 폴더명은 2026-10-09.

실제 Chromium 1234, 개발 서버 `http://127.0.0.1:5173`, 1440×1000 화면의 격리된 비영구 브라우저 컨텍스트에서 수행했다. 사용자의 브라우저 프로필·기존 저장 파일·Google 계정에는 접근하거나 변경하지 않았다. 모든 테스트 캠페인과 파일은 합성 QA 데이터다.

## 실제 방문·조작한 영역

- 신규 캠페인 시작 화면: 빈 저장 상태와 첫 입력 화면, 헤더 JSON 가져오기.
- 진행 화면: JSON 가져오기 완료 후 이동과 성공 안내.
- 개인 일지 화면: 파일 선택, 잘못된 JSON, 동일 파일 재선택, 파일 수정 후 재선택, JSON 백업 다운로드, 일지 기억 보존.
- 약제사·배낭: 직접 판정 보정 펼침, 장신구 및 Guild Reputation 입력·적용, 빈/0/소수/큰 정수/양수/음수, 저장 상태 및 새로고침.
- 기록·설정: JSON 백업 다운로드와 헤더 가져오기.
- 실제 두 탭: 한 탭의 변경이 다른 탭에 StorageEvent로 전달된 후 오래된 탭의 저장 차단.
- 실제 IndexedDB: localStorage 쓰기에 QuotaExceededError만 주입한 상태에서 대체 저장 및 새로고침 복원. IndexedDB와 FileReader 자체는 실제 브라우저 API를 사용했다.

## 발견 및 수정

| ID / 심각도 | 수정 전 실제 결과 | 수정 | 수정 후 검증 |
|---|---|---|---|
| SAVE-01 / P2 | 일지에서 잘못된 JSON을 선택한 뒤 같은 경로를 다시 선택하면 change 이벤트가 발생하지 않음. 실제 두 선택의 이벤트 수 1. | 파일을 보관한 직후 input.value를 초기화. FileReader 읽기 실패 안내도 추가. | 같은 경로 두 선택 이벤트 수 2. 파일을 수정하고 재선택하여 정상 가져오기. |
| NUM-01 / P1 | 장신구 보정값 4,294,967,296에 적용 버튼 활성. 클릭 시 `Invalid array length` 예외와 빈 화면. | 모든 수동 보정은 안전한 정수만 허용. 장신구에 회당 ±1,000의 기술적 입력 한도와 min/max, invalid 상태, 설명 및 오류 안내 추가. Reputation·채집 포인트·배낭 수량의 결과 정수도 범위 확인. | 큰 값·안전하지 않은 정수·소수·0·빈 입력에서 적용 비활성. +2 정확히 1→3, 새로고침 후 3, -2로 1 복귀. 전체 장신구 보유 한도는 추가하지 않음. |
| SAVE-02 / P1 | `reputation: "broken"` 파일이 가져오기에 성공하고 기존 기록을 손상된 캠페인으로 교체. | 명시된 Reputation이 숫자로 해석 불가능하거나 비유한 값이면 마이그레이션 전에 거절. 의미가 명확한 옛 숫자 문자열은 복사본에서 숫자로 변환. | 손상된 값은 기존 캠페인 유지. 문자열 "7"은 숫자 7로 복원, +2 보정은 9가 되고 새로고침 후에도 9. |
| SAVE-03 / P1 | 큰 A 파일 다음 작은 B 파일을 같은 이벤트 루프에서 선택. 실제 native FileReader 완료 순서 B→A에서 최신 선택 B를 이전 A가 덮어씀. | 일지와 헤더에 선택 sequence guard. 일지는 화면을 떠난 뒤의 읽기 결과·오류도 무시. | 동일한 실제 파일 읽기 완료 순서 B→A를 재현해도 저장 이름은 마지막 선택 B 유지. 헤더와 일지 모두 확인. |
| UI-01 / P3 | 일지 파일 오류 안내에서 다른 게임 제목 ‘아포테카리아’ 사용. | 앱 이름 Apawthecaria로 안내 통일. | 오류 안내 코드 및 브라우저 경로 확인. |

장신구 회당 ±1,000은 선택적 수동 기록 기능의 배열 생성으로 브라우저가 멈추는 문제를 막는 기술적 입력 한도다. 룰북 규칙이나 장신구 보유 한도로 제시하지 않았으며, 기존 1,001개에 +2 적용해 1,003개가 되는 동작도 회귀 테스트로 확인했다. 이번 저장·입력 수정은 주사위나 판정 규칙을 변경하지 않았다.

## 저장 경계 검증

수정 전 실제 파일 가져오기로 unrelated object, top-level array, 숫자 bio.name, object trinkets, null companion, object journals가 거절되고 원본 QA 저장이 남는 것을 확인했다. 이 중 마이그레이션 실패 콘솔 메시지는 앱의 의도된 오류 보고이며 런타임 pageerror는 없었다. Reputation 문자열 손상만 별도 결함으로 확인해 수정했다.

정상 브라우저 회귀는 `persistence-regression-after.json`의 10개 검증 모두 통과했고 pageerror 0건이다. 추가 저장 경계 2개(`persistence-device-boundaries.json`)와 일지·헤더 native FileReader 경쟁 2개도 통과했다. localStorage quota 대체 저장에서는 오래된 localStorage 원본이 그대로 남고 실제 IndexedDB의 최신 상태가 새로고침 후 우선 복원됐다. 오래된 탭은 기존의 다른 탭 안내와 저장 차단을 유지했다.

## 테스트 결과

명령: `npm test -- src/persistence src/manualAdjustmentInput.test.ts --reporter=dot`

11개 파일 / 142개 테스트 통과. 최초 기존 저장 테스트는 9개 파일 / 110개였으며, 이번 회귀로 32개를 추가했다. 실제 App 함수/핸들러를 TypeScript로 추출해 실행하므로 별도로 재구현한 가짜 입력 처리의 기대값을 검증하지 않는다.

- `campaignSave.test.ts`: 손상 Reputation 거절, 숫자 문자열 변환, 원본 비변경.
- `journalImportExperience.test.ts`: 같은 파일 재시도, 읽기 오류, 취소, 역순 완료, 화면 이탈, 헤더 역순 완료.
- `manualAdjustmentInput.test.ts`: 크고 위험한 수치 거절, 정상 증감, 전체 보유량 유지, Reputation·채집 포인트·수량의 결과 overflow 거절.
- 기존 deviceSave, saveQueue, cloudSlots, cloudCapacity, ownership 및 transport 테스트 전체 통과.

전역 `tsc -b`의 중간 실행은 다른 에이전트의 병행 수정 영역에 barter conditions 타입 오류와 printedToolWeights 테스트 타입 오류가 있어 실패했다. 이번 파일의 타입 오류는 보고되지 않았다. 최종 전역 검사 결과는 상위 감사 보고서가 확정한다.

## 증거

- `persistence-repro-before.json`: 실제 장신구 RangeError.
- `persistence-malformed-before.json`: 실제 손상 저장 입력 매트릭스.
- `persistence-import-race-before.json`: 수정 전 native FileReader 완료 순서·최종 저장.
- `persistence-import-race-after.json`, `persistence-header-import-race-after.json`: 수정 후 동일 경쟁 조건.
- `persistence-regression-after.json`, `persistence-device-boundaries.json`, `persistence-tests.log`.
- 같은 1440×1000 뷰포트 스크린샷: `persistence-invalid-before.png` / `persistence-invalid-after.png`, `persistence-huge-trinket-before.png` / `persistence-huge-trinket-after.png`.
- 재실행 가능한 browser 스크립트: `persistence-regression.mjs`, `persistence-import-race.mjs`, `persistence-header-import-race.mjs`, `persistence-device-boundaries.mjs`.

## 미검증·한계

실제 Google 로그인, 클라우드 슬롯 업로드·다운로드·삭제는 계정 데이터를 변경하지 않기 위해 수행하지 않았다. 기존 단위 테스트가 통과했다는 사실만 확인했으며 이 기능을 실제 브라우저 정상으로 보고하지 않는다. 실제 OS의 파일 읽기 접근 거부는 재현하지 않았고 FileReader.onerror는 실제 핸들러의 제어 테스트로 검증했다. localStorage와 IndexedDB가 동시에 거절되는 브라우저 환경은 이번 실제 세션에서 재현하지 않았다. 활성 환자의 Timer 감소→실패·후속 절차 전체 흐름은 이 저장 감사의 방문 범위 밖이며 전체 기능 감사 담당의 별도 증거가 필요하다.
