import { supabase } from '../supabase/client';

export interface UpdateEntities {
    item: string | null;
    grade: string | null;
    zone: string | null;
    quantity: number | null;
    unit: string | null;
    action: 'IN' | 'OUT' | 'ADJUST' | 'DISCARD' | null;
}

function levenshtein(s1: string, s2: string): number {
    const l1 = s1.length;
    const l2 = s2.length;
    const d: number[][] = [];
    for (let i = 0; i <= l1; i++) d[i] = [i];
    for (let j = 0; j <= l2; j++) d[0][j] = j;
    for (let i = 1; i <= l1; i++) {
        for (let j = 1; j <= l2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1,
                d[i - 1][j - 1] + cost
            );
        }
    }
    return d[l1][l2];
}

export async function processInventoryUpdate(
    userId: string,
    entities: UpdateEntities,
    originalText: string,
    isPreview: boolean = false
) {
    try {
        const { item, grade, zone, quantity, action } = entities;

        if (!item || quantity === null || !action) {
            throw new Error("Missing required entities: item, quantity, or action.");
        }

        let effectiveUserId = userId;
        let farmId = "";

        // 유효한 UUID인지 확인
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(effectiveUserId) || effectiveUserId === '00000000-0000-0000-0000-000000000000') {
            throw new Error("Invalid User ID.");
        }

        // 유저의 농장 ID 가져오기
        const { data: farmMember } = await supabase.from('malroda_farm_members').select('farm_id').eq('user_id', effectiveUserId).limit(1).single();
        if (farmMember) {
            farmId = farmMember.farm_id;
        } else {
            const { data: firstFarm } = await supabase.from('malroda_farms').select('id').limit(1).single();
            if (firstFarm) farmId = firstFarm.id;
        }

        // 1. 품목명(item) 검증 및 퍼지 검색 (공백 제거 후 비교)
        const targetZone = zone || '기본';
        const { data: farmItems, error: searchError } = await supabase
            .from('malroda_items')
            .select('id, item_name, grade, zone, current_stock')
            .eq('farm_id', farmId)
            .eq('zone', targetZone);

        if (searchError) throw searchError;

        let bestMatchRecord: any = null;
        let minDistance = 999;
        const normalizedItem = item.replace(/\s+/g, '').toLowerCase(); // 공백 제거 및 소문자화 (Fuzzy Search 용이)

        if (farmItems && farmItems.length > 0) {
            for (const record of farmItems) {
                const normalizedRecordItem = record.item_name.replace(/\s+/g, '').toLowerCase();

                // 정확히 일치하는 경우 우선 선택
                if (normalizedRecordItem === normalizedItem && (record.grade === grade || (!grade && record.grade === '일반'))) {
                    bestMatchRecord = record;
                    minDistance = 0;
                    break;
                }

                // 레벤슈타인 거리 계산
                const dist = levenshtein(normalizedRecordItem, normalizedItem);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestMatchRecord = record;
                }
            }
        }

        let isNewItem = false;
        let matchedItemName = item;
        let matchedGrade = grade || '일반';
        let currentStock = 0;
        let itemId = "";

        // 부분 일치(포함 관계) 여부 검사
        const isIncluded = bestMatchRecord ? (bestMatchRecord.item_name.replace(/\s+/g, '').toLowerCase().includes(normalizedItem) || normalizedItem.includes(bestMatchRecord.item_name.replace(/\s+/g, '').toLowerCase())) : false;

        // 허용 오차: 이름 길이가 길면 3글자까지, 짧으면 2글자까지 오타 허용
        const allowedDistance = normalizedItem.length >= 6 ? 3 : 2;

        if (bestMatchRecord && (minDistance <= allowedDistance || isIncluded)) {
            if (grade && bestMatchRecord.grade !== grade) {
                const exactGradeMatch = farmItems?.find(f => f.item_name === bestMatchRecord.item_name && f.grade === grade);
                if (exactGradeMatch) {
                    bestMatchRecord = exactGradeMatch;
                } else {
                    matchedItemName = bestMatchRecord.item_name;
                    isNewItem = true;
                }
            }
            if (!isNewItem) {
                itemId = bestMatchRecord.id;
                matchedItemName = bestMatchRecord.item_name;
                matchedGrade = bestMatchRecord.grade;
                currentStock = bestMatchRecord.current_stock || 0;
            }
        } else {
            isNewItem = true;
        }

        let qtyChange = quantity;
        if (action === 'OUT' || action === 'DISCARD') {
            qtyChange = -Math.abs(quantity);
        }

        let actionWord = "입고";
        if (action === 'OUT') actionWord = "출고";
        if (action === 'DISCARD') actionWord = "폐기";
        if (action === 'ADJUST') actionWord = "수정";

        if (isPreview) {
            const expectedStock = currentStock + qtyChange;
            const newItemNotice = isNewItem ? "(새로운 품목/등급으로 자동 등록됩니다) " : "";
            const zoneDisplay = targetZone !== '기본' ? `[${targetZone}] ` : "";
            return {
                success: true,
                isPreview: true,
                data: { current_stock: currentStock, expected_stock: expectedStock, item_name: matchedItemName, grade: matchedGrade, zone: targetZone, is_new: isNewItem },
                message: `${zoneDisplay}${matchedItemName}(${matchedGrade}) ${quantity}${entities.unit || '개'} ${actionWord} 처리하시겠습니까?\n${newItemNotice}(현재 잔량 ${currentStock}개 ➡️ 변경 후 ${expectedStock}개 예측)`
            };
        }

        // 2. 실행 (Execute)
        // 만약 신규 품목이라면 여기서 먼저 INSERT 수행
        if (isNewItem) {
            const { data: newItem, error: insertError } = await supabase
                .from('malroda_items')
                .insert({
                    farm_id: farmId,
                    item_name: matchedItemName,
                    grade: matchedGrade,
                    zone: targetZone,
                    unit: entities.unit || '개',
                    current_stock: 0
                })
                .select()
                .single();

            if (insertError) throw insertError;
            itemId = newItem.id;
        }

        // 3. 기존 RPC 호출하여 이력 남기고 재고 업데이트
        const { data: rpcData, error: rpcError } = await supabase
            .rpc('malroda_update_inventory', {
                p_item_id: itemId,
                p_user_id: effectiveUserId,
                p_action_type: action,
                p_qty_change: qtyChange,
                p_original_text: originalText
            });

        if (rpcError) throw rpcError;

        const resultData = rpcData[0];

        // 4. 성공 메시지 구성
        const zoneDisplay = targetZone !== '기본' ? `[${targetZone}] ` : "";
        return {
            success: true,
            isPreview: false,
            data: resultData,
            message: `${zoneDisplay}${matchedItemName}(${matchedGrade}) ${quantity}${entities.unit || '개'} ${actionWord} 완료되었습니다. (현재 잔량: ${resultData.new_stock}개)`
        };

    } catch (err: any) {
        console.error("[processInventoryUpdate Error]:", err);
        return {
            success: false,
            message: "재고 업데이트 중 문제가 발생했습니다."
        };
    }
}
