# Rule Data Rebuild

## Purpose and scope

This change establishes a versioned, authoritative rule-data layer for *Apawthecaria*, First Edition, Third Printing (May 2023). It does not redesign the map, patient, remedy, or journal UI, and it does not claim that every printed special effect is automated.

The source of truth is now separated from the legacy display data:

- Rule decisions use `src/rules/`.
- `src/gameData.ts` remains a compatibility/display adapter for existing Korean names and descriptions where the current UI still expects its shape.
- New games use `original-1e-3p`; saves without ruleset metadata migrate to `legacy-campaign`.

## Architecture

| File | Responsibility |
|---|---|
| `src/rules/types.ts` | Edition, ruleset, tag, availability, requirement, effect, Reagent, Ailment, and Encounter types |
| `src/rules/rulesets.ts` | Central ruleset configuration and House Rule switches |
| `src/rules/cards.ts` | Canonical card value and table-key interpretation |
| `src/rules/tags.ts` | Central 22-tag registry and source typo aliases |
| `src/rules/data/reagentAvailability.json` | Edition-fixed Type, BR, Region/Season three-state availability, and source page for 83 Reagents |
| `src/rules/data/reagentPreparations.ts` | Edition-fixed Part, method, Tool, Weight, Uses, tags, alternatives, and special rules for 83 Reagents |
| `src/rules/data/reagents.ts` | Canonical Reagent assembly and legacy display adapter |
| `src/rules/data/ailments.ts` | 45 named Ailments, severity distribution, requirement expressions, repeated cases, and special rules |
| `src/rules/data/encounters.ts` | Explicit Travel, Foraging, and Social indices and selectors |
| `src/rules/migrations.ts` | Ruleset metadata and legacy Bag item migration |

## Data models

### Rules and effects

Every structured effect carries a support state: `implemented`, `structured-but-not-executed`, `manual-only`, or `ambiguous`. Printed rules that are not executed by the current engine are represented as `customEffect` records instead of silently appearing automated.

Requirement expressions support `tag`, `allOf`, `anyOf`, `alternatives`, and `special`. This preserves cases such as Crestfallen's two recipes, Mawfoam's Instinct/Mood choice, covering-type alternatives, Wake's repeated potency requirements, and Wingbreak's bone-setting item.

### Reagents

The canonical list contains 83 unique entries. Woundwort, Yarrow, and Yellow Wort are restored; Horse Chestnuts is deduplicated; parser residue is removed from Frog Slime, Ironslug, and Wild Garlic.

Each preparation records its Part, method, primary `requiredTool`, complete `requiredTools`, Weight, Uses, tags, alternatives, and special rules. Adverse effects such as Leech's MOOD 1 or Sourchits' SLEEP 1 are not mixed into beneficial remedy tags. Part-specific seasons and special trade/acquisition rules are explicit.

Region and Season availability preserve all three printed states: `Common`, `Rare`, and `Unavailable`. The checked-in JSON is generated from the edition PDF's icon fonts by `scratch/extract_canonical_reagent_availability.py`; the app does not read the PDF at runtime.

### Ailments

The canonical list contains 45 unique named Ailments with a 12/11/11/11 Lesser/Intermediate/Severe/Dire distribution. Bite the Hand that Cures is restored, Paw Rot is deduplicated, and Crestfallen, Nervefright, and Seasonshift follow the audited index classification.

Fight Marks, Groundhog Syndrome, and Soured Dough expose repeat counts and separate-Timer rules. Stingshock exposes its optional double-dose rule. Monarch draws are represented as two lower-severity Ailments.

### Encounters

The indices expose 103 Travel, 144 Foraging, and 66 Social entries. Selection matches explicit Region, Season, card key, Suit, location type, and City fields; array order and modulo are not used at runtime.

For Titan Foraging, the printed A-8 entries remain non-seasonal and the 9/10/J/M content rows are indexed for each Season to satisfy the 24-key table shape. The same printed content is referenced; no new encounter outcome is invented.

## Save migration

`migrateSavedRulesState` performs additive migration:

1. Missing ruleset metadata becomes `legacy-campaign` and receives the current `rulebookEdition`.
2. Existing state fields, journals, and custom fields are retained.
3. Legacy Reagent Bag items are matched to canonical IDs and preparations when possible.
4. Existing `weight`, `usesRemaining`, and `preparationId` values win; missing values receive conservative defaults.
5. The single legacy `activeAilment` is mirrored into `activeAilments` without deleting the old field.

## Rulebook sources

| Data | Pages |
|---|---|
| Core card interpretation | p8 and table-specific headings |
| Basic preparation Tools | p12, p62, p66 |
| Remedy requirements and availability | p27, p30-31 |
| Ailment index and entries | p100-115 |
| Reagents and preparation details | p126-151; canonical entries p132-151 |
| Travel Encounters | p72-99; data rows p74-99 |
| Foraging Encounters | p152-187 |
| Social Encounters | p188-213; data rows p190-213 |

## Deliberately unfinished

- Encounter titles/prompts recovered cleanly from the legacy extraction are `manual-only`; mandatory choices and state changes are not yet fully transcribed into executable effects.
- Rows merged by the old PDF parser retain an explicit source-page placeholder instead of receiving invented text or behavior.
- The current patient/remedy UI still operates primarily on the legacy single-Ailment adapter. The canonical multi-Ailment and boolean requirement structures are foundations for the next engine/UI step.
- Tool, Upgrade, Encounter, and Ailment `customEffect` records marked `structured-but-not-executed` require later state-transition implementations.
- Existing Korean display descriptions have not been fully retranslated in this step.
