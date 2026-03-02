import sys

def generate_sql(input_file, output_file):
    zones = ["서울", "10동", "자스민", "9연동", "곤지암", "대관령", "평창"]
    zone_indices = [3, 4, 5, 6, 7, 8, 9]

    inserts = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for idx, line in enumerate(lines):
        if idx == 0: continue # header
        
        parts = line.strip('\n').split('\t')
        if len(parts) < 10: continue
        
        item_name = parts[1].strip()
        grade = parts[2].strip()
        
        if not item_name: continue
        
        for z_idx, zone_name in zip(zone_indices, zones):
            val_str = parts[z_idx].strip()
            if not val_str: continue
            
            try:
                stock = int(val_str)
            except ValueError:
                continue
                
            # item_name, grade 문자열 이스케이프 (작은따옴표 처리)
            safe_item_name = item_name.replace("'", "''")
            safe_grade = grade.replace("'", "''")
            
            inserts.append(f"(v_farm_id, '{safe_item_name}', '{safe_grade}', '{zone_name}', '개', {stock})")

    with open(output_file, 'w', encoding='utf-8') as out:
        out.write("-- 05_seed_herb5_data.sql\n")
        out.write("DO $$\n")
        out.write("DECLARE\n")
        out.write("  v_farm_id UUID;\n")
        out.write("BEGIN\n")
        out.write("  SELECT id INTO v_farm_id FROM public.malroda_farms LIMIT 1;\n\n")
        out.write("  IF v_farm_id IS NULL THEN\n")
        out.write("    RAISE NOTICE 'No farm found to attach items to.';\n")
        out.write("    RETURN;\n")
        out.write("  END IF;\n\n")
        out.write("  DELETE FROM public.malroda_items;\n\n")
        
        if inserts:
            out.write("  INSERT INTO public.malroda_items (farm_id, item_name, grade, zone, unit, current_stock) VALUES\n")
            # 1000개 단위로 나누어서 인서트 (Postgres limit 방지)
            batch_size = 1000
            for i in range(0, len(inserts), batch_size):
                batch = inserts[i:i+batch_size]
                out.write("  " + ",\n  ".join(batch))
                if i + batch_size < len(inserts):
                    out.write(";\n  INSERT INTO public.malroda_items (farm_id, item_name, grade, zone, unit, current_stock) VALUES\n")
                else:
                    out.write(";\n")
                    
        out.write("END $$;\n")

if __name__ == '__main__':
    generate_sql('herb5_utf8.txt', 'supabase/migrations/05_seed_herb5_data.sql')
