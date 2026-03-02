"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/client";

export default function SimulatorPage() {
    const [messages, setMessages] = useState<{ role: string; content: string; debug?: any }[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string>("sim-tester");
    const [userUuid, setUserUuid] = useState<string>("00000000-0000-0000-0000-000000000000");

    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.email || user.id);
                setUserUuid(user.id);
            }
        };
        getUser();
    }, [supabase.auth]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // 실제 구현 시 /api/router 에 전송
            const res = await fetch("/api/router", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: input, sessionId: `sim-${userId}`, userId: userUuid }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "API 요청 실패");
            }

            // 챗봇 응답 메시지와 디버깅 데이터를 함께 저장
            const assistantMessage = {
                role: "assistant",
                content: data.reply || "이해할 수 없는 명령입니다.",
                debug: {
                    intent: data.intent,
                    entities: data.entities,
                    actionResult: data.action_result
                }
            };

            setMessages((prev) => [...prev, assistantMessage]);

        } catch (error: any) {
            console.error(error);
            setMessages((prev) => [...prev, { role: "assistant", content: `API Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-white max-w-2xl mx-auto shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
            <header className="bg-emerald-50 border-b border-emerald-100 p-4 text-center font-bold text-emerald-800 flex justify-between items-center">
                <span>💬 말로다 웹 시뮬레이터</span>
                <span className="text-xs font-normal text-emerald-600 bg-white px-2 py-1 rounded-full border border-emerald-200">
                    테스터: {userId}
                </span>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 text-sm">
                        음성 명령을 텍스트로 테스트해보세요. <br />예: 사과 10박스 입고해줘
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            {/* 메인 말풍선 */}
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl text-sm mb-1 ${msg.role === "user"
                                    ? "bg-emerald-500 text-white rounded-br-none shadow-sm"
                                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm"
                                    }`}
                            >
                                <div className="markdown-container prose prose-sm max-w-none">
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* 디버그 데이터 패널 (어시스턴트 응답일 경우만 표시) */}
                            {msg.debug && (
                                <div className="max-w-[90%] bg-gray-800 text-gray-300 text-[10px] p-2 rounded-md overflow-x-auto break-words mt-1">
                                    <span className="text-yellow-400 font-bold block mb-1">🛠️ [Debug Logs]</span>
                                    <div>• Intent: {msg.debug.intent}</div>

                                    {msg.debug.entities && Object.keys(msg.debug.entities).length > 0 && (
                                        <div>• Entities: {JSON.stringify(msg.debug.entities)}</div>
                                    )}

                                    {msg.debug.actionResult && msg.debug.actionResult.sql_used && (
                                        <div className="text-blue-300 mt-1">
                                            [NL2SQL] {msg.debug.actionResult.sql_used}
                                        </div>
                                    )}

                                    {msg.debug.actionResult && msg.debug.actionResult.success === false && (
                                        <div className="text-red-400 mt-1">
                                            [Error] {msg.debug.actionResult.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-400 animate-pulse">
                            AI가 의도를 분석하고 있습니다...
                        </div>
                    </div>
                )}
            </main>

            <footer className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                    type="text"
                    className="flex-1 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow"
                    placeholder="테스트 메시지 입력..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-full hover:bg-yellow-500 transition-colors disabled:opacity-50 shadow-sm"
                >
                    전송
                </button>
            </footer>
        </div>
    );
}
