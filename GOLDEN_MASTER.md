# Apawthecaria v1.0.0 Golden Master

이 문서는 Version `1.0.0`의 재현 가능한 보존 기준이다. `v1.0.0` annotated tag가 가리키는 commit과 production 배포가 최종 기준이며, tag는 이동하거나 다시 만들지 않는다.

## Declaration

| Item | Golden baseline |
|---|---|
| Version | `1.0.0` |
| Certified commit | `v1.0.0^{}`로 해석되는 commit |
| Tag | `v1.0.0` annotated tag |
| Production | <https://apawthecaria.vercel.app> |
| Save schema | `v8` |
| Rulebook edition | First Edition, Third Printing, May 2023 |
| Rule coverage | Exact 117 / intentional Partial 24 / blocker 0 |
| Printed Effects | 358/358 |
| Intentional manual effects | 347/347 |
| Source ambiguities | 1 (`DOWNTIME-007`) |
| Full suite | 19 files / 165 tests |
| Initial entry | 2.60 kB raw / 1.36 kB gzip |
| App async chunk | 611.56 kB raw / 165.49 kB gzip |
| Known warning | App async chunk가 Vite의 500 kB 권고선을 넘음; 비차단 |

## Regression Contract

모든 변경은 아래 항목을 유지해야 한다. 하나라도 실패하면 merge 또는 release를 중단한다.

- full tests, Rule Validator, TypeScript, ESLint, production build
- v6/v7/v8/final save migration
- canonical campaign과 Journey save/reload/resume/conclusion
- manual resolution save/reload/finalize
- transaction idempotency
- desktop/mobile document overflow 0과 blocked control 0
- production revision, asset, save/reload, Journey, console smoke

`npm test`는 Golden Save, Rule Registry, Printed Effect snapshot을 함께 검증한다. 구조를 의도적으로 바꾸는 release가 아니라면 snapshot을 갱신하지 않는다.

## Preserved Fixtures

`src/rules/fixtures/goldenSaves.ts`의 저장본은 모두 합성 데이터다.

- fresh campaign
- active Journey
- active Patient
- pending Manual Resolution
- active Barrow
- Tool / Upgrade
- Wagon / Companion
- Clinic / Service
- mid-Downtime
- post-Season
- Archive-heavy campaign

마이그레이션 fixture는 schema v6, v7, v8과 final-release v8을 포함한다. 실제 사용자 저장본이나 개인 식별 정보는 포함하지 않는다.

## Frozen Snapshots

- `rule-registry.snapshot.json`: Rule ID, 상태, source page, executor, intentional classification
- `printed-effects.snapshot.json`: 358개 canonical ID, owner, source page, executor, status, automation classification, trigger, Rule ID

스냅샷 검사는 Rule ID 삭제, 상태 승격, executor 변경, Printed Effect 중복·누락·도달 불가와 manual 자동화를 release 전에 드러낸다.

## Accessibility Baseline

- keyboard focus와 `:focus-visible`
- reduced-motion media query
- 44px급 주요 입력/행동 터치 영역
- modal 내부 스크롤과 모바일 재배치
- 장식 레이어의 `pointer-events: none`
- 주요 desktop/mobile 화면의 document overflow 0

## Performance Baseline

초기 entry는 가볍게 유지하고 App, canonical data, Firebase, 수동 판정 번들의 크기는 위 표와 비교한다. 기존 500 kB warning을 없애기 위한 위험한 의존성 교체나 gameplay refactor는 patch 범위에서 수행하지 않는다.

## Related Documents

- [Maintenance policy](MAINTENANCE_POLICY.md)
- [Source ambiguities](SOURCE_AMBIGUITIES.md)
- [Migration notes](MIGRATION_NOTES.md)
- [Production health check](PRODUCTION_HEALTH_CHECK.md)
- [Known limitations](KNOWN_LIMITATIONS.md)
- [Release certification](RELEASE_1_0_CERTIFICATION.md)

## Freeze Rule

Rule, resolver, canonical data, save semantics 또는 narrative handling을 바꾸는 변경은 이 Golden Master의 patch가 아니다. 실험은 별도 `codex/*` branch에서 수행하고 `main`, `v1.0.0` tag와 이미 배포된 release commit에는 force push하지 않는다.
