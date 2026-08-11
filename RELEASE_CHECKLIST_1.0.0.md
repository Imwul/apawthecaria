# Apawthecaria 1.0.0 Release Checklist

## Freeze

- [x] `package.json` is the canonical version source and reads `1.0.0`.
- [x] Save schema remains `v8`.
- [x] Rule Engine, gameplay resolver, Rule classification and UI design are unchanged by release packaging.
- [x] Remaining Partial stays at 24 and Release Blockers stay at 0.

## Release Gate

| Gate | Status | Evidence |
|---|---|---|
| Full test suite | PASS | 16 files / 154 tests |
| Rule Validator | PASS | 1 file / 4 tests |
| TypeScript | PASS | `npx tsc -b --pretty false` |
| ESLint | PASS | 0 errors / 0 warnings |
| Production Build | PASS | Vite 8.0.16 production build |
| Migration regression | PASS | 8 files / 99 tests; legacy and current schema coverage |
| Clean campaign smoke | FAIL | Patient controlled input, Travel, Forage, Treatment, Manual Effect, Barter, Save and Reload passed. After reload, the active Journey cannot open its ending transaction, so Barrow, Downtime, Season and final Archive were not completed in one clean UI campaign. |
| Existing campaign compatibility | FAIL | schema v8 data reloads, but an active Journey resumed from storage cannot be ended through the UI in the observed clean campaign. |
| Desktop | PASS | all 9 tabs have balanced content gutters, no document-level horizontal overflow and no console error |
| Mobile | NOT RE-RUN | the responsive gutter is bounded to `1rem`; the full mobile campaign was not repeated after the final CSS-only change |
| Production smoke | PARTIAL | production URL, deployed gutter and console-zero load passed; the full production Patient/Treatment/save loop was not repeated |
| Console errors | PASS | local clean flow and production load both reported 0 errors and 0 warnings |
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
- Release-candidate commit: `7d38f28`
- Annotated tag: not created because the release gate remains open

## Performance

| Asset | Raw | Gzip |
|---|---:|---:|
| Initial entry | 2.60 kB | 1.36 kB |
| App async chunk | 609.33 kB | 165.03 kB |

The existing Vite 500 kB warning remains one App async chunk and did not regress from the certified baseline.

## Packaging Decision

**RELEASE ABORTED**

The gameplay-critical Patient `prompt()` dependency is removed and the console-zero gate now passes. The actual UI campaign still cannot finish an active Journey after save/reload, so the `v1.0.0` tag remains withheld. At the user's explicit request, release-candidate commit `7d38f28` was pushed to `main` and deployed to production for further validation; this deployment is not a completed Version 1.0 certification.
