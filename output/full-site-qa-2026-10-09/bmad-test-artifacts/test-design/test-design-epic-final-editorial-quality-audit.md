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

# Test Design: Epic final-editorial-quality-audit — Final Editorial Quality Audit

Date: 2026-10-21. Author/owner: Codex. Status: execution plan, not a site certification.

## Executive Summary

The user's six audit acceptance criteria are the formal scope (output/final-quality-2026-10-21/requirements.md). Plan actual desktop/mobile exploration before changing the current React/Vite/Vitest forest journal. Five grounded risks: three score6, two score4. No fictional user interviews, performance SLOs or coverage percentages. The five-step progress document stores the supporting statements and atomic coverage matrix. This single-epic output is single-worker under the workflow's explicit epic default; no team or parallel execution is claimed.

## Not in Scope

Production deployment, authenticated cloud/account deletion, every printed narrative branch, a participant study and OS/device accessibility certification are not executable with the supplied local context. Existing local APIs and representative branch fixtures are available; preserve these limits in the final report. Do not remove important functionality or invent new rules to bypass them.

## Risk Assessment

| Risk | Category | P | I | Score | Mitigation / owner / timeline |
|---|---|---:|---:|---:|---|
| R1 asynchronous journal/photo/campaign state crosses or is lost (AC03/04, App) | DATA | 2 | 3 | 6 | Actual native photo/import/save navigation tests; focused regression for confirmed defect; Codex before push |
| R3 identical chapter openings crowd actual work (AC01/02, FolioFrontispiece) | BUS | 3 | 2 | 6 | Compare screenshots/working offsets and alternatives, preserve source art; Codex before push |
| R5 source guards incorrectly stand in for user evidence (AC05, test corpus) | OPS | 3 | 2 | 6 | Real keyboard, state and geometry assertions; explicit unsupported scope; Codex before push |
| R2 photo modal misses existing keyboard/return semantics (AC02, useDialogFocus) | TECH | 2 | 2 | 4 | Reproduce, apply shared dialog pattern only if confirmed, check nested/reference regressions; Codex before push |
| R4 narrow/long content harms navigation (AC02, nine pages) | TECH | 2 | 2 | 4 | Mobile/desktop/ultrawide sweeps and long/empty content; Codex before push |

No low-risk rows are invented merely to fill the template. Priority is assigned by impact/workaround, separately from risk scores.

## NFR Planning

Reliability: saved campaign and draft/photo intent survive appropriate navigation/restore; browser state assertions and persistence suite evidence (R1). Maintainability: small diffs reuse existing primitives; focused test review and type/lint/build logs (R2/R5). Performance SLO: UNKNOWN; collect content-offset geometry without claiming load-time or participant-speed improvement (R3). Security/compliance/load thresholds and real accounts: UNKNOWN/outside this change; no false PASS.

## Entry Criteria

User supplied autonomous brief and acceptance criteria; existing architecture, synthetic campaign data and dedicated Chromium process available. Browser and Vite sandbox launch restrictions were resolved through the environment's approved escalation. Occupied ports and user profiles are untouched; run targets localhost5178.

## Coverage Plan

| Scenario | Priority | Level | Risk Link | Reason |
|---|---|---|---|---|
| Named creation, local save/reload, invalid/valid import | P0 | Browser E2E | R1 | Actual storage integration, separate from existing pure validators |
| Draft/photo add/save/leave/restore/delete/cancel | P0 | Browser E2E, confirmed handler regression | R1 | Async boundaries cannot be established by source strings |
| Photo dialog focus/Tab/Escape/opener and reference drawer | P1 | Browser + rendered component semantics | R2 | Verifies real DOM/keyboard behaviour, not CSS selectors alone |
| Nine pages, current task/research/treatment and return | P1 | Browser E2E | R3/R4 | Exercise true interaction and preserve page-specific content |
| Empty/long search, 320/390/768/1440/1920 layout | P1 | Browser geometry and interactions | R4 | Check clipping, controls and meaningful content offsets |
| Existing rules, inventory and timer semantics | P1 | Existing resolver suite + representative browser remedy | R1/R5 | Pure arithmetic stays in fast tests; UI wiring is separate |
| Test/type/lint/build/diff evidence and non-destructive push | P1 | CLI + remote SHA | R5 | Reproducible result and delivery evidence |

## Execution Strategy

PR-style: run all functional tests if below15min, TypeScript, lint, production build, then same-browser regression and independent review. No new CI pipeline is needed. Nightly/weekly real-device/load/cloud checks remain external evidence gaps, not scheduled work. Resource/time estimates are deliberately N/A because the active CIS workflow prohibits them and the user requested execution.

## Quality Gates and Exit Criteria

Executed P0 scenarios100%; P1≥95%; fix all confirmed high-risk defects from changed paths; no new runtime errors; preserve source/user work; review exact diff; commit/push current branch and verify remote SHA. Global code coverage/production SLO is UNKNOWN, not inferred from case counts. The final report must distinguish automated tests, real browser observations and unverified product breadth.

## Validation and Handoff

Checklist applied: scoped epic prerequisites, unique grounded risks, P×I arithmetic, exact R1–R5 scenario linkage, separate priorities, NFR unknowns, single-epic output, no invented team approvals. Earlier configured artifacts are not overwritten. Initial source-audit timeout is recorded for unchanged focused recheck. Template sections for system architecture handoff and team roster are N/A. Existing Playwright library is used; no CLI session was claimed. The dedicated browser is closed when the overall audit ends. workflow.on_complete resolves empty.
