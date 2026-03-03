'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addFarmItem(formData: FormData) {
    const supabase = await createClient()
    const farmId = formData.get('farm_id') as string
    const itemName = formData.get('item_name') as string
    const grade = formData.get('grade') as string
    const zone = formData.get('zone') as string
    const unit = formData.get('unit') as string || 'pcs'

    if (!farmId || !itemName || !grade) {
        return { error: 'Required fields (item name, grade) are missing.' }
    }

    const { error } = await supabase
        .from('malroda_items')
        .insert([
            {
                farm_id: farmId,
                item_name: itemName,
                grade: grade,
                zone: zone || 'Default',
                unit: unit,
                current_stock: 0
            }
        ])

    if (error) {
        console.error('Error adding item:', error)
        return { error: 'An error occurred while adding the item.' }
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
        return { error: 'An error occurred while deleting the item. Items with inventory history cannot be deleted.' }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function bulkUploadFarmItems(formData: FormData) {
    const supabase = await createClient()
    const farmId = formData.get('farm_id') as string
    const file = formData.get('file') as File

    if (!farmId || !file) {
        return { error: 'File and farm ID are required.' }
    }

    try {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')

        if (lines.length === 0) {
            return { error: 'Empty file.' }
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

        const hasZone = headers.indexOf('zone')
        const hasName = headers.indexOf('item_name') > -1 ? headers.indexOf('item_name') : headers.indexOf('name')
        const hasGrade = headers.indexOf('grade')
        const hasUnit = headers.indexOf('unit')
        const hasStock = headers.indexOf('current_stock') > -1 ? headers.indexOf('current_stock') : headers.indexOf('stock')

        if (hasName === -1 || hasGrade === -1) {
            return { error: 'CSV header must include at least item_name (or name) and grade columns.' }
        }

        const itemsToInsert = []

        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',').map(c => c.trim())

            if (columns.length <= Math.max(hasName, hasGrade)) continue;

            const itemName = columns[hasName]
            const grade = columns[hasGrade]

            if (!itemName || !grade) continue;

            const zone = hasZone > -1 && columns[hasZone] ? columns[hasZone] : 'Default'
            const unit = hasUnit > -1 && columns[hasUnit] ? columns[hasUnit] : 'pcs'
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
            return { error: 'No valid item data to register.' }
        }

        const { error } = await supabase
            .from('malroda_items')
            .insert(itemsToInsert)

        if (error) {
            console.error('Error bulk inserting items:', error)
            return { error: 'Database error during bulk registration.' }
        }

        revalidatePath('/dashboard/settings')
        return { success: true, count: itemsToInsert.length }

    } catch (err: any) {
        console.error('Bulk upload parse error:', err)
        return { error: 'Error parsing file. Please ensure it is a valid CSV file.' }
    }
}
