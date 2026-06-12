import json

with open("extracted_reagents_v2.json", "r", encoding="utf-8") as f:
    extracted = json.load(f)

keys = ["horse chestnuts", "frog slime", "wild garlic", "ironslug"]
for key in keys:
    if key in extracted:
        print(f"\nReagent: {key}")
        print("  Regions:", extracted[key]["regions"])
        print("  Seasons:", extracted[key]["seasons"])
        print("  Page:", extracted[key]["page"])
    else:
        print(f"\nReagent {key} not found in extracted_reagents_v2.json")
