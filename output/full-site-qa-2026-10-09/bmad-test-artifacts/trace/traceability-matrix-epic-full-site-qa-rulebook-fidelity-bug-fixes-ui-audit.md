---
runScope: epic
runKey: epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit
targetType: epic
targetId: full-site-qa-rulebook-fidelity-bug-fixes-ui-audit
targetLabel: 'Full-Site QA: Rulebook Fidelity, Bug Fixes & UI Audit'
workflowStatus: completed
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-map-criteria', 'step-04-analyze-gaps', 'step-05-gate-decision']
lastStep: step-05-gate-decision
lastSaved: 2026-10-10
coverageBasis: acceptance_criteria
oracleConfidence: high
oracleResolutionMode: formal_requirements
oracleSources: ['output/full-site-qa-2026-10-09/bmad-audit-requirements.md']
externalPointerStatus: not_used
collectionMode: contract_static
collectionStatus: COLLECTED
allowGate: true
tempCoverageMatrixPath: /tmp/tea-trace-coverage-matrix-epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit-2026-10-10T13-54-32-269423+00-00.json
---

# Traceability Matrix & Gate Decision — Full-Site QA

Target: epic `full-site-qa-rulebook-fidelity-bug-fixes-ui-audit`. Final Phase1/Phase2 snapshot: 2026-10-10T13:54:32.269423+00:00. The user's explicit eight acceptance criteria are the formal oracle. Confidence is high in the requested scope; this does not imply exhaustive verification.

## Coverage Summary

| Priority | Total broad criteria | FULL | FULL % |
|---|---:|---:|---:|
| P0 | 4 | 0 | 0% |
| P1 | 4 | 2 | 50% |
| P2 | 0 | 0 | 100% (no criteria) |
| P3 | 0 | 0 | 100% (no criteria) |
| Total | 8 | 2 | 25% |

QA-07 confirmed fixes and QA-08 complete honest report are FULL. Other six criteria have PARTIAL evidence. These percentages count only completely established broad user criteria. They are not test pass rates, source code coverage, or percentages of site controls exercised. No all/every criterion was weakened into a sampled claim.

## Detailed Requirement Mapping

### QA-01 — P0 — PARTIAL

Core adjudication, dice/cards, numeric values, conditions, exceptions and sequencing agree with the supplied source rulebook; source conflicts are retained as uncertain.

Printed p.62 weights, Chatty p.14 and Wingbreak p.115 regressions directly establish corrected calculations. Rule worker compared named core procedures and 45 ailments. All printed effects, nested exceptions, reagent icon semantics and service/clinic/barrow/companion lifecycle branches were not independently executed or fully compared.

Accepted mappings (a parameterized declaration or whole smoke script counts once):

- `src/rules/printedToolWeights.test.ts:17` (unit): %s keeps every printed whole Weight unit.
- `src/rules/printedToolWeights.test.ts:31` (unit): repairs old weight-1 saves without changing identities, quantities or unrelated custom weights.
- `src/rules/printedToolWeights.test.ts:49` (unit): preserves a recorded Bad Idea weight reduction while repairing the erroneous printed base.
- `src/rules/printedToolWeights.test.ts:64` (unit): keeps an explicit untracked custom weight instead of guessing its reason.
- `src/rules/chattyBarterFidelity.test.ts:22` (unit): reduces the printed barter Rarity by 2 while preserving every other modifier.
- `src/rules/chattyBarterFidelity.test.ts:31` (unit): uses the adjusted Rarity during the actual second-card decision after save/restore.
- `src/rules/chattyBarterFidelity.test.ts:49` (unit): also applies the benefit to a BR 12 stand-in Reagent.
- `src/rules/chattyBarterFidelity.test.ts:68` (unit): adds 2 during the named Season and combines with Chatty, without stacking duplicate records.
- `src/rules/chattyBarterFidelity.test.ts:78` (unit): applies the same current-Season penalty to a stand-in Reagent transaction.
- `src/barrowPatientBoundary.test.ts:24` (unit): blocks an ordinary intake while a Delve is active.
- `src/barrowPatientBoundary.test.ts:31` (unit): blocks an ordinary intake at a live Barrow before its challenge.
- `src/barrowPatientBoundary.test.ts:37` (unit): preserves ordinary intake outside a live local Barrow: %j.

### QA-02 — P0 — PARTIAL

Oracle/random tables have the source text, result range and reference relationships; separate books and convenience modes do not silently mix rules.

Original PDF SHA and all 220 normalized source pages match. Canonical name/reference structure and 3,380 lookup existence checks passed; reference registry relationships are tested. Lookup existence and derived registry consistency do not establish the original semantic text and every result branch. Source conflicts remain explicit.

Accepted mappings (a parameterized declaration or whole smoke script counts once):

- `src/rulebook/referenceRegistry.test.ts:16` (unit): keeps every canonical catalogue at its certified count.
- `src/rulebook/referenceRegistry.test.ts:37` (unit): has no reference/runtime drift.
- `src/rulebook/referenceRegistry.test.ts:46` (unit): uses the exact Guild Reputation term on every canonical reference surface.
- `src/rulebook/referenceRegistry.test.ts:64` (unit): supports entity, rule ID and printed page searches.
- `src/rulebook/referenceRegistry.test.ts:73` (unit): links field-reference relationships in both directions.
- `src/rulebook/referenceRegistry.test.ts:92` (unit): renders canonical numbers and manual semantics directly from runtime data.
- `src/rulebook/referenceRegistry.test.ts:131` (unit): ships all 220 source pages outside the JavaScript bundle.

### QA-03 — P1 — PARTIAL

Every major page/tab/menu/modal and user control is exercised in a real development-server browser.

Nine main tabs actually visited at 1440/768/360; normal character/journey/patient/foraging/treatment, searches, inventory, Journal and backup controls have browser evidence. Independent Journal archive E2E is re-runnable. Every nested choice, modal and account/cloud control has not been exercised. Later actual Clinic cancel/build/volunteer/season-completion, Wagon/Companion, tool import, Barrow preview/reload/flee and Building Trust special Intermediate patient generation were checked. Every Delve outcome/full Building Trust cure remains unexecuted. Further actual browser checks covered Journal photo upload/save/reload/enlarge/close, photo/journal deletion cancel/confirm/reload, and map creation/cancel/edit/drag/edge cancellation and mutation/delete/reload. The final smoke script was independently rerun by QA with exit0. Every remaining nested effect/account control still lacks coverage.

Accepted mappings (a parameterized declaration or whole smoke script counts once):

- `output/full-site-qa-2026-10-09/bmad-test-artifacts/test-review/verify-legacy-journal.cjs:16` (e2e): canonical and legacy Journal count, preserved note, bookmark, no runtime errors.
- `src/patientMemoryConsistency.test.ts:28` (unit): shows the real canonical treatment rather than an empty legacy-only shelf.
- `src/patientMemoryConsistency.test.ts:36` (unit): keeps unresolved intake records out of completed memories.
- `src/patientMemoryConsistency.test.ts:42` (unit): preserves legacy notes and bookmarks while ordering both sources by their recorded times.
- `src/patientMemoryConsistency.test.ts:50` (unit): projects a failed case without changing saved records or inventing a resolution day.
- `output/full-site-qa-2026-10-09/browser-smoke.cjs:8` (e2e): 27 viewport/page screens, canonical LivingArchive/Play/Journal memories, reload and map controls without runtime/console errors.

### QA-04 — P0 — PARTIAL

Complete normal journeys, cancellation/back navigation, repeated use and boundary/error inputs produce correct visible state without runtime exceptions.

Actual numeric error, malformed save, retry, concurrent import, stale tab and localStorage quota paths have browser evidence; controlled handlers cover cancellation/read error/unmount. Source guards are not a rendered whole-site workflow proof. Every gameplay error/expiry/back/repeated nested choice is not established. Extra photo/map cancel, deletion, repeated line-state changes and reload paths passed, errors0. Odoak/current-marker hit areas overlap at baseline zoom with nearby supplied coordinates; a separate actual browser reproduced it, then one zoom-in step allowed normal Odoak click (search also works), errors0. Every dense-marker/zoom combination remains untested; coordinates were not arbitrarily moved.

Accepted mappings (a parameterized declaration or whole smoke script counts once):

- `src/manualAdjustmentInput.test.ts:46` (unit): rejects nonzero-unsafe-integer delta %s.
- `src/manualAdjustmentInput.test.ts:50` (unit): rejects Trinket allocation delta %s before updating the campaign.
- `src/manualAdjustmentInput.test.ts:58` (unit): adds the exact accepted delta and records it once, without an overall balance cap.
- `src/manualAdjustmentInput.test.ts:66` (unit): retains normal removal semantics at zero.
- `src/manualAdjustmentInput.test.ts:72` (unit): rejects overflow after a valid delta in %s without saving a rounded result.
- `src/persistence/journalImportExperience.test.ts:40` (unit): clears the selected file before reading so a failed same-file selection can retry.
- `src/persistence/journalImportExperience.test.ts:53` (unit): reports a file read error and preserves the current campaign.
- `src/persistence/journalImportExperience.test.ts:62` (unit): does nothing after a cancelled file chooser.
- `src/persistence/journalImportExperience.test.ts:69` (unit): ignores a superseded read when the earlier large file completes after the latest selection.
- `src/persistence/journalImportExperience.test.ts:81` (unit): does not import or display an error after leaving the Journal view.
- `src/persistence/journalImportExperience.test.ts:93` (unit): keeps the latest selection when native file reads finish in reverse order.
- `output/full-site-qa-2026-10-09/bmad-test-artifacts/test-review/verify-legacy-journal.cjs:16` (e2e): canonical and legacy Journal count, preserved note, bookmark, no runtime errors.
- `src/barrowPatientBoundary.test.ts:24` (unit): blocks an ordinary intake while a Delve is active.
- `src/barrowPatientBoundary.test.ts:31` (unit): blocks an ordinary intake at a live Barrow before its challenge.
- `src/barrowPatientBoundary.test.ts:37` (unit): preserves ordinary intake outside a live local Barrow: %j.
- `src/patientMemoryConsistency.test.ts:28` (unit): shows the real canonical treatment rather than an empty legacy-only shelf.
- `src/patientMemoryConsistency.test.ts:36` (unit): keeps unresolved intake records out of completed memories.
- `src/patientMemoryConsistency.test.ts:42` (unit): preserves legacy notes and bookmarks while ordering both sources by their recorded times.
- `src/patientMemoryConsistency.test.ts:50` (unit): projects a failed case without changing saved records or inventing a resolution day.
- `output/full-site-qa-2026-10-09/browser-smoke.cjs:8` (e2e): 27 viewport/page screens, canonical LivingArchive/Play/Journal memories, reload and map controls without runtime/console errors.

### QA-05 — P0 — PARTIAL

Local save, restore, refresh and cross-view state preserve player data. Live cloud/account behavior is only claimed if actually observed.

Actual import/reload restored stale tool weights1 to3/2/2; total8,Carry5,Speed1. Treatment cancellation/draft/reward checkpoint reload/inventory consumption passed. Both JSON exports, malformed/same-file/reverse-order import, real StorageEvent stale-tab and actual IndexedDB fallback passed. Canonical/legacy archives preserve data. Live Google/cloud-slot/multi-device behavior remains unverified; these samples do not establish every possible save-state boundary. JOUR-01 projection creates a fresh combined sorted display array without writing either archive; four new tests establish canonical treated/failed visibility, active exclusion, legacy reference/note/bookmark preservation and no state mutation.

Accepted mappings (a parameterized declaration or whole smoke script counts once):

- `src/rules/printedToolWeights.test.ts:17` (unit): %s keeps every printed whole Weight unit.
- `src/rules/printedToolWeights.test.ts:31` (unit): repairs old weight-1 saves without changing identities, quantities or unrelated custom weights.
- `src/rules/printedToolWeights.test.ts:49` (unit): preserves a recorded Bad Idea weight reduction while repairing the erroneous printed base.
- `src/rules/printedToolWeights.test.ts:64` (unit): keeps an explicit untracked custom weight instead of guessing its reason.
- `src/persistence/journalImportExperience.test.ts:40` (unit): clears the selected file before reading so a failed same-file selection can retry.
- `src/persistence/journalImportExperience.test.ts:53` (unit): reports a file read error and preserves the current campaign.
- `src/persistence/journalImportExperience.test.ts:62` (unit): does nothing after a cancelled file chooser.
- `src/persistence/journalImportExperience.test.ts:69` (unit): ignores a superseded read when the earlier large file completes after the latest selection.
- `src/persistence/journalImportExperience.test.ts:81` (unit): does not import or display an error after leaving the Journal view.
- `src/persistence/journalImportExperience.test.ts:93` (unit): keeps the latest selection when native file reads finish in reverse order.
- `output/full-site-qa-2026-10-09/bmad-test-artifacts/test-review/verify-legacy-journal.cjs:16` (e2e): canonical and legacy Journal count, preserved note, bookmark, no runtime errors.
- `src/patientMemoryConsistency.test.ts:28` (unit): shows the real canonical treatment rather than an empty legacy-only shelf.
- `src/patientMemoryConsistency.test.ts:36` (unit): keeps unresolved intake records out of completed memories.
- `src/patientMemoryConsistency.test.ts:42` (unit): preserves legacy notes and bookmarks while ordering both sources by their recorded times.
- `src/patientMemoryConsistency.test.ts:50` (unit): projects a failed case without changing saved records or inventing a resolution day.
- `output/full-site-qa-2026-10-09/browser-smoke.cjs:8` (e2e): 27 viewport/page screens, canonical LivingArchive/Play/Journal memories, reload and map controls without runtime/console errors.

### QA-06 — P1 — PARTIAL

Desktop/tablet/mobile layouts preserve existing design and have no obvious clipping, overlap, overflow, unreachable controls or misleading labels/states.

Final smoke visited9tabs×360/768/1440=27screens, document scrollWidth matched viewport and pageErrors/consoleErrors arrays were empty. Map search overlap was fixed/rechecked at all3widths, desktop/mobile casebook and source drawer return were checked. Nested dialogs, all UI states and native mobile/keyboard behavior are not exhaustive. QA independently reran the final script:27screens and canonical memory/map controls/reload PASS with runtime/console errors0. Nearby Odoak/current markers overlap at baseline zoom; one zoom-in step and search each permit selection. All dense-marker/zoom cases remain untested.

Accepted mappings (a parameterized declaration or whole smoke script counts once):

- `output/full-site-qa-2026-10-09/browser-smoke.cjs:8` (e2e): 27 viewport/page screens, canonical LivingArchive/Play/Journal memories, reload and map controls without runtime/console errors.

### QA-07 — P1 — FULL

Confirmed defects are prioritized, fixed with minimal scope, then verified through browser regression and appropriate automated tests.

All currently confirmed rule, numeric/import, casebook, map-search, shop-weight and Barrow-intake defects have minimal source-backed fixes, actual browser regression and appropriate automated regression. JOUR-01 also repaired canonical completed memories in LivingArchive and Play recent-patient lists through a read-only projection; active records remain excluded and legacy notes/bookmarks stay intact. Final post-projection whole suite:146files/1509tests pass. This establishes the confirmed-fix criterion; it does not certify every unexecuted original branch. Final report records all12confirmed fixes and separately retains the Odoak baseline-overlap/zoom-selection observation; additional browser photo/map checks passed and no new confirmed defect was inferred.

Accepted mappings (a parameterized declaration or whole smoke script counts once):

- `src/rules/printedToolWeights.test.ts:17` (unit): %s keeps every printed whole Weight unit.
- `src/rules/printedToolWeights.test.ts:31` (unit): repairs old weight-1 saves without changing identities, quantities or unrelated custom weights.
- `src/rules/printedToolWeights.test.ts:49` (unit): preserves a recorded Bad Idea weight reduction while repairing the erroneous printed base.
- `src/rules/printedToolWeights.test.ts:64` (unit): keeps an explicit untracked custom weight instead of guessing its reason.
- `src/manualAdjustmentInput.test.ts:46` (unit): rejects nonzero-unsafe-integer delta %s.
- `src/manualAdjustmentInput.test.ts:50` (unit): rejects Trinket allocation delta %s before updating the campaign.
- `src/manualAdjustmentInput.test.ts:58` (unit): adds the exact accepted delta and records it once, without an overall balance cap.
- `src/manualAdjustmentInput.test.ts:66` (unit): retains normal removal semantics at zero.
- `src/manualAdjustmentInput.test.ts:72` (unit): rejects overflow after a valid delta in %s without saving a rounded result.
- `src/rules/chattyBarterFidelity.test.ts:22` (unit): reduces the printed barter Rarity by 2 while preserving every other modifier.
- `src/rules/chattyBarterFidelity.test.ts:31` (unit): uses the adjusted Rarity during the actual second-card decision after save/restore.
- `src/rules/chattyBarterFidelity.test.ts:49` (unit): also applies the benefit to a BR 12 stand-in Reagent.
- `src/rules/chattyBarterFidelity.test.ts:68` (unit): adds 2 during the named Season and combines with Chatty, without stacking duplicate records.
- `src/rules/chattyBarterFidelity.test.ts:78` (unit): applies the same current-Season penalty to a stand-in Reagent transaction.
- `src/persistence/journalImportExperience.test.ts:40` (unit): clears the selected file before reading so a failed same-file selection can retry.
- `src/persistence/journalImportExperience.test.ts:53` (unit): reports a file read error and preserves the current campaign.
- `src/persistence/journalImportExperience.test.ts:62` (unit): does nothing after a cancelled file chooser.
- `src/persistence/journalImportExperience.test.ts:69` (unit): ignores a superseded read when the earlier large file completes after the latest selection.
- `src/persistence/journalImportExperience.test.ts:81` (unit): does not import or display an error after leaving the Journal view.
- `src/persistence/journalImportExperience.test.ts:93` (unit): keeps the latest selection when native file reads finish in reverse order.
- `output/full-site-qa-2026-10-09/bmad-test-artifacts/test-review/verify-legacy-journal.cjs:16` (e2e): canonical and legacy Journal count, preserved note, bookmark, no runtime errors.
- `src/barrowPatientBoundary.test.ts:24` (unit): blocks an ordinary intake while a Delve is active.
- `src/barrowPatientBoundary.test.ts:31` (unit): blocks an ordinary intake at a live Barrow before its challenge.
- `src/barrowPatientBoundary.test.ts:37` (unit): preserves ordinary intake outside a live local Barrow: %j.
- `src/patientMemoryConsistency.test.ts:28` (unit): shows the real canonical treatment rather than an empty legacy-only shelf.
- `src/patientMemoryConsistency.test.ts:36` (unit): keeps unresolved intake records out of completed memories.
- `src/patientMemoryConsistency.test.ts:42` (unit): preserves legacy notes and bookmarks while ordering both sources by their recorded times.
- `src/patientMemoryConsistency.test.ts:50` (unit): projects a failed case without changing saved records or inventing a resolution day.
- `output/full-site-qa-2026-10-09/browser-smoke.cjs:8` (e2e): 27 viewport/page screens, canonical LivingArchive/Play/Journal memories, reload and map controls without runtime/console errors.

### QA-08 — P1 — FULL

The report identifies actual visits, rule evidence, defects/fixes, executed test results, unresolved issues and unverified areas without claiming unobserved success.

Final full-site-qa-report.md was read in full. It lists actual visited surfaces, seeded versus natural paths, original page evidence,12confirmed defects and fixes, before/after comparisons, final146files/1509pass, build/lint, official BMAD outcome and explicit unverified/source-conflicting areas. All37distinct file links exist. Extra photo/map checks and the explicit Odoak baseline-overlap/zoom-selection limitation are reported honestly; no unexecuted nested/account branch is called normal. This document-delivery criterion is FULL by direct artifact review, not invented automated/live cases.

Evidence is the final report itself, read in full, plus actual validation of its38distinct linked files and12defect rows. This reporting criterion has no invented unit/live case in the inventory.

## Evidence Quality and Inventory

The accepted inventory contains **36 distinct declarations/scripts in 9 files**: 34 unit declarations and 2 E2E scripts. It excludes unreviewed historical cases and deduplicates a test mapped to several criteria. Expanded Vitest counts are separate: final 146 files / 1,509 tests passed; the original focused review had 4 files / 33 passes, the independent rule subset 12 files / 131 passes, and memory plus Barrow 2 files / 9 passes.

The official focused Test Review inspected four regression files and eight measured convention samples: 100/100 A, Approve test construction only. New Barrow and memory tests were read independently and recorded separately, without extending that score.

The independent legacy Journal regression asserts count 2, canonical visibility, preserved legacy note/bookmark and zero page errors, then closes its isolated context. QA also reran `browser-smoke.cjs` in a new Chromium process: exit 0, 27 page/viewport screens, canonical LivingArchive/Play/Journal memories, reload and map controls passed, with zero page/console errors. The script uses locator conditions and explicit assertions without fixed sleeps, and closes its browser. The whole script counts once, not as 27 manufactured cases.

Native FileReader, IndexedDB, StorageEvent and extra photo/map reproduction artifacts support the observed paths. Some reproduction scripts use fixed waits or record results without assertions, so they are not included as reviewed deterministic static cases. Unit and browser overlap reaches calculations/handlers versus rendered integration and provides useful defense in depth. No unacceptable duplicate validation was found.

Considered and rejected: `src/rulebook/referenceRegistry.test.ts:143` names keyboard/mobile accessibility but checks source strings. Those assertions establish safeguards, not actual focus trapping or mobile rendering; the case is excluded from QA-06 evidence totals. No focused test-quality blocker was identified.

## Actual Source and Browser Evidence

The rule worker freshly compared 220 normalized original PDF pages (all match), 599 name/reference rows (596 match, 3 explicit source exceptions), and 3,380 lookup results (all exist). Named core procedures, 45 ailments and selected original p.14/p.62/p.65/p.128 visuals were compared. Derived catalogue consistency and lookup existence cannot establish every semantic rule, nested effect or result.

Nine main pages were actually visited at widths 360, 768 and 1440. Character creation through journey, patient, foraging, remedy, reward and departure was exercised through UI. Prepared fixtures enabled city, Clinic, Barrow, tool and backup boundaries; the final report distinguishes these methods. Local invalid-file, retry, reverse-order import, refresh, quota fallback to real IndexedDB, stale-tab StorageEvent, canonical/legacy archives and tool restoration were checked. Clinic construction/activity/season completion and Building Trust special Intermediate patient generation passed. Building Trust full cure and every Delve outcome were not executed.

Extra photo attachment, save, reload, enlarge/close, and photo/journal deletion cancel/confirm/reload passed. Map creation/cancel, name/terrain edit, drag, edge cancellation/create/style changes/disconnection and marker deletion/reload passed with empty runtime/console error arrays. This does not establish every image format/size, map-history restore or account permission path.

Nearby Odoak/current-location markers have overlapping hit areas at baseline zoom in the supplied coordinates, with a y gap about 3.18%. A separate browser reproduced this; one zoom-in step enabled normal Odoak click, and search also selected it, with zero page errors. `map-dense-marker-check.json` records the result. Every density/zoom combination remains untested. No arbitrary coordinate rearrangement was made.

The final `full-site-qa-report.md` was read in full and all 38 linked files exist. It reports 12 confirmed defects and repairs, actual visits, source grounds, before/after conditions, final tests/build/lint, official BMAD results and explicit unverified/uncertain areas. QA-08 is FULL by direct document review, without an invented automated or live case.

## Gaps and Recommendations

Four CRITICAL scope gaps are the four P0 criteria below FULL: QA-01 every rule/exception lifecycle; QA-02 every table semantic result; QA-04 every normal/error/repeated gameplay branch; QA-05 every remaining save/account boundary. This is a certification-gap category, not four known unfixed P0 product bugs. P1 NONE gaps: 0; P1 PARTIAL gaps: 2 (QA-03/QA-06). No P2/P3 criteria were requested.

- **URGENT**: Complete source-to-effect semantic review and real browser lifecycle branches before certifying all rules. Suggested QA-01-E2E-remaining: Given each unexecuted service/clinic/barrow/companion/encounter branch and source page, When it resolves and restores, Then numbers/order/state match the printed rule; retain unresolved source conflicts.
- **HIGH**: Finish remaining gameplay checkpoint/expiry/back/repeat and nested modal journeys with actual browser assertions and the same viewport conditions. Suggested QA-03-E2E-remaining and QA-06-E2E-dialogs: exercise each remaining inventory item, not only rendering its catalogue row.
- **HIGH**: If live account/cloud behavior is required for complete-site certification, verify login, slot operations, signed-out/permission/error outcomes and cross-device restore in an authorized test account. Keep unit tests and real account observations separate.
- **LOW**: Focused official Test Review already completed (4 regression files, 100/100 A); broaden only where evidence or changed code warrants it.
- **MEDIUM**: Expand dense-marker/zoom/lock-state selection checks if this UI is revised. The observed Odoak baseline overlap is reproduced; one zoom step/search selects normally. Preserve data coordinates and the documented limitation instead of asserting every density combination works.

Unverified areas include all printed/manual/nested encounters and service/Clinic/Companion/Barrow lifecycles; all reagent icon semantics and dose/concurrent ailment combinations; live Google/cloud-slot/multi-device/admin publishing; native mobile keyboard/pinch/Safari/Firefox; simultaneous localStorage/IndexedDB denial; and OS file-read permission errors. The current registry's 358 effects and 312 nonimplemented entries do not mean those effects were executed.

Original source uncertainty remains explicit: Wagon 20 (p.43) versus 15 (p.68), Nervefright/Seasonshift severity conflict, Summer Loch 10/J duplicate/omission, Smokesnout/Smoker's Snout, missing Woeful Waters follow-up and repeated doses. No rule was invented to close these gaps.

## Live Manifest and Snapshot Integrity

The configured formal `live-verification-results.json` is absent. Trace did not create it or fabricate fresh records from screenshots/reports: present=false, freshness=not_present, counted=0 and live-only requirements=0. The two re-runnable browser scripts are E2E, not formal live records.

The workspace has unstaged and preexisting changes. HEAD identifies the repository revision, not a hash of the tested dirty tree. Actual timestamps, diff and artifacts preserve scope; no clean-commit freshness is asserted. Phase 1 was saved to the exact frontmatter path, then Phase 2 read that same JSON and its PHASE_1_COMPLETE status. A durable copy and its SHA-256 digest remain available.

## Phase 2 — Gate Decision: FAIL

Collection mode is contract_static, status COLLECTED and allow_gate=true. Deterministic Rule 1 returns FAIL because P0 FULL coverage is 0/4, below the required 100%. P1 FULL coverage is 2/4 = 50% (minimum 80%, PASS target 90%); overall FULL is 2/8 = 25% (minimum 80%). Completing QA-07/QA-08 does not establish the remaining all/every criteria. No waiver register exists and no waiver was inferred.

This withholds exhaustive site/rule certification and release approval. It is not a failing executed-test count or an external deployment action. Final 146 files / 1,509 tests passed; build succeeded with the existing 500 KB chunk warning; lint contains Babel size notes. The App chunk is about 2.60 MB, gzip about 666 KB, without a measured performance SLA. Security/performance/load NFR audits and burn-in are not assessed/available, rather than falsely reported as zero failures.

Machine outputs for this same run are `coverage-matrix-epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit.json`, `e2e-trace-summary-epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit.json` (schema 0.3.0) and `gate-decision-epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit.json` (schema 0.1.0). Validation checked accepted files/lines/titles, unique counts, FULL-only arithmetic, all eight criteria, missing live/waiver handling and report links. The completion hook resolved empty.

Gate summary: **FAIL**, P0 0/4 FULL, P1 2/4 FULL, overall 2/8 FULL; four critical scope gaps. Actual 1,509/1,509 tests and the independent 27-screen browser replay passed.
