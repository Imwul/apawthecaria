import fitz # PyMuPDF
import json

doc = fitz.open("Apawthecaria v1.3.pdf")

# Map of chars to names
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

results = []

# Reagents are on pages 126 to 151 (PDF pages 125 to 151, i.e., index 125 to 150)
for idx in range(125, 151):
    page = doc[idx]
    blocks = page.get_text("dict")["blocks"]
    
    # We want to find each reagent's name and its bflgmtpsaw availability.
    # A reagent entry starts with a header block (usually Nunito-ExtraBold or similar)
    # followed by "plant/animal/insect/earth/titan", "br X", and the icons.
    # Let's collect all lines with their spans to process.
    lines_with_spans = []
    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                lines_with_spans.append(l["spans"])

    # Let's find spans that have 'bflgmtpsaw' characters or 'br' text.
    # Since PyMuPDF can split the spans, we can reconstruct the line.
    for i, line_spans in enumerate(lines_with_spans):
        line_text = "".join(s["text"] for s in line_spans)
        if "br" in line_text and any(c in line_text for c in "bflgmtpsaw"):
            # This line contains the availability! Let's extract availability.
            # We need to find the name of the reagent. Usually it is on a preceding line.
            # Let's search backwards for the reagent name.
            reagent_name = None
            for j in range(i - 1, -1, -1):
                prev_text = "".join(s["text"] for s in lines_with_spans[j]).strip()
                if prev_text in ["plant", "animal", "insect", "earth", "titan", "fungus"]:
                    # The name is likely the line before this type line!
                    if j - 1 >= 0:
                        reagent_name = "".join(s["text"] for s in lines_with_spans[j - 1]).strip()
                    break
            
            if not reagent_name:
                # Fallback: just look at immediate previous lines
                for j in range(max(0, i-3), i):
                    t = "".join(s["text"] for s in lines_with_spans[j]).strip()
                    if t and t not in ["plant", "animal", "insect", "earth", "titan", "fungus"] and not t.startswith("br "):
                        reagent_name = t
            
            # Extract availability based on font name in the spans
            avail_regions = []
            avail_seasons = []
            
            # Let's collect the characters and their fonts from all spans in this line
            chars_with_fonts = []
            for s in line_spans:
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
            
            results.append({
                "pdf_page": idx + 1,
                "reagent_name": reagent_name,
                "regions": avail_regions,
                "seasons": avail_seasons,
                "line_text": line_text
            })

print(f"Extracted {len(results)} reagents.")
print(json.dumps(results[:5], indent=2, ensure_ascii=False))

with open("extracted_availabilities.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
