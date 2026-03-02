'use client'

import { useState } from 'react'
import { addFarmItem, deleteFarmItem, bulkUploadFarmItems } from './actions'

interface Item {
    id: string
    item_name: string
    grade: string
    zone: string
    unit: string
    current_stock: number
}

export default function FarmItemsManager({ farmId, initialItems }: { farmId: string, initialItems: Item[] }) {
    const [items, setItems] = useState<Item[]>(initialItems)
    const [isAdding, setIsAdding] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingAction, setIsUploadingAction] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleUpload = async (formData: FormData) => {
        setError(null)
        setIsUploadingAction(true)

        const result = await bulkUploadFarmItems(formData)

        if (result.error) {
            setError(result.error)
            setIsUploadingAction(false)
            return
        }

        alert(`${result.count}개의 품목이 성공적으로 등록되었습니다.`)
        window.location.reload()
    }

    const handleAdd = async (formData: FormData) => {
        setError(null)
        const result = await addFarmItem(formData)

        if (result.error) {
            setError(result.error)
            return
        }

        // Refresh would be handled by Next.js revalidatePath, but for immediate UI:
        window.location.reload()
    }

    const handleDelete = async (itemId: string) => {
        if (!confirm('정말 삭제하시겠습니까? (재고 이력이 있는 경우 삭제할 수 없습니다)')) return;

        setError(null)
        const result = await deleteFarmItem(itemId)

        if (result.error) {
            setError(result.error)
            return
        }

        setItems(prev => prev.filter(i => i.id !== itemId))
    }

    return (
        <div className="pt-8 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h4 className="text-sm font-medium text-gray-700">관리 품목 및 구역 (Zone) 설정</h4>
                    <p className="text-xs text-gray-500">말로다가 인식할 수 있도록 취급하는 품목명, 등급 및 구역을 정확하게 등록해주세요.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setIsAdding(false); setIsUploading(!isUploading) }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        {isUploading ? '취소' : 'CSV 대량 등록'}
                    </button>
                    <button
                        onClick={() => { setIsUploading(false); setIsAdding(!isAdding) }}
                        className="inline-flex items-center px-3 py-1.5 border border-emerald-600 rounded-md text-xs font-medium text-emerald-600 bg-white hover:bg-emerald-50 transition-colors"
                    >
                        {isAdding ? '취소' : '+ 새 품목 추가'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-100">
                    {error}
                </div>
            )}

            {isUploading && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <form action={handleUpload} className="flex flex-col sm:flex-row gap-4 items-end">
                        <input type="hidden" name="farm_id" value={farmId} />
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-blue-900 mb-1">CSV 파일 (필수 헤더: zone, item_name, grade, unit, current_stock)</label>
                            <input
                                type="file"
                                name="file"
                                accept=".csv"
                                required
                                className="block w-full text-sm text-blue-900
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-600 file:text-white
                                hover:file:bg-blue-700 cursor-pointer"
                            />
                        </div>
                        <button type="submit" disabled={isUploadingAction} className="whitespace-nowrap bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50">
                            {isUploadingAction ? '업로드 중...' : '파일 업로드'}
                        </button>
                    </form>
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-100">
                    {error}
                </div>
            )}

            {isAdding && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <form action={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                        <input type="hidden" name="farm_id" value={farmId} />

                        <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">구역 (Zone) *</label>
                            <input type="text" name="zone" required placeholder="예: 1동, 자스민" className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500" />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">품목명 *</label>
                            <input type="text" name="item_name" required placeholder="예: 로즈마리" className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500" />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">등급 *</label>
                            <input type="text" name="grade" required placeholder="예: 10cm, 특품" className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500" />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">단위</label>
                            <input type="text" name="unit" defaultValue="개" className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500" />
                        </div>
                        <div className="sm:col-span-1">
                            <button type="submit" className="w-full bg-emerald-600 text-white text-sm font-medium py-2 rounded-md hover:bg-emerald-700 transition">추가 반영</button>
                        </div>
                    </form>
                </div>
            )}

            {items.length > 0 ? (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구역 (Zone)</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품목명</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급/규격</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">단위</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">현재재고</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 flex-col">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-100">{item.zone}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.grade}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center font-semibold bg-gray-50/50">{item.current_stock}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 transition-colors">삭제</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                    <p className="text-sm text-gray-500">등록된 품목이 없습니다. 새 품목을 추가해주세요.</p>
                </div>
            )}
        </div>
    )
}
