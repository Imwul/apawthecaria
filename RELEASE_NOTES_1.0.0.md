# Apawthecaria 1.0.0

Version `1.0.0`은 인증된 canonical gameplay를 고정하는 production release package다. 이번 release packaging에서는 Rule Engine, Rule 분류, save semantics, narrative 처리 또는 UI 디자인을 변경하지 않았다.

> Packaging status: release candidate는 production에 배포됐지만, clean campaign의 active Journey save/reload gate가 남아 있어 `v1.0.0` tag는 보류한다.

## Core Campaign

- Journey와 graph 기반 Travel
- 계절·지역·도구를 사용하는 Foraging과 Encounter
- 복수 Ailment·Timer를 가진 Patient와 transaction 기반 Treatment
- Barter, 8종 Barrow, Downtime과 Season boundary
- Clinic Agenda와 Guild Service lifecycle
- 18 Tools, 7 Upgrades, Wagon과 Companion
- Journal, Almanack, Patient Archive
- local-first Save, Reload와 cloud sync queue

## Rulebook Fidelity

- Printed Effect `358/358` 표현
- 서술형 Printed Effect `347/347`은 명시적인 in-app manual resolution으로 유지
- Release Blocker `0`
- certification 중 새 narrative automation `0`
- certification 중 새 House Rule `0`
- 외부 룰북 없이 canonical campaign replay 완료

## Persistence

- 현재 save schema `v8`
- legacy save와 schema v6/v7/v8 migration 유지
- pending manual resolution과 follow-up 복원
- active Patient, Barrow, Journey, Tool identity, Wagon, Companion, Clinic과 Archive 보존
- transaction ID와 revision 기반 중복 적용 방지

## Verification

- Full suite: `13 files / 139 tests`
- Rule Validator: PASS
- TypeScript: PASS
- ESLint: `0 errors / 0 warnings`
- Production build: PASS
- Migration regression: PASS
- Desktop/Mobile: PASS
- Canonical campaign replay: PASS

## Known Limitations

24개의 비차단 `Partial`을 유지한다. 분류는 digital/evidence limitation 12개, intentional narrative/player choice 11개, source ambiguity 1개다. 상세 목록은 [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)에 있다.
