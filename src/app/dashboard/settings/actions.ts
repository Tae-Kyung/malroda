'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addFarmItem(formData: FormData) {
    const supabase = await createClient()
    const farmId = formData.get('farm_id') as string
    const itemName = formData.get('item_name') as string
    const grade = formData.get('grade') as string
    const zone = formData.get('zone') as string
    const unit = formData.get('unit') as string || '개'

    if (!farmId || !itemName || !grade) {
        return { error: '필수 항목(품목명, 등급)을 입력해주세요.' }
    }

    const { error } = await supabase
        .from('malroda_items')
        .insert([
            {
                farm_id: farmId,
                item_name: itemName,
                grade: grade,
                zone: zone || '기본',
                unit: unit,
                current_stock: 0
            }
        ])

    if (error) {
        console.error('Error adding item:', error)
        return { error: '품목 추가 중 오류가 발생했습니다.' }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function deleteFarmItem(itemId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('malroda_items')
        .delete()
        .eq('id', itemId)

    if (error) {
        console.error('Error deleting item:', error)
        return { error: '품목 삭제 중 오류가 발생했습니다. 재고 이력이 있는 경우 삭제할 수 없을 수 있습니다.' }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function bulkUploadFarmItems(formData: FormData) {
    const supabase = await createClient()
    const farmId = formData.get('farm_id') as string
    const file = formData.get('file') as File

    if (!farmId || !file) {
        return { error: '파일과 농장 ID가 필요합니다.' }
    }

    try {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')

        if (lines.length === 0) {
            return { error: '빈 파일입니다.' }
        }

        // CSV 형식 (Header 예상): zone, item_name, grade, unit, current_stock (optional)
        // 확장성을 위해 헤더를 무시하고 콤마 개수로 파싱하거나 헤더를 분석 (여기서는 심플하게 헤더 포함일 경우 파싱)
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

        const hasZone = headers.indexOf('zone')
        const hasName = headers.indexOf('item_name') > -1 ? headers.indexOf('item_name') : headers.indexOf('name')
        const hasGrade = headers.indexOf('grade')
        const hasUnit = headers.indexOf('unit')
        const hasStock = headers.indexOf('current_stock') > -1 ? headers.indexOf('current_stock') : headers.indexOf('stock')

        // 가장 간단한 데이터 셋 포맷 검증 (최소 속성: name, grade)
        if (hasName === -1 || hasGrade === -1) {
            return { error: 'CSV 헤더에 최소한 item_name(또는 name)과 grade 열이 포함되어야 합니다.' }
        }

        const itemsToInsert = []

        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',').map(c => c.trim())

            if (columns.length <= Math.max(hasName, hasGrade)) continue; // 잘못된 라인 스킵

            const itemName = columns[hasName]
            const grade = columns[hasGrade]

            if (!itemName || !grade) continue;

            const zone = hasZone > -1 && columns[hasZone] ? columns[hasZone] : '기본'
            const unit = hasUnit > -1 && columns[hasUnit] ? columns[hasUnit] : '개'
            let stock = 0

            if (hasStock > -1 && columns[hasStock]) {
                const parsedStock = parseInt(columns[hasStock], 10)
                if (!isNaN(parsedStock)) stock = Number(parsedStock)
            }

            itemsToInsert.push({
                farm_id: farmId,
                item_name: itemName,
                grade: grade,
                zone: zone,
                unit: unit,
                current_stock: stock
            })
        }

        if (itemsToInsert.length === 0) {
            return { error: '등록할 수 있는 유효한 품목 데이터가 없습니다.' }
        }

        const { error } = await supabase
            .from('malroda_items')
            .insert(itemsToInsert)

        if (error) {
            console.error('Error bulk inserting items:', error)
            return { error: '대량 등록 중 데이터베이스 오류가 발생했습니다.' }
        }

        revalidatePath('/dashboard/settings')
        return { success: true, count: itemsToInsert.length }

    } catch (err: any) {
        console.error('Bulk upload parse error:', err)
        return { error: '파일을 파싱하는 중 오류가 발생했습니다. 올바른 CSV 파일인지 확인해주세요.' }
    }
}
