---
workflowStatus: completed
runScope: epic
runKey: epic-full-site-qa-rulebook-fidelity-bug-fixes-ui-audit
date: 2026-10-10
author: Codex QA worker
inputDocuments: ['bmad-audit-requirements.md', 'README.md', 'RULE_FOUNDATION.md', 'RULESET_MATRIX.md', 'KNOWN_LIMITATIONS.md', 'package.json']
---

# Test Design: Full-Site QA: Rulebook Fidelity, Bug Fixes & UI Audit

Epic-level audit plan produced with official BMAD TEA 1.27.2 `bmad-testarch-test-design`. Scope is the user's existing-app audit acceptance criteria, recorded in `../../bmad-audit-requirements.md`. Six evidence-grounded risks; four high risks (score 6). Categories: BUS, DATA, TECH, OPS. This plan sets verification work; it is not proof the work passed.

## Not in Scope

| Item | Reason | Mitigation |
|---|---|---|
| New product features/design renewal | Explicit user exclusion | Minimal confirmed-defect fixes only. |
| Invented rule values | Source-book authority | Retain ambiguities and player decisions. |
| Security/load certification | No thresholds or requested scope | Mark UNKNOWN; no certification claim. |
| Live Google multi-device/real OS keyboard proof | Access/device evidence may be unavailable | Keep unverified unless actually observed. |

## Risk Assessment

Scores: P (1 unlikely, 2 possible, 3 likely) × I (1 minor, 2 degraded, 3 critical). Priority is a separate business-impact decision. All owners: QA team in this chat; deadlines: before completion report.

| Risk ID | Category | Grounding and risk | P | I | Score | Mitigation |
|---|---|---|---:|---:|---:|---|
| R-RULE | BUS | QA-01/02 + KNOWN_LIMITATIONS prior exception gaps: silently wrong rules corrupt campaign decisions. | 2 | 3 | 6 | Independent PDF anchors + canonical calculation/table checks. |
| R-SAVE | DATA | QA-05 + README local-first/outbox: refresh/import or failed storage loses player data. | 2 | 3 | 6 | Isolated save/export/reload/import and failure regression checks. |
| R-ORDER | TECH | QA-04 + RULE_FOUNDATION state layers: consumer sequencing breaks canonical outcomes. | 2 | 3 | 6 | Browser pending/resume/cancel, treatment, timer and repeat checks. |
| R-EVIDENCE | OPS | QA-08: historical certification can be mistaken for present pass evidence. | 2 | 3 | 6 | Current artifact manifest and explicit gaps. |
| R-MANUAL | BUS | QA-01 + README player judgment effects: automatic conclusion invents a rule. | 2 | 2 | 4 | Manual prompt/follow-up and convenience label checks. |
| R-UI | TECH | QA-06: clipping or unreachable controls on narrow screens. | 2 | 2 | 4 | Screenshots, geometry and real control operation across viewports. |

No supported low-risk rows are invented. Categories: BUS game logic/UX harm; DATA integrity; TECH integration/layout; OPS evidence operations; SEC security; PERF performance.

## NFR Planning

| Category | Requirement/threshold | Risk Link | Planned validation | Evidence |
|---|---|---|---|---|
| Reliability | No runtime exceptions; valid save survives refresh; failed import preserves current record | R-SAVE, R-ORDER | Browser console/runtime and persistence integration | Browser results + persistence tests. |
| Maintainability | Minimal fixes preserve passing behavior | R-EVIDENCE | Focused and full tests; build/type/lint; independent review | Current command logs + review artifact. |
| Performance/security/load | UNKNOWN, no user threshold | — | No fabricated certification | Explicit limit in report. |

This is a plan, not a final NFR evidence verdict.

## Entry and Exit Criteria

Entry: task criteria recorded; local Vite server reachable; source PDFs/data present; isolated browser state and preexisting diff baseline retained. Exit: P0 executed checks all pass; P1 executed checks ≥95% pass or triaged; confirmed high-impact defects fixed or explicitly unresolved; actual per-surface coverage and omissions reported.

## Test Coverage Plan

P0/P1/P2/P3 are priority, not execution timing. Unit checks numeric/source rules; E2E checks visible state and control wiring. They establish different aspects rather than duplicating the same assertion.

| ID | Requirement/scenario | Priority | Level | Risk Link | Evidence/notes |
|---|---|---|---|---|---|
| QA-U01 | Core formulas, exceptions, ruleset identity, extremes | P0 | Unit + PDF comparison | R-RULE | Source anchors and rule worker report. |
| QA-U02 | Oracle/table ranges, text/reference identity | P0 | Unit + source comparison | R-RULE | Validator/catalog/reference tests and source count audit. |
| QA-E01 | Create/save/export/refresh/import; invalid import preserves current data | P0 | E2E + persistence integration | R-SAVE | Browser fixtures and failure/migration tests. |
| QA-E02 | Pending journey/encounter repeat/cancel/restore | P0 | E2E | R-ORDER | Outcome after each action, console capture. |
| QA-E03 | Patient→forage→prepare→administer; reward/expiry | P0 | E2E + Unit | R-ORDER | Visible chain plus numeric/timer rules. |
| QA-R01 | Every final claim maps to current evidence | P0 | Evidence review | R-EVIDENCE | Traceability and limitations. |
| QA-E04 | Manual effect/player choice/convenience modes | P1 | E2E + Unit | R-MANUAL | Source instructions remain distinct. |
| QA-E05 | Almanack/reference/reagents/ailments search/filter/navigation | P1 | E2E | R-ORDER | Per-surface control inventory. |
| QA-E06 | Map/routes/markers, journals, inventory, services/downtime/season/archive | P1 | E2E | R-ORDER | Operation inventory; seed only when necessary and documented. |
| QA-E07 | 1440 desktop / 768 tablet / 360–390 mobile, modals and states | P1 | E2E visual/geometry | R-UI | Named viewport evidence; real keyboard remains distinct. |
| QA-R02 | Targeted regression quality and independent code review | P1 | Review + build/lint/test | R-EVIDENCE | TEA registry review and command logs. |

Planned verification groups: 6 P0 and 5 P1; zero new P2/P3 scope. Counts are scenario groups, not code coverage percentages or assertions.

## Execution Strategy

PR model: run all functional tests while under 15 minutes; focused regression after a change, full suite once stable. Browser/source audit occurs in parallel workers with isolated storage. Nightly/weekly: none added; expensive performance/chaos work has no requested threshold. No scheduler or new testing framework is installed.

## Resource Estimates and Prerequisites

P0 source/rule/state checks about 4–8 hours; P1 surface/viewport checks about 3–6 hours; fixes/regression/report about 2–5 hours; total about 9–19 person-hours across parallel workers (roughly 1–3 working days, 0.2–0.6 weeks). P2/P3: N/A. Estimates are planning ranges; gaps remain reportable regardless of time.

Data/tools: local supplied PDF, canonical data, existing Vitest fixtures, isolated Chromium browser contexts, local Vite server, baseline diff and browser save JSONs. No live account is required for local verification; its absence limits cloud claims.

## Quality Gate Criteria and Mitigation Plans

P0 pass rate 100%; P1 ≥95%; high-impact confirmed defects resolved or explicitly unresolved. TEA scenario coverage planning target ≥80%; the user's all-site scope still requires reporting every omitted area. No generic percentage substitutes for whole-site evidence. R-RULE/R-SAVE/R-ORDER/R-EVIDENCE mitigation is in progress until source, browser, regression and report artifacts exist. Full NFR certification is deferred.

## Assumptions and Dependencies

The supplied Apawthecaria v1.3 PDF is the rule authority (First Edition, Third Printing); app convenience rules stay separate. Historical architecture documents may state old schemas; current source/schema tests resolve implementation reality. Root collects browser evidence; rule worker independently audits PDF; persistence worker verifies import/invalid-number paths; this worker reviews test quality and traces evidence. All reports name actual evidence rather than implied pass status.

## Interworking and Regression

| Component | Impact | Regression |
|---|---|---|
| Rule data/engines/migration | Canonical weights/card/forage values and old save repair | Rulebook, gameplay, tool and migration tests. |
| App casebook/persistence/import | Visible canonical archive and restored state | Browser casebook/import/reload; archive/persistence tests. |
| Reference/layout | Existing design and navigation | Named viewport screenshots and source/reference regression. |

## Appendix and Validation

Knowledge: official `risk-governance`, `probability-impact`, `test-levels-framework`, `test-priorities-matrix`, `nfr-criteria`, `playwright-cli` fragments from installed bmod-tea. Checklist validated: scope criteria and architecture context loaded, six unique risks map to scenarios, scores/priority grounded, estimates are ranges, unknown NFR thresholds explicit, no duplicate same-level assertions or unsupported certification. System-level PRD/ADR/handoff and new ATDD/framework/CI work are N/A to this existing-app audit. No browser session was created by this workflow; root owns the actual browser session cleanup. Team approval is not fabricated.

Workflow: `bmad-testarch-test-design`; official source: https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise
