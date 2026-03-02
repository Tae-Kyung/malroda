import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { signout } from '@/app/login/actions'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/dashboard" className="text-xl font-bold text-emerald-600">말로다 Beta</Link>
                            </div>
                            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                                <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    대시보드
                                </Link>
                                <Link href="/dashboard/simulator" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    시뮬레이터
                                </Link>
                                <Link href="/dashboard/settings" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    농장 설정
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-4">{user.email}</span>
                            <form action={signout}>
                                <button type="submit" className="text-sm font-medium text-gray-500 hover:text-gray-700">로그아웃</button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
}
