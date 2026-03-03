"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";

export default function SimulatorPage() {
  const t = useTranslations();
  const [messages, setMessages] = useState<
    { role: string; content: string; debug?: any }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>("sim-tester");
  const [userUuid, setUserUuid] = useState<string>(
    "00000000-0000-0000-0000-000000000000"
  );

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.email || user.id);
        setUserUuid(user.id);
      }
    };
    getUser();
  }, [supabase.auth]);

  const tutorialCategories = [
    {
      icon: "🔍",
      title: t("simulator.tutorial.categories.query.title"),
      description: t("simulator.tutorial.categories.query.description"),
      questions: t.raw("simulator.tutorial.categories.query.questions") as string[],
    },
    {
      icon: "📥",
      title: t("simulator.tutorial.categories.inbound.title"),
      description: t("simulator.tutorial.categories.inbound.description"),
      questions: t.raw("simulator.tutorial.categories.inbound.questions") as string[],
    },
    {
      icon: "📤",
      title: t("simulator.tutorial.categories.outbound.title"),
      description: t("simulator.tutorial.categories.outbound.description"),
      questions: t.raw("simulator.tutorial.categories.outbound.questions") as string[],
    },
    {
      icon: "⚙️",
      title: t("simulator.tutorial.categories.adjust.title"),
      description: t("simulator.tutorial.categories.adjust.description"),
      questions: t.raw("simulator.tutorial.categories.adjust.questions") as string[],
    },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          sessionId: `sim-${userId}`,
          userId: userUuid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "API request failed");
      }

      const assistantMessage = {
        role: "assistant",
        content: data.reply || "Unknown command.",
        debug: {
          intent: data.intent,
          entities: data.entities,
          actionResult: data.action_result,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${t("simulator.apiError")}: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTutorialClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Simulator (2 columns) */}
        <div className="lg:col-span-2">
          <div className="flex flex-col h-[calc(100vh-12rem)] bg-white shadow-xl border border-gray-100 rounded-3xl overflow-hidden transition-all">
            <header className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-md flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h2 className="font-bold tracking-tight">
                  {t("simulator.title")}
                </h2>
              </div>
              <span className="text-[10px] sm:text-xs font-medium bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white">
                {t("simulator.tester")}: {userId}
              </span>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
                    👋
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg mb-2">
                    {t("simulator.empty.title")}
                  </h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    {t("simulator.empty.description")}
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    } animate-fade-in-up`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-sm mb-1 transition-all ${
                        msg.role === "user"
                          ? "bg-emerald-500 text-white rounded-br-none shadow-lg"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <div className="markdown-container prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>

                    {msg.role === "assistant" && msg.debug && (
                      <div className="max-w-[90%] bg-gray-900/95 backdrop-blur-sm text-gray-300 text-[10px] p-3 rounded-xl overflow-x-auto break-words mt-2 border border-gray-700 shadow-xl">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
                          <span className="text-xs">🛠️</span>
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">
                            {t("simulator.debug.title")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <span className="text-gray-500 font-medium w-12">
                              {t("simulator.debug.intent")}:
                            </span>{" "}
                            <span className="text-white bg-gray-800 px-1.5 py-0.5 rounded">
                              {msg.debug.intent}
                            </span>
                          </div>

                          {msg.debug.entities &&
                            Object.keys(msg.debug.entities).length > 0 && (
                              <div className="flex gap-2">
                                <span className="text-gray-500 font-medium w-12">
                                  {t("simulator.debug.entities")}:
                                </span>
                                <code className="text-teal-300 bg-teal-950/30 px-1.5 py-0.5 rounded">
                                  {JSON.stringify(msg.debug.entities)}
                                </code>
                              </div>
                            )}

                          {msg.debug.actionResult &&
                            msg.debug.actionResult.sql_used && (
                              <div className="mt-2 pt-2 border-t border-gray-800">
                                <span className="text-blue-400 font-medium block mb-1">
                                  {t("simulator.debug.generatedSql")}:
                                </span>
                                <code className="block bg-black/40 p-2 rounded text-blue-200 leading-normal">
                                  {msg.debug.actionResult.sql_used}
                                </code>
                              </div>
                            )}

                          {msg.debug.actionResult &&
                            msg.debug.actionResult.success === false && (
                              <div className="text-rose-400 mt-2 p-2 bg-rose-950/20 rounded border border-rose-900/30">
                                ⚠️ {msg.debug.actionResult.message}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-xs font-medium text-emerald-600">
                      {t("simulator.loading")}
                    </span>
                  </div>
                </div>
              )}
            </main>

            <footer className="p-5 bg-white border-t border-gray-100">
              <div className="relative group max-w-4xl mx-auto flex items-center gap-3">
                <input
                  type="text"
                  className="flex-1 border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
                  placeholder={t("simulator.placeholder")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-600 text-white font-bold p-4 rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-emerald-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </footer>
          </div>
        </div>

        {/* Tutorial Sidebar (1 column) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>

            <h3 className="text-gray-900 font-extrabold text-xl mb-1 flex items-center gap-2 relative z-10">
              ✨ {t("simulator.tutorial.title")}
            </h3>
            <p className="text-gray-500 text-xs mb-6 relative z-10">
              {t("simulator.tutorial.subtitle")}
            </p>

            <div className="space-y-4 relative z-10">
              {tutorialCategories.map((cat, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">
                        {cat.title}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {cat.questions.map((q, j) => (
                      <button
                        key={j}
                        onClick={() => handleTutorialClick(q)}
                        className="text-left p-3 rounded-2xl bg-gray-50/50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 text-[11px] text-gray-600 hover:text-emerald-700 transition-all group/btn flex justify-between items-center"
                      >
                        <span className="line-clamp-2 pr-2">{q}</span>
                        <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity bg-emerald-500 text-white p-1 rounded-lg">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100/50">
                <h5 className="text-[11px] font-bold text-blue-700 mb-1 leading-tight">
                  💡 {t("simulator.tutorial.tip.title")}
                </h5>
                <p className="text-[10px] text-blue-600 leading-relaxed opacity-80">
                  {t("simulator.tutorial.tip.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
