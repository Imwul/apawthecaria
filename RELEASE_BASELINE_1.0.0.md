# Apawthecaria 1.0.0 Release Baseline

이 문서는 Version `1.0.0`의 regression 비교 기준이다. Rule Engine과 gameplay behavior는 이 baseline에서 동결한다.

## Certification Baseline

| Metric | Version 1.0.0 |
|---|---:|
| Save schema | v8 |
| Full tests | 19 files / 165 tests |
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
| App async chunk | 611.56 kB | 165.49 kB |

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

23개 Release Gate와 post-deploy smoke를 통과한 `v1.0.0` annotated tag가 이 baseline을 고정한다. Rule Registry와 Printed Effect 구조 snapshot, 합성 Golden Save, v6/v7/v8 migration fixture가 이후 regression 비교 기준이다.
