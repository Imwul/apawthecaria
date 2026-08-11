# Apawthecaria 1.0.0 Release Baseline

이 문서는 Version `1.0.0`의 regression 비교 기준이다. Rule Engine과 gameplay behavior는 이 baseline에서 동결한다.

## Certification Baseline

| Metric | Version 1.0.0 |
|---|---:|
| Save schema | v8 |
| Full tests | 16 files / 154 tests |
| Printed Effects | 358/358 |
| Intentional manual Printed Effects | 347/347 |
| Release Blockers | 0 |
| Remaining Partial | 24 |
| Digital/evidence limitations | 12 |
| Intentional narrative/player choice | 11 |
| Source ambiguity | 1 (`DOWNTIME-007`) |
| External rulebook openings | 0 |

## Build Baseline

| Asset | Raw | Gzip |
|---|---:|---:|
| Initial entry | 2.60 kB | 1.36 kB |
| App async chunk | 609.34 kB | 165.03 kB |

Vite의 500 kB warning은 App async chunk 1건이다. Version `1.0.0`의 Release Blocker가 아니며, packaging 과정에서 chunk refactor를 수행하지 않는다.

## Compatibility Baseline

- Legacy saves and schema v6/v7/v8 migrate to schema v8.
- Pending manual resolution, active Barrow, active Patient and Journey state survive reload.
- Stable Tool identity, Wagon, Companion, Clinic and Archive state are preserved.
- New campaigns use `original-1e-3p`; migrated campaigns retain `legacy-campaign` compatibility where required.

## Canonical Sources

- Project version: `package.json#version`
- Save schema: `src/rules/state.ts#CURRENT_SCHEMA_VERSION`
- Rule status: `RULE_TRACEABILITY.md`
- Printed effects: `src/rules/printedEffects.ts` and `PRINTED_EFFECT_STATUS.md`
- Known limitations: `KNOWN_LIMITATIONS.md`

## Packaging Status

Gameplay certification baseline은 PASS다. Patient native `prompt()`와 active Journey save/reload 후 ending UI blocker는 모두 제거됐다. Packaging certification은 uninterrupted clean UI campaign, mobile rerun, post-deploy functional smoke를 다시 완료할 때까지 열어 두며 `v1.0.0` tag는 보류한다. 자세한 gate 결과는 `RELEASE_CHECKLIST_1.0.0.md`에 있다.
