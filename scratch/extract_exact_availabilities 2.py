import fitz # PyMuPDF
import json
import re

# Load the reagents from gameData.ts
with open("parsed_game_reagents.json", "r", encoding="utf-8") as f:
    game_reagents = json.load(f)

doc = fitz.open("Apawthecaria v1.3.pdf")

reg_map = {
    'b': 'Bog',
    'f': 'Forest',
    'l': 'Loch',
    'g': 'Meadow',
    'm': 'Mountain',
    't': 'Titan'
}
season_map = {
    'p': 'Spring',
    's': 'Summer',
    'a': 'Autumn',
    'w': 'Winter'
}

mapping = {}
not_found = []

# Search range: pages 126 to 151 (0-indexed 125 to 150)
for r in game_reagents:
    raw_name = r.get("rawName")
    if not raw_name:
        continue
    
    # We want to find the page for this reagent
    found_page = None
    avail_line_spans = None
    
    # Clean up name for searching
    search_name = raw_name.replace("'", "").replace("-", " ")
    
    for idx in range(125, 151):
        page = doc[idx]
        blocks = page.get_text("dict")["blocks"]
        
        # Check if the reagent name is in this page's text
        page_text = page.get_text()
        
        # We need a robust search since names might be slightly different
        # Let's match by words
        words_search = set(re.findall(r'\b\w+\b', search_name.lower()))
        words_page = set(re.findall(r'\b\w+\b', page_text.lower()))
        
        # If all/most words in search_name are on the page
        if words_search.issubset(words_page) or raw_name.lower() in page_text.lower():
            # Now find the specific block/line for this reagent and its availability
            # In Apawthecaria, there are multiple reagents per page.
            # We must find the correct header block and then the nearest availability line AFTER it.
            lines = []
            for b in blocks:
                if "lines" in b:
                    for l in b["lines"]:
                        lines.append(l)
            
            # Find the line containing the reagent name
            name_line_idx = -1
            for l_idx, line in enumerate(lines):
                line_text = "".join(s["text"] for s in line["spans"])
                if raw_name.lower() in line_text.lower():
                    name_line_idx = l_idx
                    break
            
            if name_line_idx == -1:
                # If exact raw_name isn't found in a single line, try matching search_name words
                for l_idx, line in enumerate(lines):
                    line_text = "".join(s["text"] for s in line["spans"])
                    if all(w in line_text.lower() for w in words_search):
                        name_line_idx = l_idx
                        break
            
            if name_line_idx != -1:
                # Now find the availability line (having "br X" or "bflgmtpsaw" elements) AFTER this name line
                for l_idx in range(name_line_idx, len(lines)):
                    line = lines[l_idx]
                    line_text = "".join(s["text"] for s in line["spans"])
                    if "br " in line_text and any(c in line_text for c in "bflgmtpsaw"):
                        found_page = idx + 1
                        avail_line_spans = line["spans"]
                        break
            
            if found_page:
                break
                
    if found_page and avail_line_spans:
        avail_regions = []
        avail_seasons = []
        
        # Collect characters and fonts
        chars_with_fonts = []
        for s in avail_line_spans:
            for char in s["text"]:
                if char in "bflgmtpsaw":
                    chars_with_fonts.append((char, s["font"]))
        
        for char, font in chars_with_fonts:
            is_available = "Av-Reg" in font or "Av-Regu" in font
            if is_available:
                if char in reg_map:
                    avail_regions.append(reg_map[char])
                elif char in season_map:
                    avail_seasons.append(season_map[char])
        
        mapping[raw_name] = {
            "regions": avail_regions,
            "seasons": avail_seasons,
            "page": found_page
        }
    else:
        # Fallback search if the structured block matching failed
        # Just find the page containing the name, and use the first availability line on that page
        # which might be correct if it's the only reagent, or we print to inspect.
        for idx in range(125, 151):
            page = doc[idx]
            page_text = page.get_text()
            if raw_name.lower() in page_text.lower():
                # Just find the first "br " line on this page
                blocks = page.get_text("dict")["blocks"]
                for b in blocks:
                    if "lines" in b:
                        for l in b["lines"]:
                            line_text = "".join(s["text"] for s in l["spans"])
                            if "br " in line_text and any(c in line_text for c in "bflgmtpsaw"):
                                avail_regions = []
                                avail_seasons = []
                                for s in l["spans"]:
                                    for char in s["text"]:
                                        if char in "bflgmtpsaw":
                                            if "Av-Reg" in s["font"] or "Av-Regu" in s["font"]:
                                                if char in reg_map:
                                                    avail_regions.append(reg_map[char])
                                                elif char in season_map:
                                                    avail_seasons.append(season_map[char])
                                mapping[raw_name] = {
                                    "regions": avail_regions,
                                    "seasons": avail_seasons,
                                    "page": idx + 1,
                                    "fallback": True
                                }
                                found_page = idx + 1
                                break
                    if found_page:
                        break
            if found_page:
                break
        
        if not found_page:
            not_found.append(raw_name)

print(f"Extracted {len(mapping)} reagents. {len(not_found)} not found.")
if not_found:
    print("Not found reagents:", not_found)

with open("extracted_reagent_availabilities.json", "w", encoding="utf-8") as out_f:
    json.dump(mapping, out_f, indent=2, ensure_ascii=False)
