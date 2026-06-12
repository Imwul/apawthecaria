import re
import json

with open("src/gameData.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find "reagents": [ or "reagents" : [
start_match = re.search(r'"reagents"\s*:\s*\[', content)
if not start_match:
    start_match = re.search(r'reagents\s*:\s*\[', content)

if start_match:
    start_idx = start_match.end() - 1 # include the '['
    depth = 0
    end_idx = -1
    for idx in range(start_idx, len(content)):
        char = content[idx]
        if char == '[':
            depth += 1
        elif char == ']':
            depth -= 1
            if depth == 0:
                end_idx = idx + 1
                break
    
    if end_idx != -1:
        reagents_str = content[start_idx:end_idx]
        # Clean trailing commas
        reagents_str = re.sub(r',\s*\]', ']', reagents_str)
        reagents_str = re.sub(r',\s*\}', '}', reagents_str)
        
        try:
            reagents = json.loads(reagents_str)
            print(f"Successfully parsed {len(reagents)} reagents in src/gameData.ts")
            # Save parsed reagents list to verify
            with open("parsed_game_reagents.json", "w", encoding="utf-8") as out:
                json.dump(reagents, out, indent=2, ensure_ascii=False)
            for i, r in enumerate(reagents[:10]):
                print(f"{i+1}: {r.get('name')} ({r.get('rawName')})")
        except Exception as e:
            print("Failed to parse JSON using depth-first scanner.")
            print("Error:", e)
            with open("reagents_error.json", "w", encoding="utf-8") as ef:
                ef.write(reagents_str)
    else:
        print("Could not find matching closing bracket for reagents array.")
else:
    print("Could not find reagents list start in gameData.ts")
