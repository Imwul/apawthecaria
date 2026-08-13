# Apawthecaria v1.1 Personal Rulebook Transplant Report

## Golden Master Protection

- Work branch: `codex/v1.1-personal-rulebook-transplant`
- Frozen tag: `v1.0.0` remains at `d69e93ecb0fa05912b1e1760f1520203ae243930`
- No tag move, overwrite, force push or Golden Master rewrite was performed. The requested v1.1 deployment remains independent of the frozen v1.0.0 tag.
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
- Personal notes, House Rule notes, bookmarks and consultation logs use `apawthecaria_personal_rulebook_v1`, separate from campaign save schema v8.
- House Rule notes have their own data field and visual treatment. They record personal interpretation without overriding the canonical engine.
- The two-step personal-reference reset clears only the personal Rulebook key; campaign state survives reload unchanged.
- Reference controls never execute a roll or mutate canonical gameplay state.

## Browser Evidence

- Production preview: PASS.
- Viewports: `360`, `390`, `768`, `1440`, and `1920` px all passed with zero document-level horizontal overflow.
- The 360 px critical flow passed search, filters, source detail, long Manual text, bookmarks, personal and House Rule note inputs, close, and contextual drawer interaction.
- Full-text searches passed for Journey, Foul, Bad Idea, Brand Care, Forager's Twitch, PRESERVED, Wagon, Companion, Clinic, and Barrow.
- Exact page searches passed for p.10, p.22, p.102, p.116, p.126, p.154, p.171, and p.190.
- Representative Travel, Foraging, Social, Ailment, Printed Effect, Remedy, Ingredient, Tag, Tool, Service, Clinic, Wagon, Companion, and Barrow entries exposed their source page and canonical consumer.
- Contextual Journey and map references opened the correct source context without executing an encounter or changing the campaign.
- Drawer Escape close returned keyboard focus to its trigger.
- Browser console errors, warnings, uncaught exceptions, and unhandled rejections: `0`.
- A reproduced mobile defect where the long-entry detail close action could hit the sticky navigation was repaired. Detail headers now move into view immediately after render, and closing preserves the Almanack tab.

## Personal Library Preservation

- Three representative bookmarks persisted across reload: a procedure, Ailment, and encounter.
- Personal Note and House Rule Note each persisted independently, accepted edits, and were removed by the personal-reference reset.
- A PDF consultation record persisted in personal storage and was removed by the same reset.
- Campaign snapshot before reference mutations, after reference mutations, and after personal-reference reset: identical.
- Canonical gameplay mutations caused by the reference layer: `0`.

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
- Rulebook UI is lazy-loaded as separate Almanack, drawer, source-context and source-loader chunks. Initial gameplay observation contained none of these assets; they appeared only after the Rulebook UI was opened.
- The `319 kB` extracted source payload is a static JSON request and is not embedded in the initial JavaScript bundle.
- After the production preview network was stopped, the already-loaded p.171 source page could still be searched and reopened without console errors.
- Existing large App chunk warning remains. No gameplay-oriented split was attempted in this private transplant phase.

## Verification

- Full test suite: PASS (`21` files, `173` tests).
- Rule validator: PASS.
- Rulebook drift validator: PASS.
- Release Candidate canonical campaign: PASS (`5` scenarios, including 15-Path Journey and two full years).
- Golden Master and migration fixtures: PASS (`9` tests across Golden Master and mobile layout guards).
- TypeScript and production build: PASS.
- Lint: PASS.
- Direct production-browser verification: PASS.
- Personal-state migration and isolation tests: PASS (`2` tests).

## Remaining Transplant Gaps

NONE FOR NORMAL PLAY.

Non-blocking boundaries:

- PDF illustrations and exact print typography are not reproduced; searchable source text and canonical data are provided instead.
- Blank printed pages and character-sheet artwork are indexed as source pages but remain reference-only.
- Narrative and ambiguous outcomes remain intentionally manual.
- The existing `610.13 kB` App chunk warning remains; the integrated reference surfaces and source payload are already lazy-loaded.

## Final Assessment

Can the private v1.1 build function as both the complete Apawthecaria campaign engine and a practical integrated replacement for the original rulebook during normal play?

**YES**

**APAWTHECARIA PERSONAL RULEBOOK TRANSPLANT COMPLETE**

**APAWTHECARIA v1.1 PERSONAL RULEBOOK — PRESERVATION VERIFIED**

**BROWSER EVIDENCE COMPLETE**

The v1.0.0 tag and schema v8 remain unchanged. No new v1.1 tag was created.
