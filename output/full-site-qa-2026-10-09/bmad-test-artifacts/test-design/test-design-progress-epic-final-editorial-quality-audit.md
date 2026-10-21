---
runScope: epic
runKey: epic-final-editorial-quality-audit
workflowStatus: completed
totalSteps: 5
stepsCompleted: [step-01-detect-mode, step-02-load-context, step-03-risk-and-testability, step-04-coverage-plan, step-05-generate-output]
lastStep: step-05-generate-output
nextStep: ''
lastSaved: 2026-10-21
---

Epic-level mode: the supplied audit brief is recorded in output/final-quality-2026-10-21/requirements.md with six acceptance criteria. Existing React/Vite/Vitest and local-first canonical game architecture provide context. No missing PRD is fabricated. The user explicitly requested autonomous execution, so interactive checkpoints proceed without confirmation. The configured TEA output folder is retained; this new run key does not replace any previous audit.

## Step 2 — Context

Loaded requirements.md, README.md, DESIGN_SYSTEM.md, KNOWN_LIMITATIONS.md, package.json, src/main.tsx, FolioFrontispiece.tsx and useDialogFocus.ts. Frontend/Vitest; Playwright/Pact utility dependencies disabled, no contract branch. Knowledge used: risk-governance, probability-impact, test-levels-framework, test-priorities-matrix, nfr-criteria, playwright-cli. CLI is absent; existing Playwright library performs actual exploration in a dedicated Chromium process. Sandbox restrictions required an approved local browser/server launch, not a substitute for browser evidence. The new development server is 5178; occupied pre-existing ports were preserved.

Existing tests: 146 files/1509 cases in the last committed audit, with many source-string UI guards; current baseline is running freshly and is not inferred from that historic count. Real keyboard/focus/geometry checks will be separate browser assertions. Existing canonical-treatment and local save fixtures enable reproducible branch setup. No real participant study, authenticated cloud account or production SLO evidence has been supplied.

## Step 3 — Risk and testability

Owner: Codex for all mitigations, before the requested push (no invented time estimates).

| Risk | Supporting requirement/source | Category | P×I | Mitigation |
|---|---|---|---|---|
| R1 lost or crossed campaign/journal/photo state | AC03/04; local-first storage, asynchronous photo/import handlers in App | DATA | 2×3=6 | Native storage/restore/navigation/photo work, focused regression for any confirmed race |
| R2 inaccessible modal keyboard/return path | AC02; photo overlay differs from shared useDialogFocus in App | TECH | 2×2=4 | Reproduce keyboard/focus before choosing fix; re-use existing modal behaviour |
| R3 repeated opening crowds real tasks | AC01/02; identical FolioFrontispiece across chapters | BUS | 3×2=6 | Measure work start at desktop/mobile; compare smaller chapter opening vs removing all art; preserve source illustrations |
| R4 narrow/long content breaks navigation | AC02; nine-page responsive workflow | TECH | 2×2=4 | 320/390/768/1440/1920 walkthrough, geometry and visible keyboard checks |
| R5 passing automation hides untested behaviour | AC05; historic UI guards inspect source strings | OPS | 3×2=6 | Keep actual browser evidence separate, no unsupported whole-site pass |

No production performance SLO or user-study success threshold was supplied: UNKNOWN, not fabricated. Reliability evidence is save/restore/error regression; maintainability evidence is bounded diff and test review. Browser overflow/focus checks are executable task assertions, not a performance/load certification. Security/auth compliance assessment is outside this UX audit; authenticated cloud paths remain a stated evidence gap.

Fresh baseline: 145 files/1508 tests pass, one engine-message source audit hits its existing 30s timeout during cold I/O/transforms. Re-run that unchanged test alone to distinguish environment timing from a reproducible logic failure; do not change its expected assertions or timeout merely to turn it green.

## Step 4 — Coverage and execution

| Scenario | Priority | Level | Risk link | Evidence |
|---|---|---|---|---|
| Create named campaign; save/reload; invalid import keeps state | P0 | Browser E2E + existing persistence unit tests | R1 | Fresh creation/export/import results, state comparisons |
| Journal draft → other page → return → save; photo upload/preview/delete/cancel | P0 | Browser E2E; focused handler regression for confirmed race only | R1 | Screenshots, real browser IndexedDB/FileReader and event ordering |
| Photo modal keyboard focus/Tab/Escape/return; existing rule drawer regression | P1 | Browser E2E and component semantics | R2 | Active element, inert background, visible dialog assertions |
| Task/research/treatment across all nine pages | P1 | Browser E2E | R3/R4 | Desktop/mobile before/after, measured working-content offset |
| Search empty/reset/long input and narrow/mobile content | P1 | Browser E2E | R4 | Bounding rectangles and document overflow |
| Correct handoff to actual rules/inventory/result without fake data | P1 | Existing rule resolver suite + representative native treatment UI | R1/R5 | Exact inventory/Timer/result persistence assertions |
| Honest final evidence, diff review, build/lint/type and current-branch push | P1 | Static checks + Git remote verification | R5 | Logs, scoped review and final remote SHA |

All functional tests fit a PR-style run; no new CI schedule is introduced. Nightly/weekly real-device/load/cloud sessions require external environments and remain planned gaps. Resource estimates are omitted because the active CIS workflow prohibits time estimates and the user requested execution, not scheduling. Gates for executed scenarios: P0 100%, P1 ≥95%, no unresolved high-risk defect from the changed code. Global code coverage and production performance thresholds are UNKNOWN; do not invent ≥80% coverage from a test count. Keep NFR final certification outside this planning workflow.

## Step 5 — Output and checklist

Final plan: test-design-epic-final-editorial-quality-audit.md, using the installed template's scope, summary, exclusions, risks, NFR, entry/exit, coverage, execution and validation sections. One epic is single-worker by default. All risk scores and exact links checked. No system-only handoff, fabricated team approval, resource estimate or participant evidence. Resolver completion hook empty. Browser exploration evidence is in the current audit output folder and will be linked to the final report; this intentional path retains one browser manifest rather than duplicate images.
