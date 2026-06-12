import fitz # PyMuPDF

doc = fitz.open("Apawthecaria v1.3.pdf")
page = doc[125] # page 126 is index 125

blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if "lines" in b:
        for l in b["lines"]:
            line_text = "".join(s["text"] for s in l["spans"])
            if "br 4" in line_text:
                print(f"\n--- Line: '{line_text}' ---")
                for s in l["spans"]:
                    print(f"  Span: '{s['text']}' | font: {s['font']} | color: {s['color']} | bbox: {s['bbox']}")
