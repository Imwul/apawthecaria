import json
import re

with open("parsed_game_reagents.json", "r", encoding="utf-8") as f:
    game_reagents = json.load(f)

with open("extracted_reagents_v2.json", "r", encoding="utf-8") as f:
    extracted = json.load(f)

def normalize_name(name):
    n = name.lower().replace("-", " ").replace("’", "").replace("'", "")
    n = re.sub(r'^\W+|\W+$', '', n)
    return n

# Custom overrides for matching
overrides = {
    "can only be foraged for in summer frog slime": "frog slime",
    "trinket ironslug": "ironslug",
    "can only be foraged for in summer wild garlic": "wild garlic"
}

matched_count = 0
not_matched = []

for r in game_reagents:
    raw_name = r.get("rawName")
    if not raw_name:
        print("No rawName for:", r.get("name"))
        continue
        
    norm = normalize_name(raw_name)
    if norm in overrides:
        norm = overrides[norm]
        
    if norm in extracted:
        matched_count += 1
    else:
        not_matched.append((raw_name, norm))

print(f"Matched {matched_count} / {len(game_reagents)} reagents.")
if not_matched:
    print("Not matched:")
    for raw, norm in not_matched:
        print(f"  raw: '{raw}' -> normalized: '{norm}'")
