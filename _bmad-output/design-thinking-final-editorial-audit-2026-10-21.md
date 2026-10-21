# Design Thinking Session: Apawthecaria

Date: 2026-10-21 (Asia/Seoul). Facilitator: Codex. Skill: bmad-cis-design-thinking.

## Design Challenge

Refine the existing playable forest journal so a player can find the current task, research an ingredient, record a treatment and keep their memories without wading through interchangeable promotional sections or inaccessible interactions. Preserve the source illustrations, quiet paper surfaces, forest-coloured rail, contextual game tags and distinct page functions.

Success means concrete usability/behaviour improvements with real browser evidence, safe regression results and a pushed commit. Existing temp directories and saved data structures remain intact.

The user's explicit instruction to execute autonomously supersedes interactive checkpoints. Each workflow checkpoint is saved here; no approval or imaginary user response is inferred. The existing source documents supplied by project context form the brief. No new artwork or redesigned visual system is planned.

## EMPATHIZE: Understanding Users

Selected from the installed design-methods.csv: Journey Mapping, Empathy Mapping and Shadowing. Journey Mapping will be performed through actual browser tasks; Empathy Mapping records testable hypotheses; Shadowing is unavailable because no real participants were supplied. No interviews or real-user feedback will be fabricated.

Initial evidence: the product is a solo RPG companion with nine principal pages, two game clocks, real source references, canonical saved patient records, journal photos and local-first backup. Current DESIGN_SYSTEM.md describes an older typography/layout layer; src/main.tsx additionally loads mystic-folio.css, whose source frontispiece repeats on every desktop page. Whether that repetition obstructs tasks must be measured in the browser before changing it.

Hypothesis: a returning player needs the working part of each chapter earlier, while the forest book still needs a recognisable opening. Keyboard users need every image overlay to behave like the existing shared dialogs. These remain hypotheses until reproduced.

## DEFINE

Observed in a fresh browser: (1) nine desktop chapters repeat the same 145px promotional opening plus30px margin; the reagent search starts at y615.7. (2) mobile rulebook search starts at y1279.2, below another introduction and three context tiles. (3) a real photo read delayed1200ms leaves Save enabled: the saved journal has0photos and the image appears in the next blank draft. (4) enlarged photo exposes no dialog role, keeps focus on the background opener and ignores Escape. No document overflow was observed in the initial36page/width views.

POV: a player returning to a working journal needs the actual search or next action earlier because repeated title/intro layers add reading without changing what they can do. A keyboard user needs the photo viewer to follow the same focus/escape contract as the rulebook drawer. A player attaching a photo needs visible preparation status and a save boundary that keeps that photo with the intended text.

HMW: retain original illustration while shortening the repeated opening? Give known-name search precedence without deleting context browsing? Make async attachment readiness visible without changing save schema? Reuse the existing modal primitive rather than introduce another interaction system?

## IDEATE

Methods selected: SCAMPER Design (combine redundant headings, eliminate repeated promotional text), Analogous Inspiration (book running heads and library finding aids), Brainstorming (divergent options before selecting). Candidates:1remove all artwork;2replace the theme;3add animated chapter art;4retain opening only on first entry;5compact original art on working pages;6rewrite slogans per chapter;7merge all pages;8move rulebook search before context;9remove context tiles;10put context in a disclosure;11always expand patient context;12make rulebook header a small toolbar;13shorten duplicate focused-creation heading;14hide all guidance;15shrink body text;16add sticky search;17reuse shared dialog focus for photo;18add another custom modal engine;19wait/block save during attachment preparation;20silently attach late photos to whatever journal was last saved;21surface pending-photo status;22guard late photo callbacks after leaving the journal;23invent a new photo save schema;24retain confirmed game-tag colours and reader controls.

Selected concepts:5+13 (an editorial opening hierarchy),8+12 (search before contextual browsing, preserving all existing controls),17+19+21+22 (existing focus primitive and explicit attachment readiness). Rejected1/2/3/6/7/9/14/15/16/18/20/23: unnecessary redesign, loss of useful content, decorative churn, reduced readability, new abstraction, or ambiguous data association. Context disclosure10/11 is deferred: simply reordering and condensing the heading will be tested first. Radius/shadow removal across the whole product is rejected; paper shell, active procedure surfaces and focus/selection borders have real roles.

## PROTOTYPE

Reversible local implementations: retain the full source-art welcome on first creation, use the same art as a compact chapter head on working pages, remove the duplicate focused-wizard heading, and put the existing rule lookup ahead of contextual browsing. Keep every context filter, book entry and return action. Use the existing shared modal focus hook for photos, a visible preparation status and a pending-read save boundary. No fake backend or placeholder behaviour was introduced.

The actual profile walkthrough also exposed disconnected visible labels (3 normal, 2 conditional) and a cancelled editor draft reappearing on reopen. Wire existing labels to controls and reset editor copies when opening/closing, without changing the saved profile structure. These are confirmed interaction defects, not visual preferences.

Features to test: async read/save association, invalid reads and concurrent reads, full eight-step creation, working-page hierarchy, rule lookup/context/notes/bookmarks, modal keyboard focus/return/contrast, profile cancel/save, backup/restore and representative treatment regression.

## TEST

Real isolated Chromium/Playwright walkthroughs: 36 baseline page/width views and 45 post-change views across all9main pages at320/390/768/1440/1920px. No page horizontal overflow observed. At1440px reagent search moves from y615.67 to529.67; at390px rule search moves from y1279.20 to692.42. These measure content position, not task speed or satisfaction.

A controlled1200ms delay around the native FileReader reproduced a saved record with0photos and a leftover image in the next draft. The fixed browser flow blocks submission while reading, then saves1photo with its intended text and leaves0draft photos; reload retains the association. The new photo dialog passes focus containment, Tab/ShiftTab, background inert, Escape, opener return and viewport bounds at1440/390/320px. A visual check caught dark inherited heading colour in the first implementation; explicit inheritance from the light header fixed it and the screenshots/contrast were rechecked.

Fresh320px creation completes all8steps and survives reload. Invalid JSON leaves the current campaign intact; downloaded backup removes a later temporary record on restore and retains the saved photo. Prepared patient import (distinct from the fresh character flow) verifies treatment cancel, reference return, saved reward checkpoint, once-only consumption and printed p.36 rewards. Profile cancelled name/benefit changes now reopen as saved values; conditional labels, normal save and reload pass. Six journal sections and ailment search/empty reset were exercised.

Testing participants: expert agent walkthrough only. No interviews, participant quotes or real-user feedback were collected; a5–7person usability study is unavailable. Full-suite execution and the narrowly scoped BMAD Test Review are recorded separately in the final report. No formal whole-product coverage/gate is inferred from a12test quality review.

## Key Learnings

The working book gains clarity from less repeated introduction, while the existing artwork, paper and forest rail already provide a distinct identity. Removing all cards, radii, shadows or gradients would erase meaningful surfaces without addressing the observed task obstruction. Native async boundaries and modal behaviour were more important defects than ornament. A visual check remained necessary after mechanical modal tests passed. The source PDF resolves reward expectations: this Lesser/noFAIR/noFOUL case gives1Trinket and1Reputation; an exploratory script's unsupported+2assumption was corrected from p.36, with no reward-engine change.

## Next Steps

This iteration's confirmed defects and hierarchy changes are implemented and browser checked. Finish final code/build and production-preview smoke checks, record exact results and remaining limits, then commit/push the current branch without force or touching existing temp work. Next research cycle should observe real new/returning players completing lookup and photo-journal tasks; success measures would be successful task completion, mistaken actions and comprehension. Current viewport measurements do not substitute for those outcomes. Authenticated cloud, real devices/browser engines and every narrative/clinic/barrow branch remain unverified in this iteration; do not manufacture approval for them.
