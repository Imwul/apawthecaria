import json
import re

import fitz


REGIONS = {
    "b": "Bog",
    "f": "Forest",
    "l": "Loch",
    "g": "Meadow",
    "m": "Mountain",
    "t": "Titan",
}
SEASONS = {
    "p": "Spring",
    "s": "Summer",
    "a": "Autumn",
    "w": "Winter",
}
FONT_STATES = {
    "ApawthecariaIconsAv-Regu": "Common",
    "ApawthecariaIconsOof-Reg": "Rare",
    "ApawthecariaIconsUnav-Rg": "Unavailable",
}


def clean_name(value: str) -> str:
    return re.sub(r"^\W+|\W+$", "", value.replace("’s", "").replace("'s", "").strip())


document = fitz.open("Apawthecaria v1.3.pdf")
result = {}

for page_index in range(131, 151):
    page = document[page_index]
    spans = [
        span
        for block in page.get_text("dict")["blocks"]
        for line in block.get("lines", [])
        for span in line["spans"]
    ]
    br_spans = [span for span in spans if span["text"].strip().startswith("br ")]

    for br_span in br_spans:
        br_x = sum((br_span["bbox"][0], br_span["bbox"][2])) / 2
        br_y = sum((br_span["bbox"][1], br_span["bbox"][3])) / 2
        left_column = br_x < 297
        headers = []
        for span in spans:
            text = span["text"].strip()
            span_x = sum((span["bbox"][0], span["bbox"][2])) / 2
            span_y = sum((span["bbox"][1], span["bbox"][3])) / 2
            if (span_x < 297) != left_column or span_y >= br_y or not text:
                continue
            if "ApawthecariaIcons" in span["font"] or text.lower() in {"plant", "animal", "insect", "earth", "titan"}:
                continue
            if "Spirit" in span["font"] or span["size"] > 11.5:
                headers.append((span_y, text))
        if not headers:
            continue

        name = clean_name(max(headers, key=lambda candidate: candidate[0])[1])
        type_candidates = [
            span["text"].strip().upper()
            for span in spans
            if span["text"].strip().lower() in {"plant", "animal", "insect", "earth", "titan"}
            and (sum((span["bbox"][0], span["bbox"][2])) / 2 < 297) == left_column
            and abs((sum((span["bbox"][1], span["bbox"][3])) / 2) - br_y) < 20
        ]
        rarity_match = re.search(r"br\s+(\d+)", br_span["text"], re.IGNORECASE)
        if len(type_candidates) != 1 or not rarity_match:
            raise ValueError(f"Missing type or BR for {name} on page {page_index + 1}")
        availability = {**{value: None for value in REGIONS.values()}, **{value: None for value in SEASONS.values()}}
        for span in spans:
            span_x = sum((span["bbox"][0], span["bbox"][2])) / 2
            span_y = sum((span["bbox"][1], span["bbox"][3])) / 2
            if (span_x < 297) != left_column or abs(span_y - br_y) >= 15:
                continue
            state = next((value for font, value in FONT_STATES.items() if font in span["font"]), None)
            if not state:
                continue
            for character in span["text"]:
                key = REGIONS.get(character) or SEASONS.get(character)
                if key:
                    availability[key] = state

        if any(value is None for value in availability.values()):
            raise ValueError(f"Incomplete icon row for {name} on page {page_index + 1}: {availability}")
        result[name] = {
            "type": type_candidates[0],
            "baseRarity": int(rarity_match.group(1)),
            "regions": {key: availability[key] for key in REGIONS.values()},
            "seasons": {key: availability[key] for key in SEASONS.values()},
            "sourcePage": page_index + 1,
        }

if len(result) != 83:
    raise ValueError(f"Expected 83 reagents, extracted {len(result)}: {sorted(result)}")

with open("src/rules/data/reagentAvailability.json", "w", encoding="utf-8") as output:
    json.dump(result, output, ensure_ascii=False, indent=2)
    output.write("\n")

print(f"Wrote {len(result)} reagent availability rows")
