# Apawthecaria 1.0.0 Release Checklist

## Freeze

- [x] `package.json` version is `1.0.0`.
- [x] Save schema remains `v8`.
- [x] Rule coverage remains Exact 117 / intentional Partial 24 / blocker 0.
- [x] Printed Effects remain 358 total / 347 intentional manual.
- [x] New House Rules 0; new narrative automation 0.

## Final Release Gates

| # | Gate | Status | Evidence |
|---:|---|---|---|
| 1 | Baseline diff audit | PASS | `408510b..d87212a` is the verified application-notice UX fix; current freeze changes are regression/UI/documentation only. |
| 2 | Release safety | PASS | No unverified Rule, resolver, save or migration change. |
| 3 | Working tree safety | PASS | Release files explicitly staged; user-owned `tmp/` excluded. |
| 4 | Full automated tests | PASS | 19 files / 165 tests. |
| 5 | Rule Validator | PASS | 1 file / 4 tests. |
| 6 | TypeScript | PASS | `npx tsc -b --pretty false`. |
| 7 | ESLint | PASS | Errors 0; existing Babel size notice only. |
| 8 | Production build | PASS | Vite 8.0.16. |
| 9 | Migration regression | PASS | 9 files / 106 tests, including Golden v6/v7/v8/final fixtures. |
| 10 | Release Blockers | PASS | 0. |
| 11 | Rule integrity | PASS | Exact/Partial classification and 347 manual effects unchanged. |
| 12 | Clean full UI campaign | PASS | Journey, Travel, Forage, Patient, Treatment, Printed Effect, Manual, Barter, Downtime, Season, Archive, Reload, Continue. |
| 13 | Journey regression | PASS | Active save, reload, resume, partial conclusion, canonical close, subsequent downtime. |
| 14 | Manual Printed Effect UI | PASS | Open, input, defer, reload, reopen, finalize and follow-up close. |
| 15 | Idempotency | PASS | Treatment and downtime duplicate attempts did not apply twice; automated transaction suite passed. |
| 16 | Decorative overlay audit | PASS | Major overlays and ornaments do not create document overflow or block controls. |
| 17 | Desktop | PASS | 9 tabs, document overflow 0, console issues 0. |
| 18 | Mobile | PASS | 9 tabs at 375 px, document overflow 0; conditional modal reflow guards pass. |
| 19 | Production revision | PASS | Production deployment matches the certified commit. |
| 20 | Production smoke | PASS | Boot, navigation, Almanack, Map, Archive and gameplay entry controls. |
| 21 | Production save/reload | PASS | Schema v8 campaign state survives reload. |
| 22 | Production Journey conclusion | PASS | Resume and canonical ending close. |
| 23 | Production console | PASS | Application errors, uncaught exceptions, unhandled rejections and failed gameplay chunks: 0. |

## Performance

| Asset | Raw | Gzip |
|---|---:|---:|
| Initial entry | 2.60 kB | 1.36 kB |
| App async chunk | 611.56 kB | 165.49 kB |

The existing Vite 500 kB App chunk warning is documented and non-blocking.

## Release Artifacts

- Production: <https://apawthecaria.vercel.app>
- Golden Master: `GOLDEN_MASTER.md`
- Known limitations: `KNOWN_LIMITATIONS.md`
- Source ambiguities: `SOURCE_AMBIGUITIES.md`
- Migration notes: `MIGRATION_NOTES.md`
- Maintenance policy: `MAINTENANCE_POLICY.md`
- Annotated tag: `v1.0.0`

## Decision

**APAWTHECARIA v1.0.0 RELEASED**
