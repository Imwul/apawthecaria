import fitz # PyMuPDF
import json
import re

doc = fitz.open("Apawthecaria v1.3.pdf")

# We already know where reagents are based on names.
# Let's extract the clean text from PDF pages 126 to 151 (0-indexed 125 to 150)
# and reconstruct the preparation lines.
# We will write a script that processes each page and extracts the text blocks.

with open("parsed_game_reagents.json", "r", encoding="utf-8") as f:
    game_reagents = json.load(f)

# Let's create a map of reagent rawNames
reagent_names = [r["rawName"] for r in game_reagents]

# Normalize names for search
def normalize_name(name):
    n = name.lower().replace("-", " ").replace("’", "").replace("'", "")
    n = re.sub(r'^\W+|\W+$', '', n)
    return n

reagent_norm_names = {normalize_name(name): name for name in reagent_names}

# We also want to find which page each reagent is on
reagent_pages = {}
with open("extracted_reagents_v2.json", "r", encoding="utf-8") as f:
    v2_data = json.load(f)
for k, v in v2_data.items():
    reagent_pages[v["name"]] = v["page"]

# We will group reagents by page
reagents_by_page = {}
for name, page in reagent_pages.items():
    reagents_by_page.setdefault(page, []).append(name)

# Now, for each page, we sort reagents by their y-coordinate
page_reagents_sorted = {}
for page_num, r_names in reagents_by_page.items():
    page_idx = page_num - 1
    page = doc[page_idx]
    spans = []
    blocks = page.get_text("dict")["blocks"]
    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                for s in l["spans"]:
                    spans.append(s)
                    
    # Find y coordinate for each reagent
    r_coords = []
    for r_name in r_names:
        norm = normalize_name(r_name)
        # Find closest header span
        best_y = 9999
        best_x = 0
        for s in spans:
            if "ApawthecariaIcons" in s["font"]: continue
            t = s["text"].strip().lower().replace("-", " ").replace("'", "").replace("’", "")
            if t == norm or norm in t:
                s_y = (s["bbox"][1] + s["bbox"][3]) / 2
                s_x = (s["bbox"][0] + s["bbox"][2]) / 2
                if s_y < best_y:
                    best_y = s_y
                    best_x = s_x
        r_coords.append((r_name, best_y, best_x))
    
    # Sort by y, then x (to handle two columns)
    # Column 1 (x < 280) and Column 2 (x >= 280)
    # We sort: Left Column first (sorted by y), then Right Column (sorted by y)
    left_col = sorted([rc for rc in r_coords if rc[2] < 280], key=lambda x: x[1])
    right_col = sorted([rc for rc in r_coords if rc[2] >= 280], key=lambda x: x[1])
    page_reagents_sorted[page_num] = left_col + right_col

# Let's write a custom extractor that collects the text for each reagent
clean_preps = {}

for page_num, r_coords in page_reagents_sorted.items():
    page_idx = page_num - 1
    page = doc[page_idx]
    
    # Collect all spans with their column and y coords
    spans = []
    blocks = page.get_text("dict")["blocks"]
    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                for s in l["spans"]:
                    # center x and y
                    cx = (s["bbox"][0] + s["bbox"][2]) / 2
                    cy = (s["bbox"][1] + s["bbox"][3]) / 2
                    spans.append((cy, cx, s))
                    
    # For each reagent, its text block lies between its y-coordinate and the next reagent's y-coordinate
    # in the same column!
    for i, (r_name, r_y, r_x) in enumerate(r_coords):
        is_left = r_x < 280
        
        # Next reagent in same column
        next_r_y = 9999
        for (nr_name, nr_y, nr_x) in r_coords:
            nr_left = nr_x < 280
            if nr_left == is_left and nr_y > r_y:
                if nr_y < next_r_y:
                    next_r_y = nr_y
                    
        # Collect all spans for this reagent
        r_spans = []
        for cy, cx, s in spans:
            s_left = cx < 280
            if s_left == is_left and cy > r_y and cy < next_r_y:
                if "ApawthecariaIcons" not in s["font"]:
                    r_spans.append((cy, cx, s))
                    
        # Sort spans by y, then x
        r_spans.sort(key=lambda x: (x[0], x[1]))
        
        # Join spans into lines based on y proximity
        lines = []
        current_line = []
        last_y = -999
        for cy, cx, s in r_spans:
            if last_y == -999 or abs(cy - last_y) < 5:
                current_line.append(s["text"])
            else:
                lines.append(" ".join(current_line))
                current_line = [s["text"]]
            last_y = cy
        if current_line:
            lines.append(" ".join(current_line))
            
        # Filter lines to get only preparation lines
        # Preparation lines start with ⅓, ⅔, 1 or have capitalized methods (GROUND, COOKED, etc.)
        prep_lines = []
        for line in lines:
            t = line.strip()
            # Clean up double spaces
            t = re.sub(r'\s+', ' ', t)
            if any(t.startswith(c) for c in ["⅓", "⅔", "1", "2"]) or any(m in t for m in ["GROUND", "COOKED", "BREWED", "USED", "ADDED", "BOILED", "APPLIED", "CRUSHED", "DISTILLED", "CHEWED", "DIGESTED"]):
                # Skip numeric lines that are just page references
                if re.match(r'^\d+\s+\d+$', t) or re.match(r'^\d+\s+[a-zA-Z\s]+\s+\d+\s+\d+$', t):
                    continue
                prep_lines.append(t)
                
        # Join prep lines
        clean_preps[r_name] = " ".join(prep_lines)

# Let's inspect some results
for name in ["Animal Sheddings", "Beech", "Beehive", "Beetles", "Behemoth Bits", "Big Fish", "Birch Polypore"]:
    print(f"\n{name}:")
    print(f"  New preps: '{clean_preps.get(name, 'NOT FOUND')}'")

with open("clean_preps_mapping.json", "w", encoding="utf-8") as f:
    json.dump(clean_preps, f, indent=2, ensure_ascii=False)
