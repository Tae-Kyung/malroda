import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Image from "next/image";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-emerald-200">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {t("nav.brand")}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              <Link
                href="/login"
                className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
              >
                {t("common.login")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-16">
        <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 flex items-center justify-center px-6 lg:px-16 py-16 lg:py-0">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium text-sm mb-6">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("home.hero.badge")}
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-6">
                {t("home.hero.title1")}
                <br />
                <span className="text-emerald-600">
                  {t("home.hero.title2")}
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {t("home.hero.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all text-center"
                >
                  {t("home.hero.ctaSimulator")}
                </Link>
                <a
                  href="#features"
                  className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-center"
                >
                  {t("home.hero.ctaFeatures")}
                </a>
              </div>

              {/* Mock Chat Preview */}
              <div className="mt-12 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex flex-col gap-3">
                  <div className="self-end bg-emerald-500 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-sm max-w-[80%]">
                    &quot;{t("home.mockChat.userMessage")}&quot;
                  </div>
                  <div className="self-start bg-white text-gray-700 px-4 py-2.5 rounded-2xl rounded-tl-md text-sm border border-gray-200 max-w-[85%]">
                    {t("home.mockChat.aiResponse")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="hidden lg:block lg:w-1/2 relative">
            <Image
              src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2940&auto=format&fit=crop"
              alt="Green farm field"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent w-32" />
          </div>
        </div>
      </main>

      {/* Image Gallery Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Image 1 - Large */}
            <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden aspect-square group">
              <Image
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=2940&auto=format&fit=crop"
                alt="Farmer in field"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm font-medium opacity-80">Voice-powered</p>
                <p className="text-lg font-semibold">Inventory Tracking</p>
              </div>
            </div>

            {/* Image 2 */}
            <div className="relative rounded-2xl overflow-hidden aspect-square group">
              <Image
                src="https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=2940&auto=format&fit=crop"
                alt="Vegetables harvest"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Image 3 */}
            <div className="relative rounded-2xl overflow-hidden aspect-square group">
              <Image
                src="https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=2942&auto=format&fit=crop"
                alt="Fresh strawberries"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Image 4 */}
            <div className="relative rounded-2xl overflow-hidden aspect-square group">
              <Image
                src="https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=2864&auto=format&fit=crop"
                alt="Rice paddy"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Image 5 */}
            <div className="relative rounded-2xl overflow-hidden aspect-square group">
              <Image
                src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?q=80&w=2874&auto=format&fit=crop"
                alt="Green cabbage field"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat UI Showcase Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          {/* NL SQL Description */}
          <div className="text-center mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Natural Language → SQL
            </h2>
            <p className="text-gray-500">
              Ask questions in plain language. AI converts to SQL and queries your inventory instantly.
            </p>
          </div>

          {/* Chat UI Mockup */}
          <div className="w-full opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-200 overflow-hidden transition-transform hover:scale-[1.02] duration-300">
                {/* Header Bar */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <span className="text-white font-semibold text-sm">MalRoDa AI Simulator</span>
                  </div>
                  <div className="bg-gray-800 px-3 py-1 rounded-full">
                    <span className="text-white text-xs font-medium">TABLE (11)</span>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="p-4 bg-gray-50/50">
                  <div className="flex gap-4">
                    {/* Chat Messages */}
                    <div className="flex-1 space-y-3">
                      {/* User Message */}
                      <div className="flex justify-end opacity-0 animate-slide-in-right animation-delay-200">
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl rounded-tr-md text-sm">
                          로즈마리 재고 얼마나 있어?
                        </div>
                      </div>

                      {/* Typing Indicator (shows briefly then AI response) */}
                      <div className="opacity-0 animate-slide-in-left animation-delay-700">
                        {/* AI Response */}
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-4 text-sm text-gray-700">
                          <p className="font-medium mb-2">로즈마리 재고는 다음과 같습니다:</p>
                          <ul className="space-y-1 text-xs text-gray-600">
                            <li className="opacity-0 animate-fade-in-up animation-delay-1000">• <span className="text-emerald-600 font-medium">9연동</span>: 10cm - 800개</li>
                            <li className="opacity-0 animate-fade-in-up animation-delay-1200">• <span className="text-purple-600 font-medium">곤지암</span>: 18cm - 5750개</li>
                            <li className="opacity-0 animate-fade-in-up" style={{ animationDelay: '1.4s' }}>• <span className="text-blue-600 font-medium">서울</span>: 10cm - 11649개</li>
                          </ul>
                          <p className="mt-3 text-emerald-600 font-medium text-xs opacity-0 animate-fade-in-up" style={{ animationDelay: '1.6s' }}>
                            총 재고: 20,000개 이상
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mini Table */}
                    <div className="hidden sm:block w-44 bg-white border border-gray-200 rounded-xl overflow-hidden text-xs opacity-0 animate-fade-in-up" style={{ animationDelay: '1.8s' }}>
                      <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-gray-500">
                        <span>Item</span>
                        <span className="text-right">Stock</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        <div className="grid grid-cols-2 px-3 py-1.5">
                          <span className="text-gray-700">로즈마리 (10cm)</span>
                          <span className="text-right text-emerald-600 font-medium">800개</span>
                        </div>
                        <div className="grid grid-cols-2 px-3 py-1.5">
                          <span className="text-gray-700">로즈마리 (18cm)</span>
                          <span className="text-right text-emerald-600 font-medium">5,750개</span>
                        </div>
                        <div className="grid grid-cols-2 px-3 py-1.5">
                          <span className="text-gray-700">로즈마리 (10cm)</span>
                          <span className="text-right text-emerald-600 font-medium">11,649개</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 flex justify-between">
                        <span className="text-gray-500">Total</span>
                        <span className="font-bold text-emerald-600">25,822개</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="px-4 py-3 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-xs text-gray-400">
                      How can I help?
                    </div>
                    <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                    <button className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
      <section className="py-20 bg-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop"
            alt="Farm background"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to simplify your farm management?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join farmers who are already using voice-powered AI to manage their inventory effortlessly.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            {t("common.login")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-gray-900 font-semibold">{t("nav.brand")}</span>
          </div>
          <p className="text-gray-500 text-sm">{t("home.footer")}</p>
        </div>
      </footer>
    </div>
  );
}
