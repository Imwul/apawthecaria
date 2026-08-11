# Production Health Check

대상: <https://apawthecaria.vercel.app>

각 배포 후 깨끗한 브라우저 저장 공간에서 아래 순서를 동일하게 실행한다. 사용자 production campaign은 수정하지 않는다.

## Revision And Assets

- `main`, `origin/main`, production revision이 동일한지 확인
- production HTML과 모든 entry asset이 해당 build와 일치하는지 확인
- app boot, chunk load, offline shell 확인

## Functional Smoke

1. 새 캠페인 생성
2. Journey 시작, 이동, 저장, reload, resume
3. Patient 생성과 Treatment 진입
4. intentional Manual Resolution open/input/defer/reload/finalize
5. Journey conclusion과 canonical close
6. Almanack, Map, Patient Archive, Living Archive 열기
7. 다음 유효 campaign state에서 계속 진행

## UI And Accessibility

- desktop 주요 화면 document overflow 0
- 360px mobile 주요 화면과 modal document overflow 0
- touch target, keyboard focus, modal scroll 사용 가능
- seal, stamp, ornament가 control을 가리지 않음

## Console And Persistence

- application `console.error` 0
- uncaught exception 0
- unhandled rejection 0
- failed gameplay chunk 0
- save/reload 뒤 pending transaction 유실 0
- rapid/repeated action의 duplicate transaction 0

실제 기능 실패가 하나라도 있으면 release와 tag 작업을 중단한다. 인증 환경의 접근 제한은 기능 실패와 분리해 기록한다.
