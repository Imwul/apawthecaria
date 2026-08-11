# Apawthecaria

Apawthecaria의 전체 캠페인을 브라우저에서 진행할 수 있도록 구성한 한국어 field journal입니다. Journey, Travel, Foraging, Patient, Treatment, Barter, Barrow, Downtime, Clinic, Guild Service, Season과 Archive를 canonical Rule Engine과 schema v8 저장 형식으로 연결합니다.

## Release

- Prepared package version: `1.0.0`
- Release status: active Journey resume ending is repaired in the current release candidate; `v1.0.0` tag is withheld until the remaining uninterrupted UI and post-deploy smoke gates are repeated
- Production: <https://apawthecaria.vercel.app>
- Ruleset: 새 캠페인은 `original-1e-3p`, 기존 저장은 호환 migration 적용
- Save schema: `v8`
- Offline: local-first save와 cloud outbox 지원

Version `1.0.0`의 검증 범위와 제한 사항은 다음 문서에 고정돼 있습니다.

- [Release notes](RELEASE_NOTES_1.0.0.md)
- [Release baseline](RELEASE_BASELINE_1.0.0.md)
- [Known limitations](KNOWN_LIMITATIONS.md)
- [Certification](RELEASE_1_0_CERTIFICATION.md)
- [Release checklist](RELEASE_CHECKLIST_1.0.0.md)

## Local Verification

```bash
npm ci
npm test
npm run validate:rules
npx tsc -b --pretty false
npm run lint
npm run build
npm run preview
```

`package.json`의 `version`이 프로젝트 버전의 canonical source입니다. Version `1.0.0`은 gameplay resolver, schema 또는 Rule 분류를 변경하지 않는 production freeze입니다.
