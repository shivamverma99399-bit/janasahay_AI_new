import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Send,
  Mic,
  Sparkles,
  Bot,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  MessageSquare,
  Menu,
  X,
  Info,
  HelpCircle
} from "lucide-react";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

const INITIAL_GREETING = "Namaste! 🙏 I'm Saathi, your JanSahay AI assistant. I can help you search government schemes, check eligibility criteria, and find application links. What are you looking for today?";

const SUGGESTIONS = [
  "What schemes qualify for low-income farmers?",
  "Tell me about PM Kisan Samman Nidhi",
  "Scholarships for high school students",
  "LPG cylinder subsidy schemes for women",
];

// Helper: Custom Markdown & Code Block renderer in plain React
function Markdown({ text }) {
  if (!text) return null;

  // 1. Split text into code blocks and normal text blocks
  const parts = text.split("```");
  
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
      {parts.map((part, index) => {
        const isCodeBlock = index % 2 === 1;
        
        if (isCodeBlock) {
          // Separate language header and actual code lines
          const lines = part.split("\n");
          const firstLine = lines[0].trim();
          const language = ["python", "json", "javascript", "js", "html", "css", "bash"].includes(firstLine.toLowerCase()) ? firstLine : "";
          const code = language ? lines.slice(1).join("\n").trim() : part.trim();
          
          return <CodeBlock key={index} code={code} language={language} />;
        } else {
          return <FormattedTextBlock key={index} text={part} />;
        }
      })}
    </div>
  );
}

// Sub-component: Copyable code block
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error("Failed to copy code.");
    }
  };
  
  return (
    <div className="relative border border-slate-200 rounded-xl overflow-hidden my-2 bg-slate-900 shadow-inner font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-400 border-b border-slate-700 select-none">
        <span className="font-bold uppercase tracking-wider text-[10px]">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-slate-750 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-100 max-h-72">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Sub-component: Parsed inline text blocks with headings, lists, tables, bold styling
function FormattedTextBlock({ text }) {
  if (!text) return null;
  
  const lines = text.split("\n");
  const elements = [];
  let currentList = [];
  let listType = null; // 'ul' or 'ol'
  
  const flushList = (keyIndex) => {
    if (currentList.length > 0) {
      if (listType === "ul") {
        elements.push(
          <ul key={`ul-${keyIndex}`} className="list-disc pl-6 space-y-1 my-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-slate-700">{renderInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${keyIndex}`} className="list-decimal pl-6 space-y-1 my-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-slate-700">{renderInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const renderInline = (str) => {
    if (!str) return "";
    
    // Parse bold "**text**" -> <strong>
    // Parse inline code "`code`" -> <code>
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;
    
    let parts = [str];
    
    // Process Bold
    let boldMatches;
    let boldParts = [];
    parts.forEach(part => {
      if (typeof part !== "string") {
        boldParts.push(part);
        return;
      }
      let lastIndex = 0;
      let match;
      boldRegex.lastIndex = 0;
      while ((match = boldRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          boldParts.push(part.substring(lastIndex, match.index));
        }
        boldParts.push(<strong key={match.index} className="font-bold text-brand-ink">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < part.length) {
        boldParts.push(part.substring(lastIndex));
      }
    });
    parts = boldParts;
    
    // Process Inline Code
    let codeParts = [];
    parts.forEach((part, pIdx) => {
      if (typeof part !== "string") {
        codeParts.push(part);
        return;
      }
      let lastIndex = 0;
      let match;
      codeRegex.lastIndex = 0;
      while ((match = codeRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          codeParts.push(part.substring(lastIndex, match.index));
        }
        codeParts.push(<code key={`${pIdx}-${match.index}`} className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded font-mono text-xs">{match[1]}</code>);
        lastIndex = codeRegex.lastIndex;
      }
      if (lastIndex < part.length) {
        codeParts.push(part.substring(lastIndex));
      }
    });
    
    return codeParts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // 1. Headers
    if (trimmed.startsWith("### ")) {
      flushList(i);
      elements.push(<h4 key={i} className="text-sm font-bold text-brand-ink mt-3 mb-1">{renderInline(trimmed.substring(4))}</h4>);
    } else if (trimmed.startsWith("## ")) {
      flushList(i);
      elements.push(<h3 key={i} className="text-base font-bold text-brand-ink mt-4 mb-2">{renderInline(trimmed.substring(3))}</h3>);
    } else if (trimmed.startsWith("# ")) {
      flushList(i);
      elements.push(<h2 key={i} className="text-lg font-bold text-brand-ink mt-4 mb-2">{renderInline(trimmed.substring(2))}</h2>);
    }
    // 2. Lists
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType && listType !== "ul") flushList(i);
      listType = "ul";
      currentList.push(trimmed.substring(2));
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (listType && listType !== "ol") flushList(i);
      listType = "ol";
      const content = trimmed.replace(/^\d+\.\s+/, "");
      currentList.push(content);
    }
    // 3. Normal paragraph
    else {
      flushList(i);
      if (trimmed) {
        elements.push(<p key={i} className="my-1.5">{renderInline(trimmed)}</p>);
      }
    }
  }
  flushList(lines.length);
  
  return <div className="space-y-1">{elements}</div>;
}

export default function AIAssistant() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { userId } = useApp();
  
  const guestUserId = localStorage.getItem("js_guest_user_id");
  const activeUserId = userId || guestUserId || "user_001";
  
  // Persistent conversations store
  const [conversations, setConversations] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [failedRequest, setFailedRequest] = useState(null); // stores failed text for retry
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef(null);

  const activeQuery = searchParams.get("q");

  // Load conversations list on mount
  useEffect(() => {
    const savedConvStr = localStorage.getItem("js_chat_conversations");
    let loadedConv = [];
    if (savedConvStr) {
      try {
        loadedConv = JSON.parse(savedConvStr);
      } catch (e) {}
    }
    
    if (loadedConv.length === 0) {
      // Create initial conversation session
      const initialSessionId = `session_${Date.now()}`;
      loadedConv = [{
        id: initialSessionId,
        title: "New Conversation",
        messages: [{
          role: "ai",
          answer: INITIAL_GREETING,
          matchedSchemes: [],
          eligibility: [],
          recommendedActions: [],
          confidence: 1.0,
          sources: []
        }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      localStorage.setItem("js_chat_conversations", JSON.stringify(loadedConv));
    }
    
    setConversations(loadedConv);
    setActiveSessionId(loadedConv[0].id);
  }, []);

  // Handle external redirect queries (e.g. from Scheme details card button click)
  useEffect(() => {
    if (activeQuery && activeSessionId) {
      // Find active conversation messages
      const activeConv = conversations.find(c => c.id === activeSessionId);
      const isNewConv = activeConv && activeConv.messages.length <= 1;
      
      if (isNewConv) {
        handleSend(activeQuery);
      } else {
        // Create new session to separate contextual inquiries
        startNewConversation(activeQuery);
      }
      
      // Clean query string to prevent loops
      nav("/ai", { replace: true });
    }
  }, [activeQuery, activeSessionId]);

  // Scroll to bottom helper
  const activeConversation = conversations.find(c => c.id === activeSessionId);
  const messages = activeConversation ? activeConversation.messages : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Copy individual bot message response text
  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Message copied to clipboard!");
    } catch (e) {
      toast.error("Copy failed.");
    }
  };

  // Helper to sync conversation array to state and localStorage
  const saveConversations = (updatedList) => {
    setConversations(updatedList);
    localStorage.setItem("js_chat_conversations", JSON.stringify(updatedList));
  };

  // Start new empty conversation session
  const startNewConversation = (initialQuery = "") => {
    const newSessionId = `session_${Date.now()}`;
    const newConvObj = {
      id: newSessionId,
      title: initialQuery ? (initialQuery.length > 25 ? initialQuery.substring(0, 25) + "..." : initialQuery) : "New Conversation",
      messages: [{
        role: "ai",
        answer: INITIAL_GREETING,
        matchedSchemes: [],
        eligibility: [],
        recommendedActions: [],
        confidence: 1.0,
        sources: []
      }],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedList = [newConvObj, ...conversations];
    saveConversations(updatedList);
    setActiveSessionId(newSessionId);
    setSidebarOpen(false);
    
    if (initialQuery) {
      // Trigger API fetch for initialQuery inside new conversation context
      handleSend(initialQuery, newSessionId);
    }
  };

  // Delete dynamic conversation session
  const handleDeleteConversation = (sessionId, e) => {
    e.stopPropagation();
    const filtered = conversations.filter(c => c.id !== sessionId);
    
    if (filtered.length === 0) {
      // Re-initialize default session if all conversations were cleared
      const defaultId = `session_${Date.now()}`;
      const defaultConv = [{
        id: defaultId,
        title: "New Conversation",
        messages: [{
          role: "ai",
          answer: INITIAL_GREETING,
          matchedSchemes: [],
          eligibility: [],
          recommendedActions: [],
          confidence: 1.0,
          sources: []
        }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      saveConversations(defaultConv);
      setActiveSessionId(defaultId);
    } else {
      saveConversations(filtered);
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
    }
    toast.info("Conversation deleted.");
  };

  // Clear chat logs (except greeting) in active session
  const handleClearActiveChat = async () => {
    if (!activeSessionId) return;
    try {
      await aiService.clearChat(activeSessionId);
    } catch(e) {}
    
    const updatedList = conversations.map(c => {
      if (c.id === activeSessionId) {
        return {
          ...c,
          title: "New Conversation",
          messages: [{
            role: "ai",
            answer: INITIAL_GREETING,
            matchedSchemes: [],
            eligibility: [],
            recommendedActions: [],
            confidence: 1.0,
            sources: []
          }]
        };
      }
      return c;
    });
    saveConversations(updatedList);
    setFailedRequest(null);
    toast.success("Conversation messages cleared.");
  };

  // Send message orchestration
  const handleSend = async (textToSend, sessionIdOverride = null) => {
    const text = (textToSend || input).trim();
    if (!text || typing) return;

    const targetSessionId = sessionIdOverride || activeSessionId;
    if (!targetSessionId) return;

    // Build the user message element
    const userMsg = {
      role: "user",
      answer: text
    };

    // Update state to render message instantly
    let updatedConvList = conversations.map(c => {
      if (c.id === targetSessionId) {
        // Set title dynamically based on first question
        const newTitle = c.messages.length <= 1 
          ? (text.length > 25 ? text.substring(0, 25) + "..." : text)
          : c.title;
        return {
          ...c,
          title: newTitle,
          messages: [...c.messages, userMsg]
        };
      }
      return c;
    });
    
    saveConversations(updatedConvList);
    setInput("");
    setTyping(true);
    setFailedRequest(null);

    try {
      // Perform HTTP request to FastAPI backend
      const response = await aiService.sendChatMessage(text, messages, activeUserId, targetSessionId);
      
      const aiReply = {
        role: "ai",
        answer: response.answer || "I processed your request, but did not receive a valid text response. Please check configurations.",
        matchedSchemes: response.matchedSchemes || [],
        eligibility: response.eligibility || [],
        recommendedActions: response.recommendedActions || [],
        confidence: response.confidence || 0.95,
        sources: response.sources || []
      };

      updatedConvList = updatedConvList.map(c => {
        if (c.id === targetSessionId) {
          return {
            ...c,
            messages: [...c.messages, aiReply]
          };
        }
        return c;
      });
      saveConversations(updatedConvList);
    } catch (err) {
      console.error(err);
      setFailedRequest(text); // save query for retry
      
      const errorReply = {
        role: "ai",
        isError: true,
        answer: "I am having trouble connecting to Saathi servers. Please check if your backend FastAPI server is active, authenticated, and online."
      };
      
      updatedConvList = updatedConvList.map(c => {
        if (c.id === targetSessionId) {
          return {
            ...c,
            messages: [...c.messages, errorReply]
          };
        }
        return c;
      });
      saveConversations(updatedConvList);
    } finally {
      setTyping(false);
    }
  };

  const handleRetry = () => {
    if (failedRequest) {
      // Remove the last error block from list for clean history logs
      const activeConv = conversations.find(c => c.id === activeSessionId);
      if (activeConv) {
        const cleanedMsgs = activeConv.messages.filter(m => !m.isError);
        // Also remove the user query since handleSend will append it again
        if (cleanedMsgs[cleanedMsgs.length - 1]?.role === "user") {
          cleanedMsgs.pop();
        }
        const updatedList = conversations.map(c => {
          if (c.id === activeSessionId) {
            return { ...c, messages: cleanedMsgs };
          }
          return c;
        });
        setConversations(updatedList);
      }
      
      const text = failedRequest;
      setFailedRequest(null);
      handleSend(text);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm" data-testid="ai-assistant">
      
      {/* Sidebar toggle button (Mobile Only) */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-28 right-6 z-55 w-12 h-12 rounded-full bg-brand-blue text-white grid place-items-center shadow-lg active:scale-95 transition-transform"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* History Sidebar Panel */}
      <aside className={`w-72 border-r border-slate-200 bg-white flex flex-col flex-shrink-0 transition-transform duration-300 z-50 lg:translate-x-0 lg:static fixed top-0 bottom-0 left-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-brand-ink flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-blue" /> Chat History
          </h3>
          <button
            onClick={() => startNewConversation()}
            className="p-1.5 rounded-lg text-brand-blue bg-brand-blueLight hover:bg-brand-blue hover:text-white transition-colors cursor-pointer"
            title="Start New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {conversations.map((conv) => {
            const isActive = conv.id === activeSessionId;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveSessionId(conv.id);
                  setSidebarOpen(false);
                  setFailedRequest(null);
                }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  isActive 
                    ? "bg-brand-blueLight border-blue-200 text-brand-blue" 
                    : "border-transparent text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-brand-blue" : "text-slate-400"}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? "text-brand-ink" : "text-slate-700"}`}>
                      {conv.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{conv.timestamp}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 p-1 rounded transition-all cursor-pointer"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleClearActiveChat}
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Clear Current Chat
          </button>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Glassmorphism Workspace Header */}
        <header className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-blue to-indigo-700 grid place-items-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-green ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-sm text-brand-ink">Saathi Chat</h2>
                {activeConversation && activeConversation.messages.length > 1 && (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    Active Session
                  </span>
                )}
              </div>
              <p className="text-[10px] text-brand-green font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Government AI Nodal Assistant
              </p>
            </div>
          </div>
          
          <span className="inline-flex items-center gap-1.5 chip bg-brand-blueLight text-brand-blue text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-brand-orange animate-pulse" /> Multilingual Support
          </span>
        </header>

        {/* Message Logs Area */}
        <section className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" data-testid="chat-messages">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            
            return (
              <div key={i} className={`flex gap-3 items-end ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-indigo-700 grid place-items-center text-white flex-shrink-0 mb-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div className={`max-w-[80%] space-y-2 group relative`}>
                  {/* Chat bubble card */}
                  <div className={`p-4 shadow-sm border ${
                    isUser 
                      ? "bg-brand-blue text-white border-blue-600 rounded-3xl rounded-br-sm shadow-blue-100" 
                      : "bg-white text-slate-800 border-slate-100 rounded-3xl rounded-bl-sm"
                  }`}>
                    {/* Render Main Explanation */}
                    {isUser ? (
                      <p className="text-sm font-medium whitespace-pre-line leading-relaxed">{m.answer}</p>
                    ) : (
                      <Markdown text={m.answer} />
                    )}

                    {/* Quality badge & clipboard copy icons */}
                    {!isUser && !m.isError && (
                      <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-2 text-[10px] text-slate-400 select-none">
                        <span className="flex items-center gap-1 font-medium">
                          <Info className="w-3 h-3 text-slate-400" /> Confidence: {(m.confidence * 100).toFixed(0)}%
                        </span>
                        <button
                          onClick={() => handleCopyMessage(m.answer)}
                          className="opacity-0 group-hover:opacity-100 hover:text-brand-blue p-1 rounded transition-all cursor-pointer flex items-center gap-1"
                          title="Copy Answer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Renders scheme cards if the assistant returned scheme suggestions */}
                  {m.matchedSchemes && m.matchedSchemes.length > 0 && (
                    <div className="grid gap-2 pt-1.5 w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Suggested Schemes</p>
                      {m.matchedSchemes.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => nav(`/scheme/${s.id}`)}
                          data-testid={`ai-scheme-${s.id}`}
                          className="card-soft card-soft-hover p-4 flex items-center justify-between text-left border border-slate-100 bg-white hover:bg-slate-50 transition-colors w-full shadow-sm rounded-xl cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-brand-blueLight text-brand-blue grid place-items-center flex-shrink-0 shadow-sm border border-blue-50">
                              <Sparkles className="w-4 h-4 text-brand-orange" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-display font-bold text-brand-ink text-xs truncate leading-tight">{s.title}</p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{s.benefit} · {s.department}</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-brand-blue flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Renders Eligibility breakdown reports */}
                  {m.eligibility && m.eligibility.length > 0 && (
                    <div className="space-y-2 pt-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Eligibility Details</p>
                      {m.eligibility.map((report, rIdx) => {
                        const scoreColor = report.eligible ? "text-brand-green bg-green-50 border-green-200" : "text-brand-orange bg-orange-50 border-orange-200";
                        return (
                          <div key={rIdx} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700">{report.schemeName}</span>
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${scoreColor}`}>
                                {report.eligible ? "Eligible" : "Needs Review"}
                              </span>
                            </div>
                            
                            {/* Positive matches */}
                            {report.reasons && report.reasons.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Qualifying Factors:</p>
                                <div className="flex flex-wrap gap-1">
                                  {report.reasons.map((r, ri) => (
                                    <span key={ri} className="bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-[10px] text-slate-500">
                                      ✓ {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Blockers */}
                            {!report.eligible && report.failedChecks && report.failedChecks.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-red-400 uppercase">Disqualifying Factors:</p>
                                <div className="flex flex-wrap gap-1">
                                  {report.failedChecks.map((f, fi) => (
                                    <span key={fi} className="bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[10px] text-red-500 font-semibold">
                                      ✗ {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Render inline call-to-action redirect buttons */}
                  {m.recommendedActions && m.recommendedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.recommendedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => nav(action.to)}
                          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-blue-750 transition-colors shadow-sm cursor-pointer"
                        >
                          {action.label} <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Render Retry button on failed messages */}
                  {m.isError && (
                    <div className="pt-1">
                      <button
                        onClick={handleRetry}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 text-xs font-bold transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Animated typing dots */}
          {typing && (
            <div className="flex items-end gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-indigo-700 grid place-items-center text-white flex-shrink-0 mb-1 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border rounded-3xl rounded-bl-sm px-4 py-3 flex gap-1 items-center shadow-sm" data-testid="typing-indicator">
                {[0, 1, 2].map(n => (
                  <span key={n} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${n * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          
          <div ref={endRef} />
        </section>

        {/* Suggestion Chips Panel */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-white" data-testid="ai-suggestions">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="chip bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-brand-blue hover:text-brand-blue text-slate-650 transition-colors py-1.5 px-3 rounded-xl text-xs font-medium cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Panel Form */}
        <footer className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 border border-slate-200 rounded-2xl p-1 bg-slate-50 focus-within:bg-white focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm"
            data-testid="chat-input-form"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in English, हिन्दी, or check scheme eligibility..."
              className="flex-1 px-3 h-11 bg-transparent outline-none text-brand-ink text-sm"
              data-testid="chat-input"
              disabled={typing}
            />
            
            <button 
              type="button" 
              onClick={() => toast.info("Voice recognition module is currently offline.")}
              className="p-2.5 rounded-xl hover:bg-slate-150 text-slate-450 hover:text-slate-700 transition-colors cursor-pointer" 
              data-testid="voice-input"
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <button
              type="submit"
              disabled={!input.trim() || typing}
              data-testid="chat-send"
              className="w-11 h-11 rounded-xl bg-brand-blue text-white grid place-items-center hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0 active:scale-95 cursor-pointer"
            >
              {typing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}
