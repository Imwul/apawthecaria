import fitz # PyMuPDF

doc = fitz.open("Apawthecaria v1.3.pdf")
page = doc[133] # page 134

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
    if s["text"].strip().startswith("br "):
        br_spans.append(s)

print(f"Found {len(br_spans)} br spans:")
for br in br_spans:
    br_x = (br["bbox"][0] + br["bbox"][2]) / 2
    br_y = (br["bbox"][1] + br["bbox"][3]) / 2 # center y
    is_left = br_x < 280
    col_str = "Left Column" if is_left else "Right Column"
    
    print(f"\nReagent row: '{br['text']}' at y={br_y:.2f}, x={br_x:.2f} ({col_str})")
    
    # Find matching icon spans (y within 15 points and same column)
    row_icon_spans = []
    for s in spans:
        if "ApawthecariaIcons" in s["font"]:
            s_x = (s["bbox"][0] + s["bbox"][2]) / 2
            s_y = (s["bbox"][1] + s["bbox"][3]) / 2
            
            # y within 15 points
            if abs(br_y - s_y) < 15:
                # same column
                if (is_left and s_x < 280) or (not is_left and s_x >= 280):
                    row_icon_spans.append(s)
    
    # Sort them by x0 coordinate to reconstruct left-to-right order
    row_icon_spans.sort(key=lambda x: x["bbox"][0])
    
    # Print the icon spans and availability
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
