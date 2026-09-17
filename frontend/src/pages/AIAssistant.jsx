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

  // Normalize literal escaped \n, \r\n, and HTML break tags
  const clean = String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // Split text into code blocks and normal text blocks
  const parts = clean.split("```");
  
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-700 break-words overflow-hidden">
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

// Sub-component: Parsed inline text blocks with scheme headers, attribute badges, headings, and lists
function FormattedTextBlock({ text }) {
  if (!text) return null;
  
  // Normalize any leftover escaped newlines
  const normalizedText = String(text)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
    
  const lines = normalizedText.split("\n");

  // Inline token renderer for **bold**, `code`, and [link](url)
  const renderInline = (str) => {
    if (!str) return "";
    const tokenRegex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
    const parts = String(str).split(tokenRegex);
    
    return parts.map((part, pIdx) => {
      if (!part) return null;
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={pIdx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code key={pIdx} className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={pIdx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue underline hover:text-[#0b3b60] font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  // Helper to check if next line looks like a scheme attribute
  const isNextLineAttribute = (startIdx) => {
    for (let j = startIdx + 1; j < lines.length && j <= startIdx + 3; j++) {
      const nextTrimmed = lines[j].trim();
      if (!nextTrimmed) continue;
      return /^\s*[-*•]?\s*(?:\*\*)?(Department|Ministry|Benefit|Benefits|Key Benefit|Why Eligible|Eligibility|Documents|How to Apply)/i.test(nextTrimmed);
    }
    return false;
  };

  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Attribute Line Detection (e.g. " - Department: Ministry...", "Benefit: Low interest loans...")
    const attrMatch = trimmed.match(
      /^\s*[-*•]?\s*(?:\*\*)?(Department|Ministry|Benefit|Benefits|Key Benefit|Key Benefits|Financial Assistance|Why Eligible\??|Eligibility|Why You Qualify|Documents Required|Documents|Required Documents|How to Apply|Process|Application Process|Next Steps|Deadline|Age Limit|Income Limit)(?:\*\*)?[:：]\s*(.*)$/i
    );

    if (attrMatch) {
      const rawKey = attrMatch[1].trim();
      const val = attrMatch[2].trim();
      const keyLower = rawKey.toLowerCase();

      let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
      let icon = "📌";
      let displayLabel = rawKey;

      if (keyLower.includes("department") || keyLower.includes("ministry")) {
        badgeClass = "bg-sky-50 text-[#0b3b60] border-sky-200";
        icon = "🏛️";
        displayLabel = "Department";
      } else if (keyLower.includes("benefit") || keyLower.includes("assistance")) {
        badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
        icon = "💰";
        displayLabel = "Benefit";
      } else if (keyLower.includes("eligib") || keyLower.includes("qualify")) {
        badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
        icon = "✅";
        displayLabel = "Eligibility";
      } else if (keyLower.includes("document")) {
        badgeClass = "bg-indigo-50 text-indigo-800 border-indigo-200";
        icon = "📄";
        displayLabel = "Documents";
      } else if (keyLower.includes("apply") || keyLower.includes("process") || keyLower.includes("next")) {
        badgeClass = "bg-blue-50 text-blue-800 border-blue-200";
        icon = "👉";
        displayLabel = "Next Steps";
      }

      elements.push(
        <div key={`attr-${i}`} className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-2.5 my-1.5 pl-3 border-l-2 border-slate-200">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide flex-shrink-0 select-none border ${badgeClass}`}>
            <span>{icon}</span> {displayLabel}
          </span>
          <span className="text-slate-700 text-xs sm:text-sm leading-relaxed">{renderInline(val)}</span>
        </div>
      );
      continue;
    }

    // 2. Scheme Title / Header detection (e.g. "- Kisan Credit Card (KCC)", "### 1. Scheme", etc.)
    const isListMarker = /^(?:[-*•]|\d+\.)\s+/.test(trimmed);
    const hasNextAttr = isNextLineAttribute(i);
    const isH3orH4 = trimmed.startsWith("### ") || trimmed.startsWith("#### ");

    if (isH3orH4 || (isListMarker && hasNextAttr)) {
      const cleanTitle = trimmed
        .replace(/^(?:#{1,4}|[-*•]|\d+\.)\s+/, "")
        .replace(/^\*\*(.*?)\*\*$/, "$1")
        .trim();

      elements.push(
        <div key={`scheme-${i}`} className="mt-4 pt-3 border-t border-slate-200/80 first:border-t-0 first:mt-1 first:pt-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-md bg-[#0b3b60] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-xs">
              🏛️
            </span>
            <h4 className="font-bold text-sm sm:text-base text-[#0b3b60] tracking-tight">
              {renderInline(cleanTitle)}
            </h4>
          </div>
        </div>
      );
      continue;
    }

    // 3. Markdown Top-Level Headers
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-base font-bold text-[#0b3b60] mt-4 mb-2 pb-1 border-b border-slate-200">
          {renderInline(trimmed.substring(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-lg font-bold text-[#0b3b60] mt-4 mb-2 pb-1 border-b border-slate-200">
          {renderInline(trimmed.substring(2))}
        </h2>
      );
      continue;
    }

    // 4. Numbered list item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`ol-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0b3b60] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <div className="text-slate-700 text-xs sm:text-sm leading-relaxed">{renderInline(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // 5. Bullet list item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const bulletContent = trimmed.replace(/^[-*•]\s+/, "");
      elements.push(
        <div key={`ul-${i}`} className="flex items-start gap-2.5 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0b3b60] mt-2 flex-shrink-0" />
          <div className="text-slate-700 text-xs sm:text-sm leading-relaxed">{renderInline(bulletContent)}</div>
        </div>
      );
      continue;
    }

    // 6. Normal paragraph text
    elements.push(
      <p key={`p-${i}`} className="my-2 text-xs sm:text-sm text-slate-700 leading-relaxed break-words font-normal">
        {renderInline(trimmed)}
      </p>
    );
  }

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

  // Load conversations list on mount / userId change
  useEffect(() => {
    const isGuest = !userId;
    const storageKey = isGuest ? "js_chat_conversations_guest" : `js_chat_conversations_${userId}`;
    const storage = isGuest ? sessionStorage : localStorage;

    const savedConvStr = storage.getItem(storageKey);
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
      storage.setItem(storageKey, JSON.stringify(loadedConv));
    }
    
    setConversations(loadedConv);
    setActiveSessionId(loadedConv[0].id);
    setFailedRequest(null);
  }, [userId]);

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
      const clean = String(text || "")
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/<br\s*\/?>/gi, "\n");
      await navigator.clipboard.writeText(clean);
      toast.success("Answer copied to clipboard!");
    } catch (e) {
      toast.error("Copy failed.");
    }
  };

  // Helper to sync conversation array to state and storage
  const saveConversations = (updatedList) => {
    setConversations(updatedList);
    const isGuest = !userId;
    const storageKey = isGuest ? "js_chat_conversations_guest" : `js_chat_conversations_${userId}`;
    const storage = isGuest ? sessionStorage : localStorage;
    storage.setItem(storageKey, JSON.stringify(updatedList));
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

  const handleActionClick = (to, actionLabel = "") => {
    if (!to && !actionLabel) return;
    const target = (to || "").trim();

    // 1. External URLs
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }

    // 2. Documents / Profile
    if (
      target.startsWith("/profile/documents") ||
      target.startsWith("/documents") ||
      target === "/profile" ||
      target.includes("document") ||
      (actionLabel && actionLabel.toLowerCase().includes("document"))
    ) {
      nav("/profile");
      return;
    }

    // 3. Eligibility Diagnostic
    if (
      target === "/eligibility" ||
      target.startsWith("/eligibility/") ||
      (actionLabel && actionLabel.toLowerCase().includes("eligibility") && !target.includes("scheme"))
    ) {
      nav("/eligibility");
      return;
    }

    // 4. Scheme UUID or numeric ID detection
    const uuidMatch = target.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
    const numIdMatch = target.match(/\/schemes?\/(\d+)/i);
    const schemeId = uuidMatch ? uuidMatch[1] : (numIdMatch ? numIdMatch[1] : null);

    if (schemeId) {
      const isGuideOrApply = 
        target.includes("/guide") || 
        target.includes("/apply") || 
        (actionLabel && (actionLabel.toLowerCase().includes("apply") || actionLabel.toLowerCase().includes("how to")));
      nav(`/scheme/${schemeId}${isGuideOrApply ? "?tab=process" : ""}`);
      return;
    }

    // 5. Standard scheme or search directories
    if (target === "/schemes" || target === "/browse" || target === "/search") {
      nav("/search");
      return;
    }

    if (target.startsWith("/search?") || target.startsWith("/schemes?")) {
      nav(target.replace("/schemes?", "/search?"));
      return;
    }

    // 6. Named scheme slug or keyword (e.g. /schemes/crop-insurance, /scheme/mudra)
    const slugMatch = target.match(/\/schemes?\/(?:guide\/|apply\/)?([a-zA-Z0-9_-]+)/i);
    if (slugMatch && !["guide", "apply", "search", "details"].includes(slugMatch[1].toLowerCase())) {
      nav(`/search?q=${encodeURIComponent(slugMatch[1].replace(/[-_]/g, " "))}`);
      return;
    }

    // 7. Keyword fallback from actionLabel
    if (actionLabel) {
      const cleanKeyword = actionLabel
        .replace(/^(Learn How to Apply for|Check Eligibility for|Explore|Apply for|Support for)\s+/i, "")
        .replace(/\s*\([^)]*\)/g, "")
        .trim();
      if (cleanKeyword.length > 2) {
        nav(`/search?q=${encodeURIComponent(cleanKeyword)}`);
        return;
      }
    }

    nav(target || "/search");
  };  return (
    <div className="h-full flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs min-h-0" data-testid="ai-assistant">
      {/* Tricolor line */}
      <div className="w-full h-1 flex flex-shrink-0 border-b border-slate-200">
        <div className="h-full flex-1 bg-[#FF9933]" />
        <div className="h-full flex-1 bg-slate-100" />
        <div className="h-full flex-1 bg-[#138808]" />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar toggle button (Mobile Only) */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-28 right-6 z-55 w-12 h-12 rounded-full bg-[#0b3b60] text-white grid place-items-center shadow-lg active:scale-95 transition-transform"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* History Sidebar Panel */}
        <aside className={`w-72 border-r border-slate-200 bg-white flex flex-col flex-shrink-0 transition-transform duration-300 z-50 lg:translate-x-0 lg:static fixed top-0 bottom-0 left-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {/* Sidebar Header */}
          <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
            <h3 className="font-display font-bold text-xs text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#0b3b60]" /> Consultation History
            </h3>
            <button
              onClick={() => startNewConversation()}
              className="p-1.5 rounded-lg text-[#0b3b60] bg-blue-50 hover:bg-[#0b3b60] hover:text-white transition-colors cursor-pointer"
              title="Start New Conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
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
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border text-xs ${
                    isActive 
                      ? "bg-blue-50 border-blue-200 text-[#0b3b60] font-semibold" 
                      : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-[#0b3b60]" : "text-slate-400"}`} />
                    <span className="truncate">{conv.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <button
              onClick={handleClearActiveChat}
              className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Session
            </button>
          </div>
        </aside>

        {/* Main Chat Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
          
          {/* Workspace Header */}
          <header className="h-16 px-4 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-[#0b3b60] grid place-items-center text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-sm text-slate-900 leading-tight">साथी AI / Saathi Assistant</h2>
                  <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                    भारत सरकार
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> National Scheme & Direct Benefit Intelligence
                </p>
              </div>
            </div>
            
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0b3b60] border border-blue-200">
              <Sparkles className="w-3 h-3 text-amber-500" /> 22 Official Languages
            </span>
          </header>

        {/* Message Logs Area */}
        <section className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0" data-testid="chat-messages">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            
            return (
              <div key={i} className={`flex gap-3 items-end ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-indigo-700 grid place-items-center text-white flex-shrink-0 mb-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div className={`max-w-[85%] space-y-2 group relative min-w-0 break-words`}>
                  {/* Chat bubble card */}
                  <div className={`p-4 shadow-sm border ${
                    isUser 
                      ? "bg-[#0b3b60] text-white border-[#07253d] rounded-2xl rounded-br-xs" 
                      : "bg-white text-slate-800 border-slate-200 rounded-2xl rounded-bl-xs"
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
                          onClick={() => handleActionClick(action.to, action.label)}
                          className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-lg bg-[#0b3b60] text-white text-xs font-semibold hover:bg-[#07253d] transition-colors shadow-xs cursor-pointer"
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
        <footer className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
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
              className="w-10 h-10 rounded-xl bg-[#0b3b60] hover:bg-[#07253d] text-white grid place-items-center disabled:opacity-40 transition-colors flex-shrink-0 active:scale-95 cursor-pointer shadow-xs"
            >
              {typing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </footer>
      </main>
      </div>
    </div>
  );
}
