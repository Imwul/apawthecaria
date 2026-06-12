import json
import re

with open("parsed_game_reagents.json", "r", encoding="utf-8") as f:
    game_reagents = json.load(f)

with open("extracted_reagents.json", "r", encoding="utf-8") as f:
    rulebook_reagents = json.load(f)

print(f"Total game reagents: {len(game_reagents)}")
print(f"Total rulebook reagents: {len(rulebook_reagents)}")

rulebook_map = {r["name"].lower(): r for r in rulebook_reagents}

# Also support rawName match
rulebook_raw_map = {r["name"].lower().replace("-", " ").replace("'", ""): r for r in rulebook_reagents}

def normalize_name(name):
    n = name.lower().replace("-", " ").replace("’", "").replace("'", "")
    n = re.sub(r'^\W+|\W+$', '', n)
    return n

overrides = {
    "can only be foraged for in summer frog slime": "frog slime",
    "trinket ironslug": "ironslug",
    "can only be foraged for in summer wild garlic": "wild garlic"
}

matched = 0
not_matched = []

for r in game_reagents:
    raw_name = r.get("rawName")
    if not raw_name:
        continue
    
    norm = normalize_name(raw_name)
    if norm in overrides:
        norm = overrides[norm]
        
    # Check if norm in rulebook_map or rulebook_raw_map
    match_r = None
    if norm in rulebook_map:
        match_r = rulebook_map[norm]
    elif norm in rulebook_raw_map:
        match_r = rulebook_raw_map[norm]
    else:
        # try word match
        for k, v in rulebook_map.items():
            if norm in k or k in norm:
                match_r = v
                break
                
    if match_r:
        matched += 1
    else:
        not_matched.append(raw_name)

print(f"Matched {matched} / {len(game_reagents)}")
if not_matched:
    print("Not matched:", not_matched)
