import re
import json

# 1. Load extracted availabilities
with open("extracted_reagents_v2.json", "r", encoding="utf-8") as f:
    extracted = json.load(f)

# 2. Read src/gameData.ts
with open("src/gameData.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 3. Locate reagents array using brace depth scanner
start_match = re.search(r'"reagents"\s*:\s*\[', content)
if not start_match:
    start_match = re.search(r'reagents\s*:\s*\[', content)

if not start_match:
    print("Could not find reagents list start in gameData.ts")
    exit(1)

start_idx = start_match.end() - 1  # includes the '['
depth = 0
end_idx = -1
for idx in range(start_idx, len(content)):
    char = content[idx]
    if char == '[':
        depth += 1
    elif char == ']':
        depth -= 1
        if depth == 0:
            end_idx = idx + 1
            break

if end_idx == -1:
    print("Could not find matching closing bracket for reagents array.")
    exit(1)

reagents_str = content[start_idx:end_idx]

# Parse the reagents list using JSON loader by cleaning trailing commas
reagents_str_clean = re.sub(r',\s*\]', ']', reagents_str)
reagents_str_clean = re.sub(r',\s*\}', '}', reagents_str_clean)
reagents = json.loads(reagents_str_clean)

print(f"Loaded {len(reagents)} reagents from gameData.ts")

# Custom overrides for matching
overrides = {
    "can only be foraged for in summer frog slime": "frog slime",
    "trinket ironslug": "ironslug",
    "can only be foraged for in summer wild garlic": "wild garlic"
}

def normalize_name(name):
    n = name.lower().replace("-", " ").replace("’", "").replace("'", "")
    n = re.sub(r'^\W+|\W+$', '', n)
    return n

# 4. Update regions and seasons
updated_count = 0
for r in reagents:
    raw_name = r.get("rawName")
    if not raw_name:
        continue
    
    norm = normalize_name(raw_name)
    if norm in overrides:
        norm = overrides[norm]
        
    if norm in extracted:
        old_regions = r.get("regions", [])
        old_seasons = r.get("seasons", [])
        new_regions = extracted[norm]["regions"]
        new_seasons = extracted[norm]["seasons"]
        
        # In the app, regions/seasons are in English like Bog, Forest, Spring, etc.
        # Let's make sure they are exactly matching the English names.
        r["regions"] = new_regions
        r["seasons"] = new_seasons
        updated_count += 1
    else:
        print(f"Warning: No extracted availability found for '{raw_name}'")

print(f"Updated regions/seasons for {updated_count} reagents.")

# 5. Format the updated reagents list as TS-friendly JSON
# Indent with 6 spaces to match the nested indentation in gameData.ts
updated_reagents_str = json.dumps(reagents, indent=4, ensure_ascii=False)

# Format indentations to match gameData.ts (which is nested inside GAME_DATA = { "reagents": [...] })
# Let's check how reagents list is formatted: it is nested, usually indented.
# We can just replace the old block with this formatted JSON string.
new_content = content[:start_idx] + updated_reagents_str + content[end_idx:]

with open("src/gameData.new.ts", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Dry run written to src/gameData.new.ts")
