# Data Validation Report

## Validation target

- Edition: *Apawthecaria*, First Edition, Third Printing (May 2023)
- Scope: canonical cards, rulesets, Reagents, Ailments, Encounter indices, and legacy-save migration
- Validation date: 2026-08-01

## Counts and integrity

| Dataset | Expected | Actual | Duplicate IDs/names | Missing canonical rows | Result |
|---|---:|---:|---:|---:|---|
| Reagents | 83 | 83 | 0 | 0 | Pass |
| Ailments | 45 | 45 | 0 | 0 | Pass |
| Lesser / Intermediate / Severe / Dire | 12/11/11/11 | 12/11/11/11 | - | - | Pass |
| Travel Encounters | 103 | 103 | 0 | 0 index keys | Pass |
| Foraging Encounters | 144 | 144 | 0 | 0 index keys | Pass |
| Social Encounters | 66 | 66 | 0 | 0 index keys | Pass |
| All Encounters | 313 | 313 | 0 | 0 index keys | Pass |

## Reagent validation

- Canonical preparation-map keys match all 83 Reagent names exactly.
- Woundwort, Yarrow, and Yellow Wort are present; Horse Chestnuts appears once.
- Parser residue names are absent from canonical IDs and names.
- Every preparation has an ID, Part name, method, Weight greater than 0, Uses greater than 0, primary Tool, complete Tool list, tag array, and special-rule array.
- All preparation tags resolve to the central 22-tag registry. Unknown tag references: 0.
- `ELSWHERE`, `PARASITES`, and `SCALES` source typos normalize to canonical tags without changing the checked source text.
- Every Reagent has six Region and four Season availability keys. `Common`, `Rare`, and `Unavailable` all occur in the edition-fixed dataset.
- Representative audited corrections are locked by tests: Animal Sheddings, Butterfly, Leech, Miracle Loaf, Musk Scrapings, Silver Ore, and the malformed Frog Slime/Wild Garlic season attachment.

## Ailment validation

- Paw Rot duplicate removed; Bite the Hand that Cures added.
- Audited severity fixes applied to Crestfallen, Nervefright, and Seasonshift.
- All requirement tags resolve to the central registry. Unknown tag references: 0.
- Boolean/special structures are present for Crestfallen, Mawfoam, Safety Stench, Sunstruck, Tickbitten Twice Shy, Wake, and Wingbreak.
- Repeat and multi-draw structures are present for Fight Marks, Groundhog Syndrome, Soured Dough, Stingshock, and Monarch severity results.

## Encounter validation

- Travel keys are limited to `A&2`, `3&4`, `5&6`, `7&8`, `9&10`, `J`, and `M`.
- Foraging keys are limited to `A`, `2`-`10`, `J`, and `M`; the former A-10 runtime mismatch is removed.
- Every indexed Travel and Foraging row round-trips through `findEncounter` using Region, Season, and card.
- Every Social row round-trips using Suit, Region, Season, location type, and City. Card number does not select Social content.
- Invalid Region, Season, Suit, card-key, tag, Tool, or ID references found by the test suite: 0.
- Some prompt/effect bodies remain `manual-only` or source-page placeholders because the old extraction merged rows. These are indexed but are not counted as fully automated rules.

## Automated checks

| Command | Result |
|---|---|
| `npm test` | Pass: 15 tests |
| `npm run build` | Pass; Vite reports the existing large-chunk warning |
| `npm run lint` | Fails with 10 errors and 3 warnings in pre-existing `App.tsx` React hook/purity code; no canonical data or rule-module lint finding was reported |

The tests cover Q/K card values, table keys, ruleset switches, legacy save migration, all required counts, uniqueness, Reagent fields and tags, representative parser corrections, Ailment requirement structures, Encounter key validity, and full selector round-trips.

## Residual risk

- Count and key integrity do not mean all Encounter effects are executable. Manual/source-only support states must remain visible until each printed row is independently transcribed and tested.
- Canonical Ailment data exists alongside the current single-Ailment UI adapter; full multi-Timer gameplay is a later step.
- Legacy display translations are not used as authority for Type, BR, availability, preparations, or rule tags, but they can still contain wording differences in the current UI.
