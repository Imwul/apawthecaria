# Independent player-task UX audit — 2026-10-08

This audit uses the rulebook's play loop supplied after a complete reread: Move → arrival encounter → mark calendar day → generate patient identity / severity / ailment / timers → research current and adjacent regions → forage or barter including encounters → check for immediate remedy **before** timer reduction → remedy → reward / consequence / optional memory / departure → next Move. Barrows replace the ordinary local patient loop. Journey close and downtime occur around that loop. The existing app's tabs and component names were not treated as the rules' structure.

## Findings with concrete implementation locations

| Priority | Finding | Player impact | Exact implementation |
| --- | --- | --- | --- |
| P1 | The play page has a prominent next-action dossier, a second set of action cards at the bottom, automatic scroll focus, per-workspace headers and a guide recommending the same next step. | Users must infer which repeated instruction controls the phase. The bottom action hub is only found after traversing the very workspaces it should index. | `src/App.tsx:12733` TodayOverview; `src/App.tsx:26211` action-hub; `src/components/JournalExperience.tsx:122` TodayOverview; `src/components/PlayGuide.tsx:42` current guidance. |
| P1 | No explicit, compact visual account of the local play loop connects the phase currently in progress to the subsequent phase. | The most important ordering constraint—encounter before remedy check before timer decrease—lives in conditional prose and transient dialogs. Returning players cannot orient without reading a large paragraph. | `src/campaignNextAction.ts:24` recommendation state; `src/App.tsx:16191` localCarePhase; `src/components/JournalExperience.tsx:122`. |
| P1 | Patient remedy workspace is always visually ordered ahead of research/acquisition even when there is no usable recipe in the bag. | Players repeatedly pass a full empty treatment-selection panel to reach the task they can actually perform. Conversely, once materials suffice the correct primary task is remedy. Phase attention needs to select the strongest workspace. | `src/App.tsx:15843` treatmentAcquisitionNeedsAttention; `src/App.tsx:25218` acquisition details; `src/App.tsx:25760` treatment; `src/workspace.css:160`; `src/feature-layout.css:1221`. |
| P1 | Research candidate rows contain large narrative explanations, all preparations, trade values and optional interest-selection controls before the actual forage draw and start controls. | The recurring action costs a long scroll; the player's current requirement and time budget are separated from the actual draw. Research is supported, but presentation reduces the speed of the core loop. | `src/App.tsx:25283` forage-plan; `src/App.tsx:25317` forage-target-table; `src/App.tsx:25393` empty state; `src/App.tsx:25398` forage-draw-step; `src/App.tsx:25415` forage-action-row. |
| P1 | Optional patient archive is a fixed bottom-right floating card rather than a compact record action in normal flow. | On mobile it occupies almost the entire width and overlaps other play controls, while appearing to be an extra obligatory procedure. The note itself is optional, but the interface frames archiving as the next main task. | `src/App.tsx:22486` pending-archive-panel; `src/campaignNextAction.ts:159` archive recommendation. |
| P2 | Reference shortcut for “current patient” clears both region and season; “here now” clears patient relevance. | The most useful question—what can be found here now for this patient—requires rebuilding a filter conjunction after every shortcut. | `src/App.tsx:28543` herbarium-context. |
| P2 | Mobile navigation hides six of nine destinations behind three mode buttons; moving from play to a specific reference often requires two navigation clicks. The first destination depends on the last visited page. | A player reaching for a familiar reference cannot rely on a stable destination. This is more harmful during timed care than while browsing memories. | `src/components/JournalExperience.tsx:16` WORKSPACES and lastVisited; `src/workspace.css:397` mobile mode switches. |
| P2 | Situation repeats in header, dossier, patient strip, patient clinic heading, compact journey details and page opening. | Repeating time figures increases scanning cost and makes different clocks seem interchangeable. Journey days, individual ailment hours, FP and burden must be distinct. | `src/App.tsx:12585` adventure-context; `src/components/JournalExperience.tsx:147` journey calendar; `src/components/JournalExperience.tsx:158` patient strip; `src/App.tsx:24803` clinic heading; `src/App.tsx:26118` compact journey summary. |
| P2 | Visual order and DOM order differ for intake history, remedy and acquisition. | Keyboard and screen-reader users traverse a different procedural sequence from the visible one. This also makes maintenance fragile. | `src/App.tsx:24988` history before form in source; `src/feature-layout.css:1217` patient-intake flex / history order10; treatment/acquisition orders above. |
| P2 | Rulebook drawer shows technical runtime-status metadata and enumerates many related entries before the readable guide and original rule. | A one-click reference still creates a long information hunt. Players need the procedure and exception first, then original context and optional related knowledge. | `src/components/RulebookReferenceDrawer.tsx:70` context runtimeStatus; related navigation before ReaderGuide and RulebookSourceText. |
| P2 | Field-station design uses decorative English folio indices, repeated eyebrow labels, and large three-column navigation identity alongside operational Korean labels. | The design has consistent colors, but the visual hierarchy elevates catalogue identity and current-page context over the reusable tools needed every turn. | `src/components/JournalExperience.tsx:43` numbering; `src/components/JournalExperience.tsx:90` chapter field index; `src/App.tsx:12572` branding/identity. |
| P2 | Active-care region also contains lengthy scrounging rule text, knitting project and pawn-sale list before those tasks are relevant. | These options distract from the currently failing treatment requirement and create page-length burden without changing the current legal next step. | `src/App.tsx:25710` scrounging rules, knitting and pawn-sale UI within active ailment branch. |

## Existing strengths to preserve

- The app already separates journey days and individual ailment timers in the engine. The redesign must not combine these clocks.
- Exact contextual rulebook references already exist and should remain one interaction away.
- Acquisition already includes current/adjacent region, seasonal availability, rarity modifiers, matching parts, tags and tools. This is a strong research tool; the problem is excessive vertical presentation and task placement, not absence of calculation.
- The engine already pauses timer reduction for immediate-remedy checkpoints. Preserve transaction safety, resume behavior and warnings.
- Mandatory encounter-specific narrative instructions allow spoken / visual / written acknowledgement; ordinary notes are optional. Do not broadly remove encounter-specific rule obligations.
- Saved workflow drafts, browser-back handling, record recovery, local persistence and cloud safeguards are valuable and can survive an IA redesign.
- Map details are already collapsed during local care; keep large map surface only where spatial decisions are needed.

## Recommended implementation direction

Build one play table whose hierarchy is **situation → current procedural stage → executable workspace → optional supporting tools**. Keep the current transaction engine rather than rewriting rules while changing presentation.

1. Replace the oversized TodayOverview with a compact current stage / primary action / clocks / required tags view. Introduce an explicit six-step local loop: Move / Encounter / Patient or Barrow / Research and Gather / Remedy / Depart. States may loop back through Gather, and encounter / reward checkpoints always take priority.
2. Place a concise action switchboard directly before workspaces, or fold alternatives into the current-stage surface. Do not keep a second large set of identical next-step actions at the bottom.
3. When `treatmentCanTreatFromOwned` is false, place research/acquisition before the empty treatment controls. Once materials suffice, emphasize remedy and collapse acquisition. Avoid CSS-only ordering: source order should follow the visible procedural order.
4. Keep the patient's requirement comparison and all timers visible together. Add direct requirement-to-research jumps that choose the tag without navigating away.
5. Give acquisition a compact comparison table: part / contributing tags / exact rarity / preparation-tool availability. Put draw/start controls near its heading or in a sticky action region. Allow optional notes and full narratives to expand separately.
6. Turn optional archive into a normal-flow compact receipt with a default “continue” action; expand a memory editor on request. Keep consequence and required follow-up decisions separate and explicit.
7. Expose stable primary destinations on mobile—Play, Map, Bag, References—with memories under a secondary destination. Contextual reference links should remain faster than opening global navigation.
8. Give the rulebook drawer a top procedure summary, exception and source. Hide runtime implementation classification from the player's reading surface; move related entries below the requested information.
9. Preserve current+season+patient filter combinations when choosing patient relevance. Add a single shortcut that asks the natural question “current region / season / patient”.
10. Apply one shared set of surfaces, type sizes, clock styles, status semantics and interaction sizes across intake, research, remedy, barrows and downtime. Remove scattered inline pastel decoration from critical task surfaces as they are touched.

## Verification targets

- Typical local care: requirement identification ≤1 viewport; contextual rule ≤1 click; research for missing requirement ≤1 click; draw/start reachable beside candidate selection without passing unrelated content.
- Remedy checkpoint: current stage visibly locks to remedy until solved; no acquisition or timer control bypass; exact original p.33 / p.35 procedure readable immediately.
- Independent timers: multi-ailment hours remain individually inspectable; shortest visible clock never replaces or overwrites selected ailment timer.
- Optional record: treatment reward/consequence can advance without authored prose; required specific encounter acknowledgement still enforced.
- Mobile 390px and desktop 1440px: no horizontal page overflow; no fixed optional card overlapping core controls; buttons ≥44px; stable navigation destinations; same DOM and visual sequence.
- Resume and back: refresh/re-entry opens the pending workspace, prevents duplicate material consumption / timer decrement, and returns from rulebook without losing the active step.

Browser baseline visual review is pending the shared local server. All findings above are confirmed by component/stylesheet inspection; no browser measurement is claimed here.

## Baseline interaction counts (code-derived, before redesign)

These are deterministic UI activation counts from the existing handlers, not measured elapsed times. Scroll distance is listed separately so it is not confused with a click.

| Player task | Baseline | Proposed target | Source proof |
| --- | --- | --- | --- |
| Play → a specific reference section on desktop | 1 navigation activation | 1 | All nine items are visible in desktop rail. |
| Play → a specific reference section on mobile | 1 mode activation if last-visited destination happens to match, otherwise 2 activations | stable 1 | Mobile only displays current mode's three items; mode selects lastVisited or first. |
| From all-reagent catalogue, combine current patient + current region + current season | 3 activations: patient relevance, region select, season select | 1 contextual shortcut | Patient button clears region and season; location button clears patientOnly. |
| Active prescription → that ailment's original rule | 1 click, then drawer scrolling | 1 click with relevant source at requested page | Treatment header has direct reference; drawer inserts context and up to 28 related links before source. |
| Open next-step original through TodayOverview | 1 click | 1 | Existing button already reaches context reference. Preserve this access speed. |
| Seven recurring procedure references from arbitrary play phase | No stable direct set; task reference1 click if current, otherwise catalogue navigation/search | relevant3:1 click; remaining4:expand +1 click | Baseline has only stage-dependent reference; QuickRules adds all7 without duplicate shortcuts. |
| Change research's target requirement | 1 activation | 1 | Existing forage-tag-choices are already useful. |
| Basic current-region forage after research, without manual card selection or optional interest notes | 1 start activation then actual encountered procedure choices | 1 start activation then required procedure choices | CardDrawSlot auto-draw fallback means preliminary interest notes/card-click are optional. Avoid making them mandatory. |
| Locate the acquisition start button after reading candidate list | No extra mandatory clicks, potentially lengthy scrolling | start control beside research header; disclosure for full list | Existing candidate table + interest summary precede forage-draw-step and action row. |
| Locate action switchboard from Play top | Scroll after all workspaces | before workspace or merged current-stage controls | action-hub is at end of PlayView return. |

### Browser baseline availability

A separate hidden IAB tab was opened at `http://127.0.0.1:5184/`. The index returned HTTP 200, but at baseline verification the screen and accessibility tree remained empty and console returned no warning/error entries. This limits the baseline audit to component/stylesheet evidence until source hydration completes. No fabricated click or viewport measurements are included.

The independent IAB tab subsequently hydrated to the character onboarding screen, with the campaign write-ownership warning caused by the parent's authoritative test tab. The alert was dismissed for read-only inspection; no campaign field or game action was changed. The independent tab was then closed to preserve the parent's test ownership. Final interactive and responsive QA belongs to that authoritative tab.

## Follow-up review of redesigned two-mode care controls

The proposed research/remedy switch reduces simultaneous page content, but two implementation points need explicit handling:

1. Each active mode is a native `<details>` whose `onToggle` handles opening only. Closing its summary leaves the selected mode unchanged; the CSS hides all closed details completely. Consequently both mode panels can disappear while a switch button still reports `aria-pressed=true`, and selecting that same mode may not trigger a rerender. Use normal controlled panels, or synchronize close events to the selected state. Associate mode buttons with their panels using `aria-controls`; preserve useful selected/expanded semantics.
2. The auto-selection effect chooses remedy whenever bag contents become sufficient, including before an in-progress forage encounter or barter procedure is finished. Required acquisition checkpoints must take precedence over ordinary material availability. Immediate-remedy and reward checkpoints may choose remedy; an unfinished acquisition transaction should keep its existing procedure available. Automatic panel changes should also preserve keyboard focus if they hide the currently focused control.

Source locations at review: `src/App.tsx:15846`, `src/App.tsx:25249`, `src/App.tsx:25254`, `src/App.tsx:25797`, and `src/workspace.css:542`. Parent owns remediation and final interactive verification.

## Harvest UI regression found during final browser verification

The parent's interactive review found a rule mismatch missed by engine-only checks: `handleAddForageFindToBag` filtered out otherwise harvestable parts when their later preparation tools were missing. The rulebook separates harvesting from remedy preparation. The parent removed that acquisition restriction and retained a preparation-tool warning.

A behavioral regression now executes the actual app callback with a cancelled prompt and no cookware. Summer Cherry Tree parts, including cooked Cherries, remain selectable and their chosen canonical ID gathers successfully through the engine; Spring excludes the unavailable seasonal Cherries. Existing prose tests were corrected to describe tool requirements at preparation time. This directly covers the gap between the UI gate and the already-correct engine.

The candidate workspace now supports a contextual default without changing legality or ordering: intersect current results with the player's research notes first, then patient needs, otherwise show all. An explicit All choice continues to reveal every result, including parts outside the prescription, and retains canonical row identity/order. The default selector and UI/engine regression passed together with the play-loop fidelity suite: 30 tests across three files, plus scoped ESLint.

## Acquisition continuity and departure corrections from final QA

Final code review found that the ordinary forage button blocked unfinished acquisition, but the Independent familiar button could still call `executeForageDraw` and replace an existing forage or barter transaction. A shared new-acquisition gate now protects the actual ordinary, Independent, barrow, Scrounging, Sodden Logs, and new-barter callbacks. Existing barter continuation uses its separate resume handler. Queued Wasp companion draws stay queued during a barter, immediate-remedy checkpoint, or treatment reward. New acquisition shortcuts are withheld while a treatment reward is pending.

The Scrounging branch originally exposed both long direct-acquisition catalogues before its departure action; the same departure action also appeared in the optional journey summary. It now offers one departure button at the start of the Scrounging section, leaves the two card-forage choices concise, and places the three-hour and four-hour direct-acquisition catalogues in separately closed native disclosures. The current action tile focuses that section directly. A local-help stop now says to meet a local patient, matching the required diagnosis rather than implying a final record task.

Focused tests execute the actual App guard initializers and ten actual callbacks. They check unfinished forage/barter exclusion, reload-preserved immediate-remedy checkpoints, exact patient/ailment release, an Independent benefit after release, queued Wasp draw preservation, and a rendered eighty-option catalogue under each closed disclosure with a single departure action preceding it. Seven focused suites passed 123 tests; the encounter-experience suite alone passed 37. TypeScript and scoped ESLint passed. The parent's authoritative browser confirmed the treatment → reward → departure → movement → social arrival → next-day local-care loop.
