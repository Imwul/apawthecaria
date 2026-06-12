import fitz

doc = fitz.open("Apawthecaria v1.3.pdf")

pages_to_inspect = {
    138: ["Fine Sand"],
    140: ["Iron Ore", "Ironslug"],
    141: ["Lavender"],
    147: ["Shells", "Silver Ore", "Small Fish"],
    150: ["Whiskerburner"]
}

for page_num, names in pages_to_inspect.items():
    print(f"\n======================================")
    print(f"PDF Page {page_num} (reagents: {', '.join(names)})")
    print(f"======================================")
    page = doc[page_num - 1]
    print(page.get_text())
