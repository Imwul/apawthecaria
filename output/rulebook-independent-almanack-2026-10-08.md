# Independent rulebook review: Almanack, encounters, sheet and map

Date: 2026-10-08. Scope: supplied **Apawthecaria v1.3.pdf**, PDF pages 117–220 inclusive, read in ascending order, including complete descriptions, choices and consequences. I did not read the webapp implementation, existing audits, current information architecture or prior design decisions. This report describes needs derived from the source alone. It complements, rather than substitutes for, independent review of pages 1–116.

## Coverage and method

- All 104 assigned pages were extracted with PyMuPDF and read. Two truncated tool outputs were explicitly reread (pp177–181 and pp202–204); no excerpt was treated as complete after truncation.
- Reagent symbol rows on pp132–151 were rendered and visually inspected in full. The icon legend on p126 was inspected; text extraction cannot distinguish filled/common, outline/rare and gray/unavailable symbols, or safely read weight circles.
- All image-only/non-rule pages in this range were inspected: 117, 127, 153, 189, 200, 216, 217, 218, 219. Pages 214–215 are Notes; p220 is the back cover.
- Representative seasonal and lookup pages were additionally rendered to confirm rank/suit/season meaning and apparent source ambiguities (152, 156–159, 168–169, 188).
- Both one-page character-sheet PDFs were extracted and rendered. Both supplied map faces were viewed.

| Pages | Material covered |
| --- | --- |
| 117–125 | Delve illustration and all remaining Barrow challenges/outcomes |
| 126–131 | Reagent key, all TAG lookup indexes |
| 132–151 | Every reagent, part, preparation, rarity, region/season symbol and special rule |
| 152–159 | Foraging lookup rules and all Bog encounters |
| 160–165 | All Forest encounters |
| 166–171 | All Loch encounters |
| 172–177 | All Meadow encounters |
| 178–183 | All Mountain encounters |
| 184–187 | All Titan encounters |
| 188–193 | Social lookup rules and all Bog/Noonhill encounters |
| 194–197 | All Forest/Odoak encounters |
| 198–203 | All Loch/Newdam/Vessel encounters |
| 204–207 | All Meadow/Summit encounters |
| 208–211 | All Mountain/Spoolkeep encounters |
| 212–213 | Glasswall description and all four encounters |
| 214–220 | Notes, example and blank sheets, decorative endpapers, back cover |

## Source-derived repeated information needs

The Almanack repeatedly connects **a patient's required TAG and potency → possible reagent part → required preparation → available region/season → time/point/carry cost**. Alphabetical reagent browsing is a secondary need. TAG indexes on pp128–131 exist specifically to accelerate this reverse lookup. A candidate must show the part and preparation alongside its TAGs; showing only a reagent's aggregate TAGs loses the rule that different parts and preparations produce different properties.

Every encounter places narrative context, prompts and player choices together. Players are expressly told to read all options and choose one (pp152,188). A companion tool should expose both the event and all choices at resolution time, retain the narrative prompt, and make consequences understandable before selection. A free-text journal should remain close to the event rather than requiring a distant navigation step.

The play state required by these chapters is broader than a single ailment timer: extra ailments, countdowns with different triggers, bags with an ordered list, map changes, scoped benefits, pending deliveries, elapsed Paths/Days and character traits all recur. The operational home therefore needs visible **current objective, active conditions/timers, location, bags, next procedure step and current encounter**. Static catalogs alone cannot support the depicted play loop.

## Reagent fidelity requirements (pp126–151)

1. Preserve regular TAG potency: regular TAGs do **not** stack. FOUL and FAIR are special; they stack and cancel (p126). Displaying a sum of several weak regular TAGs as a cure would be misleading.
2. Preserve duplicate requirements instead of flattening them by TAG: Silent Service requires STOMACH 2 twice (p120); Mercy for the Mighty requires INFECTION 3 twice (p183). Separate requirement slots should remain visible; exact allocation rules are governed by the core remedy chapter.
3. Distinguish reagent type (Animal/Earth/Insect/Plant/Titan), whole reagent, gatherable part and preparation variant. Type modifies Forage/Barter bonuses (p126).
4. Show three availability states explicitly, in text as well as icons: common/in season, rare/out of season, unavailable. Region/season flags alter rarity; absence is not merely a higher difficulty. The rendered symbol legend on p126 confirms this.
5. Show part-specific season restrictions in the same candidate row. Examples: Burdock stems Spring / flowers Summer / burrs Autumn (p134), Cherry fruit Summer (p135), Cucumber flowers Spring (p136), Forget-me-not nectar Summer (p138), Oak catkins Spring / acorns Autumn (p144), Ribwort leaves Summer and Autumn (p145), White Willow catkins Summer (p150).
6. Do not clamp Base Rarity to 10: Miracle Loaf (p142) and Silver Ore (p147) are BR11, despite the introductory generalization on p126.
7. Separate AND versus OR and sequential preparation. Examples: Animal hair BOILED then USED (p132), Big Fish skin BOILED to oil then APPLIED (p133), Brambles roots CHEWED then BREWED (p134), Goosegrass seeds GROUND and BREWED (p139), Orange Peel Fungus JOY **or** ELSEWHERE (p144), Strawberry flowers BREWED **or** APPLIED (p148), Wild Violet different effects by method (p150).
8. Show required delivery context and added problems. Several FAIR/FOUL properties only affect consumed remedies (pp132,134,136,137,140,143,147). Leech adds MOOD1 (p141); Maggots add INSTINCT2 and NERVES2 (p141); Nightshade adds POISON2 (p143); Redsap adds SLEEP2 (p145); Rock Salt adds PAIN2 (p146); Sourchits adds SLEEP1 (p147); Whiskerburner adds PAIN2 (p150). These must be visible before committing a remedy.
9. Track remaining uses and refresh triggers: Concocted Calm 3 uses (p136), Firegizzard once with use regained at Move On (p138), Hidelendings 3 uses (p139), Musk Scrapings 5 uses and only one bottle gathered per Forage (p143), Sourchits 3 uses (p147).
10. Preserve special utility outside curing: Fine Sand filters all FOUL **and FAIR** from drunk remedies with conditional discard (p138); Iron Ore trades for 1 Reputation or Trinket (p140); Shells replace 3 Trinkets during Barter (p146); Silver Ore trades for 2 Reputation or 1 Trinket (p147); Whiskerburner can DISTILL any Plant part (p150); Crab Apple cooking adds PRESERVED (p136).

## Mandatory encounter lookup and resolution

### Foraging (pp152–187)

As part of Foraging, resolve a relevant Foraging Encounter. The key is **current search region + drawn rank + season when applicable**. A–8 are seasonless; 9,10,J,M use the current season. Regions have separate tables: Bog154, Forest160, Loch166, Meadow172, Mountain178, Titan184. Titan's 9–M entries are not printed with season splits and should not require nonexistent separate seasonal rows.

The event cannot be reduced to an automatic number adjustment. It can require further cards, different comparison rules (highest single card versus totals), optional expenditure, a companion, extra ailment, future effect, map edit or player interpretation. Resolution should make the specific comparison and effects legible; if a source choice remains narrative, allow its journal outcome without inventing a mechanical action.

Examples of repeating consequences and tools:

| Need | Source examples |
| --- | --- |
| Current and additional timers | Bog Fangs With Wings new ailment timer8 (157); Forest Snow timer4 (165); Meadow Cold timer6 only decreases on Forage (177); Mountain wind timer3 only decreases on Mountain Forage until Move On (183) |
| Multiple simultaneous ailments | Forest Branded Lesser Ailment must finish before Overstay (162); Loch tadpoles before highest timer ends (169); Loch swim WOUND2 before highest timer ends (167); Mountain Bear INFECTION3 twice and PAIN2 timer8 (183) |
| Local/journey/permanent benefit scopes | Bog instruction gives permanent +1FP in Bog (154); Bog repellent until Move On (155); spider follows until Move On (157); Mountain sunlight +1FP each Forage until Move On (180); Titan light +3FP after encounter until Move On (186) |
| Encounter substitutions and callbacks | Forest bear replaces Monarch events in current and adjacent locations with Scurry (162); Bog Storm Front intercepts each encounter suit until rain triggers (158); Titan gas draws after each encounter (184); Titan traps draw or charge extra time after each encounter (186) |
| Disabled Forage/access | Bog Duchy prohibits future Move/Forage there (158); Loch pike blocks Forage until Move On (168); Loch boat blocks fish until Move On (169); Mountain sheep choice blocks location until Move On (180) |
| Map and route edits | Bog bridge donation makes future passage cost no Path (154); Forest New Route adds Path (160); Beaver Dam changes Forest to Loch until after Winter (161); bear Barrow creation/removal (162); Queen Bee hive enables automatic Honey/Wax gathering (206) |
| Ordered bag loss | Bog Legacy in Mud counts down bag list by card value (156); Forest Thief does the same (163); Loch River Snatchers does the same and may spoil retrieved reagent (168) |
| Character/world history | Prior kindness to Branded prevents winter attack (165); repeat Crow Scarer enables Knowledge choice (176); repeated Bakar at new ruins advances mystery (187); treating Bear changes future bear encounters (183) |
| Path/Day/season delivery counters | Delicious Food spoils after3 marked Days (173); Meadow gifts matched by stored card suit/value and unwrap at season end (177); Mountain kite emergency travel with Reputation cost if Helping (183); memorial news delivered to home for reward (186) |
| Conditional abilities/equipment | Crossbow, Bolt, Weapon; flyer trait/familiar; cold blood; Carry; Guild Reputation thresholds; Coracle; Tent; Titan Thingamabob. These affect options, not just background character flavor (155–187). |

### Social (pp188–213)

Social Encounters are mandatory when travelling into a Settlement or City **as part of a Move**, or when Bartering for parts (p188). Look up suit against **the Settlement's Region or named City**. Heart/Diamond are region Settlement encounters but become the city-specific entries in cities. Club/Spade are seasonal encounters usable in both settlement and city. Glasswall has its own four-suit entries, with year-round biome description (pp212–213).

Avoid equating geographical region with city name: Bog→Noonhill, Forest→Odoak, Loch→Newdam **or Vessel**, Meadow→Summit, Mountain→Spoolkeep; Glasswall has bespoke entries. In particular, two Loch cities do not share their Heart/Diamond table. Table index p188 is not an accurate page locator for Glasswall; actual entries are pp212–213.

Most Social entries are rich narrative/journal prompts, some with several equally valid branches. Mechanical items are interspersed: Iris Oil NERVES2 (192); next-ailment +5FP after heron feeding (193); Odoak tool swap and custom foreign reagent purchase (195); cocoon hatches after10 Paths or Journey end (196); Newdam meal +2Carry through next Move (199); Vessel meal doubles next Move speed (201); clam barter currency expires on next marked Day (203); hive map marker (206); discounted Guild Services (208); Silver panning or contextual FP/Speed reward (211). Tools must allow custom/invented items with tags, methods, weight, page/source and expiry rather than restricting the bags to a fixed catalog.

## Barrow challenges require a distinct active procedure (pp118–125)

These are bounded tasks with bespoke timing and rewards, not ordinary patient treatment:

- Uneasy Sleep: timer4; **combined** SLEEP6 explicitly requested; success earns3×Carry trinkets and movement; failure starts a pursuer that requires at least3Paths every Move, with head start tracked until city or Journey end (118). This is an explicit exception to the general nonstacking treatment rule.
- Collapsed Entrance: accumulating FP milestones15/30/50; timer starts0 and rises per card, bonuses per card; may leave at any time; mark floor(timer/4) Days (119).
- Silent Service: timer12 and six distinct requirement slots, including STOMACH2 repeated; success grants artifact that transforms a Wild location into Titan Ruin on a Monarch, then is discarded (120).
- Inside Job: collect SLEEP4 and FOUL8; timer rises per Forage attempt; ignore normal ailment-timer modifiers; reward20 minus time; warning other Behemoths permanently costs Speed and Carry (121).
- Potent Poison: timer4 and explicit seven-reagent checklist; at0, draw and add2 per ingredient, threshold9; successful outcome permanently adds Carry1 (122).
- Pilfer Unnoticed: push-your-luck card total≤21; player can stop at any time; exact21 gives special reward; over21 can end Journey/life absent escape item (123).
- Building Trust: Moderate Ailment; success replaces Barrow with same-region Settlement and trades normal Trinket reward for Reputation; failure removes Barrow (124).
- Suitable Furnishings: five drawn Base-Rarity-matched reagents, gathered in drawn order; timer rises per Forage/Barter; tiered rewards before10/before20/after20 (125).

The UI should preserve challenge type, explicit exception, objective checklist/slots, timer trigger, outstanding choices and completion results, and should not force these into the ordinary ailment state machine.

## Character sheet and map independently observed

Both sheet PDFs define the same main hierarchy: Poulticepounder name/animal/travel style; Speed with soar distinction; Carry and thirds of load; Trinkets; ordered Bags rows with item, notes, weight and source page; Familiar name/animal/relationship/benefits/notes; Journey destination/urgency/goal; Calendar; Companion name/insect/notes; Reputation and four Guild levels (Unknown0+, Established15+, Upstanding25+, Trusted35+); preparation capability icons. The autofillable version adds Waggon and reagent-bag controls and prefilled basic-tool rows. It remains a one-page operational sheet, so these details are concurrent play references rather than separate user journeys.

The supplied Map Back shows connected Paths and Waterways, color-coded location regions, named settlements/cities and Titan Ruins. The Map Front key identifies **location type by shape** (City, Settlement, Wilds, Titan Ruins, Barrow, Clinic) separately from **region by color** (Bog, Forest, Loch, Meadow, Mountain). Map interactions must preserve both dimensions and edited history. The source includes drawn settlements, paths and waterways rather than a hex grid. Accessibility requires textual names/types/regions, since shapes/colors alone are insufficient.

Player map questions derive from play: Where am I? Which adjacent locations can I reach? What region can supply my missing part? How many Paths to my destination or nearest Settlement? Which locations have persistent effects, restrictions, hive, Clinic or Barrow? Information for these questions should accompany location selection rather than require a separate catalog search.

## Source ambiguities and extraction traps

- **p143 weight:** fitz extraction reads `11`; visual source is **two filled circles, weight2**, spanning the five named Musk bottles. Do not turn an icon extraction into numeric11.
- **p166 Shiny Object weight:** extracted text reads `Weight 11`; rendered source was checked at 2× resolution and has **two filled circles, weight2**.
- **p188 seasonal suits:** the printed sentence contains `♠ or ♠`. The actual seasonal tables have Club and Spade rows; explain any normalized Club/Spade mapping as a source correction rather than claiming the introductory sentence is correct.
- **p169 Summer Loch:** Summertime Swim and The Boat That Rocks are both printed rank10; no Jack appears. This is visually confirmed. A lookup must expose both source entries or an explicit documented interpretation, not silently discard one.
- Source spelling variants include ELSEWHERE/ELSWHERE (142), SCALE/SCALES (137), PARASITE/PARASITES (134), and Horse Chestnut chestnuts/chustnuts (126,140). Normalize search aliases without changing displayed provenance.
- Several opposed-card events have Higher/Lower outcomes without a printed tie instruction (e.g.155,157,165,185). A tool should not invent a deterministic tie outcome; permit interpretation/reroll with the source ambiguity visible.
- Introductory BR1–10 range (126) conflicts with named BR11 entries (142,147). Named entry values take precedence for lookup.
- Social index says Glasswall210, but actual Glasswall material starts212 and all suit entries are213.

## Source-derived acceptance criteria for redesign

1. From an active requirement, a player can reach candidate part, potency, actual preparation, availability and side effects in one context-preserving action.
2. The Forage/Barter procedure presents mandatory encounter and choice at the right step using current region/season/city, with source page and all narrative prompts available.
3. An active screen visibly separates ailment countdowns, encounter countdowns and calendar Days; it shows each timer's trigger/expiry.
4. Relevant scoped effects and map restrictions appear before a decision affected by them; users need not remember an effect hidden in a past journal entry.
5. Player choice is retained for ambiguous/multibranch outcomes. An automatic effect never silently chooses a narrative option or ignores a printed special rule.
6. Bags retain part, preparation possibilities, quantity, fractional weight, use count, custom utility, expiry and source page; ordered-loss events are reproducible.
7. Journey movement exposes current/destination location, Path count, region, Settlement/City triggers, and time/temporary-bonus consequences together.
8. Desktop can show context and procedure simultaneously; mobile prioritizes objective and next action while retaining immediate access to bags/rules. References do not require losing active encounter state.
9. Fast rule access includes direct TAG lookup, relevant procedure rule and original-source page, with search aliases for print inconsistencies.
10. Verification should walk real cases: ordinary Forage with seasonal event; Barter in Vessel/Newdam; multi-ailment countdown; part-season restriction; regular TAG nonstacking and FOUL/FAIR; consumable uses; map region conversion; push-your-luck Barrow challenge; custom reagent/expired item; printed ambiguity.
