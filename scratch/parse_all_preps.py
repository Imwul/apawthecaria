import json
import re

with open("extracted_reagents.json", "r", encoding="utf-8") as f:
    reagents = json.load(f)

# Expanded list of preparation keywords
methods = ["GROUND", "COOKED", "BREWED", "USED", "ADDED", "BOILED", "APPLIED", "CRUSHED", "DISTILLED", "CHEWED", "DIGESTED"]

parsed_map = {}

# Custom cleanup for known typos or missing things in raw preps
def clean_preps_string(name, preps_str):
    preps_str = preps_str or ""
    if name == "Beehive":
        preps_str += " consumed remedies for [FAIR 4]"
    elif name == "Animal Sheddings":
        preps_str += " Sweat BOILED and then APPLIED for [FEATHER 1]"
    elif name == "Big Fish":
        preps_str += " Skin BOILED for oil, which is APPLIED for [HIDE 2]"
    elif name == "Birch Polypore":
        preps_str = preps_str.replace("as", "[WOUND 1]")
    elif name == "Butterfly":
        preps_str += " APPLIED to forehead for [NERVES 3]"
    elif name == "Cherry Trees":
        preps_str = preps_str.replace("and", "[MOOD 2]")
    elif name == "Chillies":
        preps_str += " BOILED for [TEMPERATURE 3]"
    elif name == "Cucumbers":
        preps_str += " USED in consumed remedies for [FAIR 1]"
    elif name == "Leech":
        preps_str = "⅔ Leech GROUND into paste for [INFECTION 2] and [WOUND 2]"
    return preps_str

for r in reagents:
    name = r["name"]
    preps_str = r.get("preps", "")
    preps_str = clean_preps_string(name, preps_str)
    
    parts = re.split(r'(?=⅓|⅔|1\s|2\s)', preps_str)
    parts = [p.strip() for p in parts if p.strip()]
    
    mappings = []
    for part in parts:
        # Check if part has any tags in brackets
        tags = re.findall(r'\[([A-Z_]+)\s+(\d+)\]', part, re.IGNORECASE)
        if not tags:
            continue
            
        # Extract part name
        part_name = "Unknown"
        part_name_match = re.match(r'^(?:⅓|⅔|1|2)?\s*([a-zA-Z\s\-]+?)\s*\b(?:GROUND|COOKED|BREWED|USED|ADDED|CONSUMED|BOILED|APPLIED|CRUSHED|DISTILLED|CHEWED|DIGESTED)\b', part, re.IGNORECASE)
        if part_name_match:
            part_name = part_name_match.group(1).strip()
            
        # Find positions of all prep keywords in the part
        prep_positions = []
        for method in methods:
            for match in re.finditer(r'\b' + method + r'\b', part, re.IGNORECASE):
                prep_positions.append((match.start(), method.upper()))
        
        # Sort positions
        prep_positions.sort(key=lambda x: x[0])
        
        # If no prep keywords found, default to USED
        if not prep_positions:
            prep_positions.append((0, "USED"))
            
        # Divide part into segments for each prep method
        segments = []
        for i in range(len(prep_positions)):
            start_pos, method = prep_positions[i]
            end_pos = prep_positions[i+1][0] if i + 1 < len(prep_positions) else len(part)
            segment_text = part[start_pos:end_pos]
            segments.append((method, segment_text))
            
        for method, seg_text in segments:
            # Map "USED in consumed remedies" to "CONSUMED"
            if method == "USED" and "consumed" in seg_text.lower():
                method = "CONSUMED"
                
            # Find all tags in this segment
            seg_tags = re.findall(r'\[([A-Z_]+)\s+(\d+)\]', seg_text, re.IGNORECASE)
            for tag, val in seg_tags:
                mappings.append({
                    "part": part_name,
                    "prep": method,
                    "tag": tag.upper(),
                    "val": int(val)
                })
            
    parsed_map[name] = mappings

print(f"Parsed mappings for {len(parsed_map)} reagents.")
print("Example (Beehive):", json.dumps(parsed_map.get("Beehive"), indent=2))
print("Example (Beech):", json.dumps(parsed_map.get("Beech"), indent=2))

with open("parsed_preps_list.json", "w", encoding="utf-8") as out_f:
    json.dump(parsed_map, out_f, indent=2, ensure_ascii=False)
