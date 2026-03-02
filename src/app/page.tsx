import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-emerald-200">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                M
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">말로다 <span className="text-emerald-500">Beta</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">로그인</Link>
              <Link href="/login" className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-full shadow-sm transition-all transform hover:-translate-y-0.5">무료로 시작하기</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center relative overflow-hidden">

        {/* Decorative Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-300 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 justify-center py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium text-sm mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            웹 베타 테스터 모집 중
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            농장 재고 관리,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              이제 말로 다 하세요.
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            복잡한 엑셀도, 어려운 앱도 필요 없습니다. 현장에서 일하면서 카카오톡이나 음성으로 말하기만 하면 AI가 알아서 재고를 기록하고 분석해줍니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-semibold rounded-full shadow-lg hover:bg-gray-800 transition-all transform hover:-translate-y-1 text-lg">
              베타 시뮬레이터 체험하기
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-all text-lg">
              기능 둘러보기
            </a>
          </div>
        </div>

        {/* Browser Mockup / Visual */}
        <div className="mt-20 relative w-full max-w-5xl mx-auto">
          <div className="bg-white/40 backdrop-blur-3xl border border-white/60 p-2 rounded-3xl shadow-2xl">
            <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-[16/9] flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-gray-900"></div>
              {/* Mock Chat UI Inside */}
              <div className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-4 p-6">
                <div className="self-end bg-emerald-500 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md text-sm md:text-base transform transition-all hover:scale-105 cursor-default">
                  "오늘 수확한 사과 50박스 1동 창고에 넣었어."
                </div>
                <div className="self-start bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-md text-sm md:text-base">
                  ✅ 1동 창고에 사과 50박스를 정상 입고 처리했습니다. <br /> (현재 총 사과 재고: 150박스)
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">농가 맞춤형 AI 비서</h2>
            <p className="mt-4 text-lg text-gray-600">디지털 기기가 익숙하지 않아도 누구나 최고의 효율을 낼 수 있습니다.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">음성인식 자동기록</h3>
              <p className="text-gray-600 leading-relaxed">작업 중 장갑을 벗지 마세요. 카카오톡 음성 메시지 하나면 AI가 내용과 수량을 분석해 자동으로 장부에 기록합니다.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">찰떡같은 오타 교정</h3>
              <p className="text-gray-600 leading-relaxed">"레몬바나나"라고 잘못 말해도, AI가 문맥과 기존 재고를 파악해 "레몬버베나"로 똑똑하게 찾아냅니다.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">실시간 조달/시세 연동</h3>
              <p className="text-gray-600 leading-relaxed">내 재고 상황에 맞는 조달청 입찰 정보와 가락시장 실시간 도매 시세를 질문 한 번으로 바로 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 MalRoDa Team. 개발용 베타 버전입니다.</p>
        </div>
      </footer>
    </div>
  );
}

