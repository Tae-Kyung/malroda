import difflib

def find_closest():
    items = set()
    try:
        with open('herb5_utf8.txt', 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split(',')
                if len(parts) >= 1:
                    items.add(parts[0].strip())
                    
        target = "레몬바나나"
        
        print(f"'{target}'와 가장 유사한 품목들:")
        
        matches = difflib.get_close_matches(target, items, n=5, cutoff=0.1)
        for i, match in enumerate(matches, 1):
            ratio = difflib.SequenceMatcher(None, target, match).ratio()
            print(f"{i}. {match} (유사도: {ratio:.2f})")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    find_closest()
