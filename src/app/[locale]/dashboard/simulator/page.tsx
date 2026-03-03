"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
// import InventoryBarChart from "./components/InventoryBarChart";
// import InventoryPieChart from "./components/InventoryPieChart";
import InventoryTable from "./components/InventoryTable";

interface InventoryItem {
  item_name: string;
  current_stock: number;
  zone?: string;
  grade?: string;
  unit?: string;
}

export default function SimulatorPage() {
  const t = useTranslations();
  const [messages, setMessages] = useState<
    { role: string; content: string; debug?: any }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [userId, setUserId] = useState<string>("sim-tester");
  const [userUuid, setUserUuid] = useState<string>(
    "00000000-0000-0000-0000-000000000000"
  );
  const [vizData, setVizData] = useState<InventoryItem[] | null>(null);
  const [vizType, setVizType] = useState<"bar" | "pie" | "table" | "none" | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          sessionId: `sim-${userId}`,
          userId: userUuid,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      // Debug logging
      console.log("[Simulator] API Response:", data);
      console.log("[Simulator] action_result:", data.action_result);
      console.log("[Simulator] visualization_hint:", data.visualization_hint);

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

      // Update visualization data if available
      if (data.action_result?.data && data.action_result.data.length > 0) {
        console.log("[Simulator] Setting vizData:", data.action_result.data);
        console.log("[Simulator] Setting vizType:", data.visualization_hint || "bar");
        setVizData(data.action_result.data);
        setVizType(data.visualization_hint || "bar");
      } else {
        console.log("[Simulator] No visualization data - action_result.data is empty or missing");
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.name === 'AbortError'
        ? "Request timed out (30s). Please try again."
        : `${t("simulator.apiError")}: ${error.message}`;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("simulator.microphoneError"),
        },
      ]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      if (data.text) {
        setInput(data.text);
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${t("simulator.transcriptionError")}: ${error.message}`,
        },
      ]);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Render chart based on type (bar and pie charts commented out - keeping only table)
  const renderChart = () => {
    if (!vizData || vizData.length === 0 || vizType === "none") return null;

    // switch (vizType) {
    //   case "bar":
    //     return <InventoryBarChart data={vizData} />;
    //   case "pie":
    //     return <InventoryPieChart data={vizData} />;
    //   case "table":
    //     return <InventoryTable data={vizData} />;
    //   default:
    //     return <InventoryBarChart data={vizData} />;
    // }
    return <InventoryTable data={vizData} />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Single Card Container */}
      <div className="flex flex-col h-[calc(100vh-10rem)] bg-white shadow-xl border border-gray-100 rounded-3xl overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h2 className="font-bold tracking-tight">
              {t("simulator.title")}
            </h2>
          </div>
          {/* Debug: Show current vizType and data count */}
          <span className="text-xs px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30 font-medium uppercase">
            {vizData ? `${vizType} (${vizData.length})` : "no data"}
          </span>
        </header>

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
            {/* Messages */}
            <main className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-2xl mb-4 animate-bounce">
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
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-sm transition-all ${
                        msg.role === "user"
                          ? "bg-emerald-500 text-white rounded-br-none shadow-md"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <div className="markdown-container prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-xs font-medium text-emerald-600">
                      {t("simulator.loading")}
                    </span>
                  </div>
                </div>
              )}
            </main>

            {/* Input */}
            <footer className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder={isTranscribing ? t("simulator.transcribing") : t("simulator.placeholder")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isTranscribing}
                />
                {/* Microphone Button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isTranscribing}
                  className={`p-3 rounded-xl font-bold transition-all active:scale-95 ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } disabled:opacity-30`}
                  title={isRecording ? t("simulator.stopRecording") : t("simulator.startRecording")}
                >
                  {isTranscribing ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill={isRecording ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={isLoading || isTranscribing || !input.trim()}
                  className="bg-emerald-600 text-white font-bold p-3 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-30"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </footer>
          </div>

          {/* Visualization Section */}
          <div className="hidden lg:flex lg:flex-col w-[45%] bg-gray-50/50">
            {/* Visualization Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {(!vizData || vizData.length === 0 || vizType === "none") ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-700 font-semibold mb-2">
                    {t("simulator.visualization.title")}
                  </h3>
                  <p className="text-gray-400 text-sm max-w-[200px]">
                    {t("simulator.visualization.empty")}
                  </p>
                </div>
              ) : (
                <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  {renderChart()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
