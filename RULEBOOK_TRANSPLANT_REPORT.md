# Apawthecaria v1.1 Personal Rulebook Transplant Report

## Golden Master Protection

- Work branch: `codex/v1.1-personal-rulebook-transplant`
- Frozen tag: `v1.0.0` remains at `9ec38b301c46d2fb2807345ffb61f4a4e22888a3`
- No tag move, overwrite, force push or production deployment was performed.
- Gameplay engine, campaign schema and migration semantics are unchanged.

## Rulebook Transplant Coverage

The Before column measures source-linked integrated reference entries in v1.0, not the already-certified canonical gameplay data.

| Information family | Before | After |
|---|---:|---:|
| Rules / source chapters | 0 | 20 |
| Procedures | 0 | 17 |
| Travel Encounters | 0 | 103 |
| Foraging Encounters | 0 | 144 |
| Social Encounters | 0 | 66 |
| Named Ailments | 0 | 45 |
| Printed Effects | 0 | 358 |
| Remedies / Preparations | 0 | 189 |
| Ingredients | 0 | 83 |
| Tags | 0 | 22 |
| Tools including Upgrades | 0 | 30 |
| Services | 0 | 17 |
| Clinic Agendas | 0 | 10 |
| Wagon Expansions | 0 | 10 |
| Companions | 0 | 9 |
| Barrows | 0 | 8 |
| Downtime procedures | 0 | 1 |
| Regions | 0 | 7 |
| Seasons | 0 | 4 |
| Searchable tables | 0 | 43 |
| Explicit source examples | 0 | 12 |
| Canonical and source linkage | 0 | 1,201 / 1,201 |
| Printed source pages | 0 | 220 / 220 |

## Manual Resolution

- Total: `347`
- Source context complete: `347/347`
- Required decision complete: `347/347`
- Choices and state-effect metadata complete: `347/347`
- Follow-up metadata complete: `347/347`
- Automation added: `0`

The Manual UI now exposes its canonical owner, source page, printed constraints, decision, available choices, expected state changes and follow-up. It explicitly states that Manual Resolution preserves the source's player choice, narrative or ambiguity and is not missing implementation.

## Integrated Experience

- The existing Almanack is now a searchable Rulebook Hub with entity, Rule ID, full-text and `p.N` searches.
- Play, chapter opening, map region/location and Manual Resolution surfaces open one shared contextual reference drawer.
- Reference pages are generated mechanically from the source PDF and loaded on demand outside the initial JavaScript bundle.
- Ailments cross-link to Treatment, Printed Effects, Tags and matching Remedies.
- Regions cross-link to encounters, seasons and region-specific tables.
- Personal notes, bookmarks and consultation logs use `apawthecaria_personal_rulebook_v1`, separate from campaign save schema v8.
- Reference controls never execute a roll or mutate canonical gameplay state.

## PDF Consultations

Representative canonical campaign target:

| Category | Consultations |
|---|---:|
| Total | 0 |
| Rules | 0 |
| Encounters | 0 |
| Ailments | 0 |
| Remedies | 0 |
| Tables | 0 |
| Geography | 0 |
| Guidance | 0 |
| Terminology | 0 |

The in-app personal consultation log remains available for future real sessions. Voluntary deep reading and extended flavor are not classified as transplant failures.

## Performance

- Frozen branch baseline App chunk: `606.41 kB` minified (`162.94 kB` gzip).
- Private transplant App chunk: `610.13 kB` minified (`164.09 kB` gzip), a `3.72 kB` minified / `1.15 kB` gzip integration-shell increase.
- Rulebook UI is lazy-loaded as separate Almanack, drawer, source-context and source-loader chunks.
- The `319 kB` extracted source payload is a static JSON request and is not embedded in the initial JavaScript bundle.
- Existing large App chunk warning remains. No gameplay-oriented split was attempted in this private transplant phase.

## Verification

- Full test suite: PASS (`20` files, `171` tests).
- Rule validator: PASS.
- Rulebook drift validator: PASS.
- Release Candidate canonical campaign: PASS (`5` scenarios, including 15-Path Journey and two full years).
- Golden Master and migration fixtures: PASS (`9` tests across Golden Master and mobile layout guards).
- TypeScript and production build: PASS.
- Lint: PASS.
- Direct interactive browser capture: NOT EXECUTED because the desktop browser-control runtime could not initialize; this is a verification limitation, not a known gameplay failure.

## Remaining Transplant Gaps

NONE FOR NORMAL PLAY.

Non-blocking boundaries:

- PDF illustrations and exact print typography are not reproduced; searchable source text and canonical data are provided instead.
- Blank printed pages and character-sheet artwork are indexed as source pages but remain reference-only.
- Narrative and ambiguous outcomes remain intentionally manual.

## Final Assessment

Can the private v1.1 build function as both the complete Apawthecaria campaign engine and a practical integrated replacement for the original rulebook during normal play?

**YES**

**APAWTHECARIA PERSONAL RULEBOOK TRANSPLANT COMPLETE**

No v1.1 tag or production deployment was created.
