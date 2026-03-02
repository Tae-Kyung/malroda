import { login, signup } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>;
}) {
    const params = await searchParams;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
            {/* Background aesthetics */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200 rounded-full blur-[100px] opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[100px] opacity-60"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">말로다 <span className="text-emerald-500">Beta</span></h1>
                    <p className="mt-2 text-sm text-gray-600">음성 기반 지능형 농장 관리 시스템</p>
                </div>

                {params?.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium text-center">
                        {params.error}
                    </div>
                )}

                {params?.message && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 font-medium text-center">
                        {params.message}
                    </div>
                )}

                <form className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            이메일 (Email)
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                placeholder="test@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            비밀번호 (Password)
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            formAction={login}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:-translate-y-0.5"
                        >
                            로그인
                        </button>
                        <button
                            formAction={signup}
                            className="w-full flex justify-center py-3 px-4 border border-emerald-200 rounded-xl shadow-sm text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:-translate-y-0.5"
                        >
                            회원가입
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
