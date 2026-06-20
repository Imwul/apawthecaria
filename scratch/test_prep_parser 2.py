import json
import re

with open("extracted_reagents.json", "r", encoding="utf-8") as f:
    reagents = json.load(f)

# Regex to find uppercase prep methods and targets
# e.g., "GROUND for [HIDE 2]" or "USED in consumed remedies for [FAIR 4]"
prep_pattern = re.compile(
    r'\b(GROUND|COOKED|BREWED|USED|ADDED|CONSUMED|BOILED|APPLIED|CRUSHED|DISTILLED|CHEWED|DIGESTED)\b.*?(?:for\s+|in\s+consumed\s+remedies\s+for\s+)?\[([A-Z_]+)\s+(\d+)\]',
    re.IGNORECASE
)

# We want to see how it matches for all reagents
for r in reagents[:10]:
    preps_str = r.get("preps", "")
    print(f"\nReagent: {r['name']}")
    print(f"  Raw preps: '{preps_str}'")
    
    # Split by part first
    # e.g., "⅓ Shells GROUND for [HIDE 2] ⅓ Nuts USED..."
    parts = re.split(r'(?=⅓|⅔|1\s)', preps_str)
    parts = [p.strip() for p in parts if p.strip()]
    
    for part in parts:
        # Extract part name
        # e.g. "⅓ Shells GROUND for [HIDE 2]" -> "Shells"
        part_name_match = re.match(r'^(?:⅓|⅔|1\s)?\s*([a-zA-Z\s]+?)\s*\b(?:GROUND|COOKED|BREWED|USED|ADDED|CONSUMED|BOILED|APPLIED|CRUSHED|DISTILLED|CHEWED|DIGESTED)\b', part)
        part_name = part_name_match.group(1).strip() if part_name_match else "Unknown Part"
        
        print(f"    Part: '{part_name}' (from '{part}')")
        
        # Find all matches in this part
        # We need to find all prep method -> effect mappings
        matches = re.finditer(r'\b(GROUND|COOKED|BREWED|USED|ADDED|CONSUMED|BOILED|APPLIED|CRUSHED|DISTILLED|CHEWED|DIGESTED)\b.*?(?:for\s+|in\s+consumed\s+remedies\s+for\s+)?\[([A-Z_]+)\s+(\d+)\]', part, re.IGNORECASE)
        for m in matches:
            method = m.group(1).upper()
            tag = m.group(2).upper()
            val = m.group(3)
            
            # Map "USED in consumed remedies" to "CONSUMED"
            if method == "USED" and "consumed" in m.group(0).lower():
                method = "CONSUMED"
                
            print(f"      -> {method} → {tag} {val}")
