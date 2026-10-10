---
runScope: epic
runKey: epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit
workflowStatus: completed
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: step-05-generate-output
nextStep: ''
lastSaved: 2026-10-10
---

Mode: epic-level. The explicitly requested audit has acceptance criteria; it is a bounded completed-app QA initiative, not system architecture planning. No numbered product epic was supplied, so the scope title yields the stable epic slug above. No earlier checkpoint exists.

Prerequisites: the user acceptance criteria are faithfully recorded in `output/full-site-qa-2026-10-09/bmad-audit-requirements.md`; existing architecture context is available from `README.md`, `RULE_FOUNDATION.md`, `RULESET_MATRIX.md`, `KNOWN_LIMITATIONS.md`, and `package.json`. New PRD/ADR documents are unnecessary for epic-level audit planning.

## Step 2 — Context and deterministic knowledge selection

Inputs read: task acceptance criteria, `_bmad/config.toml`, `package.json`, `README.md`, `RULE_FOUNDATION.md`, `RULESET_MATRIX.md`, `KNOWN_LIMITATIONS.md`. Frontend stack: React/Vite + Vitest; pure rules and local-first persistence are independently testable. Existing tests are colocated under `src/` rather than a `tests/` directory. Source PDF and rule data are checked by the rulebook audit worker; actual browser journeys are checked by the root worker. Prior reports are historical context, not present-run pass evidence.

Selected fragments from installed `bmod-tea/knowledge/tea-index.csv`: `risk-governance.md`, `probability-impact.md`, `test-levels-framework.md`, `test-priorities-matrix.md` (required epic list); `nfr-criteria.md` (QA-04/05 reliability and QA-07 maintainability); `playwright-cli.md` (browser auto). Utils/contract/Pact branches remain closed: flags false, no contract request or Pact artifacts. The installed Playwright library used by root provides real Chromium execution; no claim that Playwright CLI was installed or used.

Missing data: the user supplied no performance SLA, security penetration target, load threshold or coverage percentage. Those thresholds stay UNKNOWN. Live Google multi-device/cloud synchronization and real mobile software keyboards remain explicit evidence limitations unless root observes them in this run.

## Step 3 — Risk and testability assessment

Risk score = probability (1 unlikely / 2 possible / 3 likely) × impact (1 cosmetic / 2 degraded / 3 critical). These are audit planning risks, not proof of discovered bugs. Priority is assigned separately from the score based on the affected journey, data integrity and workaround. Owner for all rows: QA team in this chat; mitigation deadline: before the audit completion report.

| Risk ID | Category | Supported risk and grounding | P | I | Score | Mitigation |
|---|---|---|---:|---:|---:|---|
| R-RULE | BUS | QA-01/02 require every calculation/table to match the book; `KNOWN_LIMITATIONS.md` records source ambiguities and prior missed exceptions. Wrong game adjudication can silently corrupt the whole campaign. | 2 | 3 | 6 | Independently inspect PDF anchors; test pure rule boundaries and browser state consumers; keep source ambiguities explicit. |
| R-SAVE | DATA | QA-05 and README's local-first save/outbox require survival across refresh/export/import; `KNOWN_LIMITATIONS.md` explicitly does not prove real cloud concurrency. | 2 | 3 | 6 | Use isolated browser storage, export/reload/import round trips and persistence failure/regression tests; preserve a save fixture before actions. |
| R-ORDER | TECH | QA-04 requires repeated/cancelled/resumed flows; RULE_FOUNDATION's Rule Engine→Application State→UI→Persistence separation can leave a UI handler out of sync with the canonical result. | 2 | 3 | 6 | E2E checks for pending encounter, patient→forage→prepare→administer and timer transitions; assert the outcome after the action. |
| R-MANUAL | BUS | QA-01 forbids inventing missing rules; README explicitly says printed effects may require player judgment rather than automatic conclusion. | 2 | 2 | 4 | Check that manual queues retain source instructions and explicit follow-ups; keep convenience modes labelled. |
| R-UI | TECH | QA-06 explicitly names clipping/overlap/unreachable controls at three viewport classes; prior narrow-screen observations do not prove real keyboards. | 2 | 2 | 4 | Capture desktop/tablet/mobile screenshots, inspect bounding boxes and physically operate controls at each viewport. |
| R-EVIDENCE | OPS | QA-08 forbids claiming unverified features; old certification and present-run logs are different evidence. | 2 | 3 | 6 | Map every claim to current artifacts and record unverified/unavailable scenarios explicitly. |

NFR plan: reliability (no runtime exceptions; data survives reload; failed storage remains recoverable) and maintainability (build/type/lint/test regression on affected code). Their requested thresholds are categorical. Performance load, penetration/security certification, cloud multi-device, real OS keyboard and measured percentage code coverage have no requested threshold or present evidence; mark UNKNOWN/unverified rather than fabricate requirements. No `nfr-assess` final verdict is claimed in this plan.

## Step 4 — Coverage and execution

| Scenario | Priority | Test level | Risk Link | Planned evidence |
|---|---|---|---|---|
| Canonical calculations, extreme values, source exceptions, source/ruleset identity | P0 | Unit + independent PDF comparison | R-RULE | Source anchors, focused Vitest regressions and rulebook auditor report. |
| Table counts/card ranges/reference integrity | P0 | Unit + source comparison | R-RULE | `validation`, `catalogSource`, reference registry and table audit. |
| Create campaign, save/export, refresh/restore/import; invalid import leaves existing data intact | P0 | E2E + persistence integration | R-SAVE | Browser state/export fixture, tests of save/migration/capacity/failure paths. Different levels prove visible integration vs underlying failure handling. |
| Pending journey and encounter cancellation/repeat/reload/continue | P0 | E2E | R-ORDER | Browser interaction log and runtime/console capture. |
| Patient arrival→forage→prepare→administer and expiry/failure sequence | P0 | E2E + rule Unit | R-ORDER | Visible journey completion and pure numeric/timer boundary regressions. |
| Player choice/manual effect queue and optional mode labels | P1 | E2E + Unit | R-MANUAL | Actual modal interactions and ruleset switch checks. |
| Almanack/rulebook/reference search/filter/tab navigation and return | P1 | E2E | R-ORDER | Per-surface control inventory and post-navigation state. |
| Map markers/routes, journal create/edit/delete, inventory, services/downtime/season | P1 | E2E | R-ORDER | Page/control interaction inventory; seeded state only when prerequisite normal flows are documented. |
| Desktop 1440×1000, tablet 768×1024, mobile 390×844 clipping, modals/menus, loading/error/disabled states | P1 | E2E visual/geometry | R-UI | Named viewport screenshots and geometry/visible-action checks. |
| Final claim→artifact mapping; unvisited/untestable inventory | P0 | Evidence review | R-EVIDENCE | Traceability artifact and explicit limitations in final report. |
| Targeted test quality and changed-code review | P1 | Review + build/lint/test | R-EVIDENCE | Registry-scored TEA test review; independent source review; current logs. |

Execution order: data/rule P0 and baseline tests; browser P0 normal/boundary journeys; remaining P1 surfaces and viewports; minimal fixes; focused test + browser regression; full regression; final trace. Existing functional suite is a PR-style run if under 15 minutes. No nightly/weekly scheduler or extra performance/chaos framework is introduced by this task.

Resource estimate (planning range): P0 source/rule/state checks about 4–8 hours, P1 surface/viewport checks about 3–6 hours, fixes/regression/report about 2–5 hours, total about 9–19 person-hours distributed among parallel workers. The report must retain actual evidence gaps regardless of estimates.

Quality gates for this audit: P0 executed checks 100% passing; P1 executed checks ≥95% passing; all confirmed high-impact defects fixed or explicitly unresolved. Planned scenario coverage ≥80% is a TEA planning target; this user's all-site scope still requires an explicit inventory of every omitted surface and cannot be reduced to a percentage. Reliability and maintainability evidence must be identified; no final NFR certification claimed.
