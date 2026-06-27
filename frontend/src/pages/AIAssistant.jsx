import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Send, Mic, Sparkles, Bot, ArrowUpRight, ShieldCheck, Loader2 } from "lucide-react";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";

const INITIAL_GREETING = "Namaste! 🙏 I'm Saathi, your JanSahay AI assistant. I can help you search government schemes, check eligibility criteria, and find application links. What are you looking for today?";

const SUGGESTIONS = [
  "What schemes qualify for low-income farmers?",
  "Tell me about PM Kisan Samman Nidhi",
  "Scholarships for high school students",
  "LPG cylinder subsidy schemes for women",
];

// Helper function to safely render basic markdown features (bold and bullet lists) inline
function formatMessageText(text) {
  if (!text) return "";
  
  // Simple regex replacements for bold and list items
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-brand-ink'>$1</strong>")
    // Bullet points: * item or - item -> styled list item
    .replace(/^\s*[-*]\s+(.*)$/gm, "<li class='ml-5 list-disc my-1 text-slate-700'>$1</li>")
    // Line breaks
    .replace(/\n/g, "<br />");

  return <div className="space-y-1 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default function AIAssistant() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([
    { role: "ai", text: INITIAL_GREETING }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  // If redirected with a specific search query (like from Scheme Details)
  const initialQuery = searchParams.get("q");
  
  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || typing) return;

    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      // Send chat payload to FastAPI -> n8n workflow
      const response = await aiService.sendChatMessage(text, messages);
      
      const aiReply = {
        role: "ai",
        text: response?.reply || response?.text || "I processed your request, but did not receive a valid text response. Please check your n8n workflow configurations.",
        schemes: response?.schemes || [],
        cta: response?.cta || null
      };
      
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I am having trouble connecting to Saathi servers. Please check if your FastAPI server is active and n8n webhook nodes are properly authenticated."
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto" data-testid="ai-assistant">
      
      {/* Assistant Header */}
      <div className="card-soft p-4 mb-4 flex items-center justify-between border border-slate-100 shadow-sm bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-blue to-indigo-700 grid place-items-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-green ring-2 ring-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-brand-ink">Saathi Chat</h2>
            <p className="text-[10px] text-brand-green font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Government AI Nodal Assistant
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 chip bg-brand-blueLight text-brand-blue text-[10px] font-bold">
          <Sparkles className="w-3 h-3 text-brand-orange animate-pulse" /> Multilingual Support
        </span>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0 py-2" data-testid="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "ai" ? "items-end" : "items-end justify-end"}`}>
            {m.role === "ai" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-blue to-indigo-700 grid place-items-center text-white flex-shrink-0 mb-1">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className="max-w-[80%] space-y-2">
              <div className={m.role === "ai"
                ? "bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 text-brand-ink shadow-sm"
                : "bg-brand-blue text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-md"
              }>
                {formatMessageText(m.text)}
              </div>

              {/* Renders scheme cards if the assistant returns matched scheme summaries */}
              {m.schemes && m.schemes.length > 0 && (
                <div className="grid gap-2 pt-1">
                  {m.schemes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => nav(`/scheme/${s.id}`)}
                      data-testid={`ai-scheme-${s.id}`}
                      className="card-soft card-soft-hover p-4 flex items-center gap-3 text-left border border-slate-100 bg-white"
                    >
                      <div className="w-9 h-9 rounded-lg bg-brand-blueLight text-brand-blue grid place-items-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-brand-orange" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-brand-ink text-xs truncate leading-tight">{s.title}</p>
                        <p className="text-[10px] text-brand-muted truncate mt-0.5">{s.benefit} · {s.department}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-brand-blue flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Renders call-to-actions if supplied by the model */}
              {m.cta && (
                <button
                  onClick={() => nav(m.cta.to)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-blue-750 transition-colors shadow"
                >
                  {m.cta.label} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {typing && (
          <div className="flex items-end gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-blue to-indigo-700 grid place-items-center text-white flex-shrink-0 mb-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center shadow-sm" data-testid="typing-indicator">
              {[0, 1, 2].map(n => (
                <span key={n} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${n * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mt-4 py-2 border-t" data-testid="ai-suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="chip bg-white border border-slate-200 hover:border-brand-blue hover:text-brand-blue text-slate-750 transition-colors py-1.5 text-xs font-medium cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* TextInput Panel */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="mt-4 card-soft p-2.5 flex items-center gap-2 border border-slate-100 shadow-lg bg-white"
        data-testid="chat-input-form"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in English, हिन्दी, தமிழ், update demographic eligibility..."
          className="flex-1 px-3 h-11 bg-transparent outline-none text-brand-ink text-sm"
          data-testid="chat-input"
          disabled={typing}
        />
        <button 
          type="button" 
          onClick={() => toast.info("Voice recognition module is loading...")}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors" 
          data-testid="voice-input"
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!input.trim() || typing}
          data-testid="chat-send"
          className="w-11 h-11 rounded-xl bg-brand-blue text-white grid place-items-center hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
