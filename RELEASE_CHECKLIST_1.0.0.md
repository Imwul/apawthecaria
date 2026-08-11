# Apawthecaria 1.0.0 Release Checklist

## Freeze

- [x] `package.json` is the canonical version source and reads `1.0.0`.
- [x] Save schema remains `v8`.
- [x] Rule Engine, gameplay resolver, Rule classification and UI design are unchanged by release packaging.
- [x] Remaining Partial stays at 24 and Release Blockers stay at 0.

## Release Gate

| Gate | Status | Evidence |
|---|---|---|
| Full test suite | PASS | 13 files / 139 tests |
| Rule Validator | PASS | 1 file / 4 tests |
| TypeScript | PASS | `npx tsc -b --pretty false` |
| ESLint | PASS | 0 errors / 0 warnings |
| Production Build | PASS | Vite 8.0.16 production build |
| Migration regression | PASS | 5 files / 52 tests; legacy, schema v6/v7/v8 and current schema coverage |
| Clean campaign smoke | FAIL | Journey, 3-Path Travel, manual effect, Save and Reload passed; Patient creation could not run because the in-app test browser rejects native `prompt()` |
| Existing campaign compatibility | PASS | a new tab restored Aspengrace, active Journey and the resolved Bridges journal with no console error |
| Desktop | PASS | no horizontal overflow; map asset, modal, Almanack 80 rows and Archive rendered |
| Mobile | PASS | no horizontal overflow at the constrained viewport; map controls, forms, Almanack and Archive remained usable |
| Production smoke | FAIL | not run because the pre-deploy clean campaign gate failed |
| Console errors | FAIL | normal production-preview load/reload had 0; Patient attempts produced `prompt() is not supported` in the in-app test browser |
| Release Blockers | PASS | `0` in certification |

## Production Hygiene

| Check | Status |
|---|---|
| No private credential in tracked bundle source | PASS; Firebase public client configuration is not a private credential |
| No development-only control in normal production campaign | PASS; sandbox controls require the sandbox ruleset and are absent from original gameplay |
| No debug logging in normal production flow | PASS; no `console.log`, `console.debug` or `console.info` call in production source |
| No local source path in UI | PASS |
| No broken production asset | PASS; 5 entry references present and observed map asset loaded at natural width 1754 |
| Dependency audit recorded | PASS; 1 moderate production advisory and 3 high development-tool advisories retained without a freeze-time upgrade |

## Release Artifacts

- Release notes: `RELEASE_NOTES_1.0.0.md`
- Known limitations: `KNOWN_LIMITATIONS.md`
- Certification: `RELEASE_1_0_CERTIFICATION.md`
- Baseline: `RELEASE_BASELINE_1.0.0.md`
- Production URL: <https://apawthecaria.vercel.app>
- Release commit and annotated tag: not created because the release gate failed

## Performance

| Asset | Raw | Gzip |
|---|---:|---:|
| Initial entry | 2.57 kB | 1.34 kB |
| App async chunk | 554.13 kB | 148.51 kB |

The existing Vite 500 kB warning remains one App async chunk and did not regress from the certified baseline.

## Packaging Decision

**RELEASE ABORTED**

The clean campaign and console-zero gates are not PASS in the available production-preview browser because native `prompt()` is unsupported there. Automated canonical campaign tests and the previous gameplay certification remain PASS, but they do not replace the required actual-UI clean campaign gate. No release commit, tag, push or production deployment was created.
