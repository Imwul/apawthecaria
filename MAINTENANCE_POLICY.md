# Apawthecaria Maintenance Policy

## Version Scope

### Patch — 1.0.x

버그, 접근성, 브라우저 호환성, 안전한 성능 개선, 문서, source ambiguity 설명과 regression 수정만 허용한다. Rule 결과와 save semantics는 바꾸지 않는다.

### Minor — 1.x

선택적 편의 기능과 UI helper를 추가할 수 있다. 기존 canonical transaction의 입력·결과·비용·타이밍은 유지한다.

### Major — 2.0

Rule 해석, save model, canonical architecture 또는 engine 계약을 바꿀 때만 사용한다.

## Bug Classification

코드를 고치기 전에 아래 하나로 분류한다.

| Type | Definition | Patch boundary |
|---|---|---|
| Rule Fidelity Bug | 원문과 실행 결과가 다름 | 해당 Rule ID, resolver, test만 |
| Engine Bug | 중복 적용, 상태 유실, 잘못된 transition | 해당 transaction과 persistence만 |
| UX Bug | 올바른 action이 보이지 않거나 실행되지 않음 | UI adapter와 접근성만 |
| Cosmetic Bug | 결과에 영향 없는 시각 문제 | style과 visual regression만 |
| Source Ambiguity | 원문 자체가 충돌하거나 불명확 | 문서와 명시적 manual 처리만 |

## Dependency Policy

- 기본적으로 patch/minor update만 검토한다.
- major update는 별도 branch에서 수행한다.
- gameplay, migration, build, mobile, production smoke를 모두 재검증한다.
- build warning 하나를 없애기 위한 위험한 upgrade는 하지 않는다.
- lockfile 변경은 원인과 검증 결과를 release note에 기록한다.

## Branch And Tag Safety

- `main`은 v1.0 Golden Master를 보존한다.
- 실험은 별도 `codex/*` branch에서 진행한다.
- `main` force push, release tag 이동, `v1.0.0` tag 재작성은 금지한다.
- snapshot 변경은 의도한 release 범위와 Rule 영향이 문서화된 경우에만 허용한다.

## Required Verification

`npm test`, `npm run validate:rules`, `npx tsc -b --pretty false`, `npm run lint`, `npm run build`와 [production health check](PRODUCTION_HEALTH_CHECK.md)를 모두 통과해야 한다.
