import json

with open("extracted_reagent_availabilities.json", "r", encoding="utf-8") as f:
    avail = json.load(f)

with open("parsed_game_reagents.json", "r", encoding="utf-8") as f:
    game_reagents = json.load(f)

print(f"Total game reagents: {len(game_reagents)}")
print(f"Total extracted: {len(avail)}")

missing = []
fallbacks = []
empty = []

for r in game_reagents:
    raw_name = r.get("rawName")
    if not raw_name:
        print("Reagent without rawName:", r.get("name"))
        continue
    
    if raw_name not in avail:
        missing.append(raw_name)
    else:
        info = avail[raw_name]
        if info.get("fallback"):
            fallbacks.append((raw_name, info))
        if not info["regions"] and not info["seasons"]:
            empty.append((raw_name, info))

print("\n--- Missing Reagents ---")
print(missing)

print("\n--- Fallback Reagents ---")
for name, info in fallbacks[:10]:
    print(f"{name}: page {info['page']}, regions={info['regions']}, seasons={info['seasons']}")

print("\n--- Empty Reagents ---")
for name, info in empty[:10]:
    print(f"{name}: page {info['page']}")
