# Apawthecaria

Apawthecaria의 전체 캠페인을 브라우저에서 진행할 수 있도록 구성한 한국어 field journal입니다. Journey, Travel, Foraging, Patient, Treatment, Barter, Barrow, Downtime, Clinic, Guild Service, Season과 Archive를 canonical Rule Engine과 schema v9 저장 형식으로 연결합니다.

## Release

- Version: `1.0.0`
- Release status: Golden Master
- Production: <https://apawthecaria.vercel.app>
- Supported rulebook: First Edition, Third Printing (May 2023)
- Ruleset: 새 캠페인은 `original-1e-3p`, 기존 저장은 호환 migration 적용
- Save schema: `v8`
- Offline: local-first save와 cloud outbox 지원

Journey, Travel, Foraging, Patient, Treatment, Barter, Barrow, Clinic, Guild Service, Tool, Wagon, Companion, Downtime, Season과 Archive의 상태 변화는 canonical resolver가 처리합니다. 원문이 서사적 판단이나 플레이어 선택을 요구하는 Printed Effect 347개는 자동으로 결론 내리지 않고, 앱 안의 직접 판정 기록으로 완료합니다.

Version `1.0.0`의 검증 범위와 제한 사항은 다음 문서에 고정돼 있습니다.

- [Release notes](RELEASE_NOTES_1.0.0.md)
- [Release baseline](RELEASE_BASELINE_1.0.0.md)
- [Known limitations](KNOWN_LIMITATIONS.md)
- [Certification](RELEASE_1_0_CERTIFICATION.md)
- [Release checklist](RELEASE_CHECKLIST_1.0.0.md)
- [Golden Master baseline](GOLDEN_MASTER.md)
- [Maintenance policy](MAINTENANCE_POLICY.md)
- [Source ambiguities](SOURCE_AMBIGUITIES.md)
- [Migration notes](MIGRATION_NOTES.md)

저장 데이터는 브라우저에 우선 보존됩니다. 중요한 캠페인은 앱의 내보내기 기능으로 별도 보관하고, 버전이 없던 legacy save부터 schema v8까지 순차 migration하여 현재 schema v9로 복원합니다.

## Local Verification

```bash
npm ci
npm test
npm run validate:rules
npx tsc -b --pretty false
npm run lint
npm run build
npm run test:golden
npm run preview
```

`package.json`의 `version`이 프로젝트 버전의 canonical source입니다. 구조적 Rule/Printed Effect snapshot은 명시적인 다음 release가 아니라면 갱신하지 않습니다.
