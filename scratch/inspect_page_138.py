import fitz # PyMuPDF

doc = fitz.open("Apawthecaria v1.3.pdf")
page = doc[137] # page 138 is index 137

# Let's get all spans on the page
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

print(f"Found {len(br_spans)} br spans:")
for br in br_spans:
    br_x = (br["bbox"][0] + br["bbox"][2]) / 2
    br_y = (br["bbox"][1] + br["bbox"][3]) / 2 # center y
    is_left = br_x < 280
    col_str = "Left Column" if is_left else "Right Column"
    
    # Let's find the header above it
    candidate_names = []
    for s in spans:
        s_x = (s["bbox"][0] + s["bbox"][2]) / 2
        s_y = (s["bbox"][1] + s["bbox"][3]) / 2
        if "ApawthecariaIcons" in s["font"]: continue
        s_left = s_x < 280
        if s_left != is_left: continue
        if s_y >= br_y: continue
        t = s["text"].strip()
        if not t or t.isdigit() or t.startswith("br ") or t == "br": continue
        if t.lower() in ["plant", "animal", "insect", "earth", "titan", "fungus", "foraged"]: continue
        if "Bold" in s["font"] or "ExtraBold" in s["font"] or "Spirit" in s["font"] or s["size"] > 11.5:
            candidate_names.append((s_y, t))
    
    candidate_names.sort(key=lambda x: x[0], reverse=True)
    name = candidate_names[0][1] if candidate_names else "Unknown"
    
    print(f"\nReagent: '{name}' at y={br_y:.2f}, x={br_x:.2f} ({col_str})")
    
    # Find matching icon spans
    row_icon_spans = []
    for s in spans:
        if "ApawthecariaIcons" in s["font"]:
            s_x = (s["bbox"][0] + s["bbox"][2]) / 2
            s_y = (s["bbox"][1] + s["bbox"][3]) / 2
            if abs(br_y - s_y) < 15:
                if (is_left and s_x < 280) or (not is_left and s_x >= 280):
                    row_icon_spans.append(s)
    
    row_icon_spans.sort(key=lambda x: x["bbox"][0])
    
    chars = []
    avail = []
    for s in row_icon_spans:
        for char in s["text"]:
            if char in "bflgmtpsaw":
                chars.append(char)
                is_av = "Av-Reg" in s["font"] or "Av-Regu" in s["font"]
                if is_av:
                    avail.append(char)
    print("  Icon characters in order:", "".join(chars))
    print("  Available characters:", "".join(avail))
