import fitz # PyMuPDF

doc = fitz.open("Apawthecaria v1.3.pdf")
page = doc[133] # page 134 is index 133

blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if "lines" in b:
        for l in b["lines"]:
            line_text = "".join(s["text"] for s in l["spans"])
            # Let's print everything on this page to see where the bflgmtpsaw characters are
            print(f"Line text: '{line_text}'")
            for s in l["spans"]:
                if any(c in s["text"] for c in "bflgmtpsaw") or "br " in s["text"]:
                    print(f"  --> Span: '{s['text']}' | font: {s['font']} | color: {s['color']} | bbox: {s['bbox']}")
