import json

with open("extracted_reagents.json", "r", encoding="utf-8") as f:
    reagents = json.load(f)

print(f"Total: {len(reagents)}")
for i, r in enumerate(reagents):
    print(f"{i+1}: {r['name']} -> {r.get('preps')}")
