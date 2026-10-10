# Full-Site QA: Rulebook Fidelity, Bug Fixes & UI Audit

Source: the user's explicit full-site QA request, received 2026-10-09 (Asia/Seoul); this artifact records the requested audit scope, not a new product feature or inferred game rule.

Epic scope: `full-site-qa-rulebook-fidelity-bug-fixes-ui-audit`.

| ID | Acceptance criterion | Required evidence |
|---|---|---|
| QA-01 | Core adjudication, dice/cards, numeric values, conditions, exceptions and sequencing agree with the supplied source rulebook; source conflicts are retained as uncertain. | Rulebook page anchors, implementation references, reproducible checks. |
| QA-02 | Oracle/random tables have the source text, result range and reference relationships; separate books and convenience modes do not silently mix rules. | Table coverage counts and source anchors; canonical/ruleset checks. |
| QA-03 | Every major page/tab/menu/modal and user control is exercised in a real development-server browser. | Per-surface interaction inventory with observed results. |
| QA-04 | Complete normal journeys, cancellation/back navigation, repeated use and boundary/error inputs produce correct visible state without runtime exceptions. | Browser assertions, console/runtime capture, relevant regression tests. |
| QA-05 | Local save, restore, refresh and cross-view state preserve player data. Live cloud/account behavior is only claimed if actually observed. | Browser save/export/import/reload checks and persistence regression results. |
| QA-06 | Desktop/tablet/mobile layouts preserve existing design and have no obvious clipping, overlap, overflow, unreachable controls or misleading labels/states. | Screenshots at named viewport sizes; geometry and interaction checks. |
| QA-07 | Confirmed defects are prioritized, fixed with minimal scope, then verified through browser regression and appropriate automated tests. | Before/after behavior, precise changes, test logs. |
| QA-08 | The report identifies actual visits, rule evidence, defects/fixes, executed test results, unresolved issues and unverified areas without claiming unobserved success. | Final evidence manifest and explicit limitations. |

Architecture context: existing React/Vite frontend, pure rule resolvers, local-first storage and Firebase outbox. Evidence documents: `README.md`, `RULE_FOUNDATION.md`, `RULESET_MATRIX.md`, `KNOWN_LIMITATIONS.md`, `package.json`. Historical reports describe prior versions and cannot prove this audit's correctness.
