import fitz # PyMuPDF

doc = fitz.open("Apawthecaria v1.3.pdf")
page = doc[131] # page 132 is index 131

blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if "lines" in b:
        for l in b["lines"]:
            line_text = "".join(s["text"] for s in l["spans"])
            if "bflgmtpsaw" in line_text or any(c in line_text for c in "bflgmtpsaw"):
                # Check if it has the characters of interest
                if "br" in line_text:
                    print(f"\n--- Line: '{line_text}' ---")
                    for s in l["spans"]:
                        print(f"  Span: '{s['text']}' | font: {s['font']} | color: {s['color']} | bbox: {s['bbox']}")
