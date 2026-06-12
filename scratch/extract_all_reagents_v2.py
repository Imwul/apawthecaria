import fitz # PyMuPDF
import json
import re

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

extracted_data = {}
all_names_found = []

# Loop over pages 126 to 151 (0-indexed 125 to 150)
for idx in range(125, 151):
    page = doc[idx]
    spans = []
    blocks = page.get_text("dict")["blocks"]
    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                for s in l["spans"]:
                    spans.append(s)
                    
    # Find all "br " spans
    br_spans = []
    for s in spans:
        t = s["text"].strip()
        if t.startswith("br ") or (t.isdigit() and len(t) == 1 and s["font"].endswith("Bold") and s["size"] > 11):
            br_spans.append(s)
            
    cleaned_br_spans = []
    for s in br_spans:
        t = s["text"].strip()
        if t.startswith("br "):
            cleaned_br_spans.append(s)
        elif t.isdigit():
            s_x = (s["bbox"][0] + s["bbox"][2]) / 2
            s_y = (s["bbox"][1] + s["bbox"][3]) / 2
            has_br = False
            for os in spans:
                if os["text"].strip() == "br":
                    os_x = (os["bbox"][0] + os["bbox"][2]) / 2
                    os_y = (os["bbox"][1] + os["bbox"][3]) / 2
                    if abs(os_y - s_y) < 5 and abs(os_x - s_x) < 20:
                        has_br = True
                        break
            if has_br:
                cleaned_br_spans.append(s)

    for br in cleaned_br_spans:
        br_x = (br["bbox"][0] + br["bbox"][2]) / 2
        br_y = (br["bbox"][1] + br["bbox"][3]) / 2
        is_left = br_x < 280
        
        # 1. Find the reagent name span above br_y in the same column
        candidate_names = []
        for s in spans:
            s_x = (s["bbox"][0] + s["bbox"][2]) / 2
            s_y = (s["bbox"][1] + s["bbox"][3]) / 2
            
            # Skip icon spans
            if "ApawthecariaIcons" in s["font"]:
                continue
                
            # Check column
            s_left = s_x < 280
            if s_left != is_left:
                continue
                
            # Check position (above br_y)
            if s_y >= br_y:
                continue
                
            t = s["text"].strip()
            # Must not be numbers, types, or br
            if not t or t.isdigit() or t.startswith("br ") or t == "br":
                continue
            if t.lower() in ["plant", "animal", "insect", "earth", "titan", "fungus", "foraged"]:
                continue
                
            # Check if it looks like a header (font size, style, etc.)
            is_header_font = "Bold" in s["font"] or "ExtraBold" in s["font"] or "Spirit" in s["font"] or s["size"] > 11.5
            if is_header_font:
                candidate_names.append((s_y, t, s))
        
        # Sort candidate names by y descending (closest to br_y from above)
        candidate_names.sort(key=lambda x: x[0], reverse=True)
        
        reagent_name = None
        if candidate_names:
            reagent_name = candidate_names[0][1]
            reagent_name = reagent_name.replace("’s", "").replace("'s", "").strip()
            if reagent_name.startswith("The Bristley Woods") or "Remedies" in reagent_name:
                reagent_name = None
        
        if not reagent_name:
            continue
            
        # 2. Extract available regions and seasons
        row_icon_spans = []
        for s in spans:
            if "ApawthecariaIcons" in s["font"]:
                s_x = (s["bbox"][0] + s["bbox"][2]) / 2
                s_y = (s["bbox"][1] + s["bbox"][3]) / 2
                
                # y within 15 points
                if abs(br_y - s_y) < 15:
                    # same column
                    s_left = s_x < 280
                    if s_left == is_left:
                        row_icon_spans.append(s)
                        
        row_icon_spans.sort(key=lambda x: x["bbox"][0])
        
        regions = []
        seasons = []
        for s in row_icon_spans:
            for char in s["text"]:
                if char in "bflgmtpsaw":
                    is_av = "Av-Reg" in s["font"] or "Av-Regu" in s["font"]
                    if is_av:
                        if char in reg_map:
                            regions.append(reg_map[char])
                        elif char in season_map:
                            seasons.append(season_map[char])
                            
        # Store using a clean lowercase key to avoid matching issues
        key = reagent_name.lower().replace("-", " ").replace("’", "").replace("'", "")
        # Remove any leading/trailing garbage
        key = re.sub(r'^\W+|\W+$', '', key)
        
        extracted_data[key] = {
            "name": reagent_name,
            "regions": regions,
            "seasons": seasons,
            "page": idx + 1
        }
        all_names_found.append(reagent_name)

print(f"Extracted {len(extracted_data)} reagents.")
print("Names:", sorted(list(extracted_data.keys())))

with open("extracted_reagents_v2.json", "w", encoding="utf-8") as out_f:
    json.dump(extracted_data, out_f, indent=2, ensure_ascii=False)
