# Ruleset Matrix

## Defaults and migration

| Situation | Ruleset | Reason |
|---|---|---|
| New game | `original-1e-3p` | Edition-faithful baseline |
| Existing save without metadata | `legacy-campaign` | Preserve previous app behavior without resetting the save |
| Explicit recovery/testing mode | `sandbox` | Keep compatibility behavior and allow recovery tooling |

All switches live in `src/rules/rulesets.ts`. UI handlers ask the central rules functions whether a feature is enabled; they do not compare ruleset IDs directly.

## Feature matrix

| Rule or feature | `original-1e-3p` | `legacy-campaign` | `sandbox` |
|---|:---:|:---:|:---:|
| Familiar trust scaling beyond printed benefit | Off | On | On |
| Legacy succession campaign system | Off | On | On |
| Journey completion +5/-3 Reputation | Off | On | On |
| Brewing time per selected ingredient | Off | On | On |
| Administer incomplete Remedy | Off | On | On |
| Direct Make Do/Replacement item generation | Off | On | On |
| Companion-granted flight/water permissions | Off | On | On |
| Manual Season change | Off | On | On |
| Free Delve cancellation | Off | On | On |
| Recovery tools | Off | Off | On |

## Behavioral notes

- `original-1e-3p` disables app-originated House Rules by default. It does not imply that every original special effect is already automated.
- `legacy-campaign` is the compatibility target for saves created before ruleset metadata existed.
- `sandbox` currently shares the legacy House Rule set and additionally permits recovery tools. It is intended for repair, inspection, and unconstrained play rather than rules-faithful adjudication.
- Changing a ruleset does not rewrite journals, inventory, maps, or historical outcomes.
