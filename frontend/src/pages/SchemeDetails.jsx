import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Bookmark, Share2, FileText, CheckCircle2,
  ChevronRight, Star, Users, Calendar, Building2, IndianRupee,
  Sparkles, Bot, Send, Loader2, Globe, HelpCircle
} from "lucide-react";
import { schemeService } from "@/services/schemeService";
import { aiService } from "@/services/aiService";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

const getRequiredDocuments = (schemeName) => {
  const name = String(schemeName).toLowerCase();
  if (name.includes("kisan") || name.includes("soil") || name.includes("fasal")) {
    return ["Aadhaar Card", "Bank Passbook", "Land Record"];
  }
  if (name.includes("scholarship") || name.includes("pragati") || name.includes("yasasvi")) {
    if (name.includes("saksham")) {
      return ["Aadhaar Card", "Disability Certificate", "Bank Passbook"];
    }
    return ["Aadhaar Card", "Income Certificate", "Caste Certificate", "Bank Passbook"];
  }
  if (name.includes("mudra") || name.includes("startup") || name.includes("stand-up") || name.includes("pmegp")) {
    if (name.includes("stand-up")) {
      return ["Aadhaar Card", "PAN Card", "Bank Passbook", "Caste Certificate"];
    }
    return ["Aadhaar Card", "PAN Card", "Bank Passbook"];
  }
  if (name.includes("sukanya") || name.includes("beti")) {
    return ["Aadhaar Card", "Bank Passbook", "Passport Size Photograph"];
  }
  if (name.includes("ayushman")) {
    return ["Aadhaar Card", "Domicile Certificate", "Income Certificate"];
  }
  return ["Aadhaar Card", "Bank Passbook", "Income Certificate"];
};

export default function SchemeDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const { userId } = useApp();

  // AI Assistant panel local state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch scheme details dynamically by searching the full list locally
  const { data: scheme, isLoading, isError } = useQuery({
    queryKey: ["schemeDetails", id],
    queryFn: () => schemeService.getSchemeById(id),
    enabled: !!id,
  });

  // Auto-scroll chat panel
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiTyping]);

  // Set initial AI message once scheme details are loaded
  useEffect(() => {
    if (scheme) {
      const title = scheme.title || scheme.scheme_name || "this scheme";
      setChatMessages([
        {
          role: "ai",
          text: `Namaste! 🙏 I can answer any questions you have about the "${title}" scheme. For example, you can ask about eligibility exceptions, specific document details, or the application process.`
        }
      ]);
    }
  }, [scheme]);

  const handleBookmarkToggle = async () => {
    try {
      const nextState = !isSaved;
      setIsSaved(nextState);
      await schemeService.toggleSaveScheme(scheme.id);
      if (nextState) {
        toast.success("Scheme saved successfully");
      } else {
        toast.info("Scheme removed from saved list");
      }
    } catch (err) {
      setIsSaved((prev) => !prev);
      toast.error("Failed to update bookmark status.");
    }
  };

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
    setChatInput("");
    setIsAiTyping(true);

    try {
      const title = scheme.title || scheme.scheme_name || "Scheme";
      const department = scheme.department || "Government of India";
      const benefit = scheme.benefit || "evaluated support";
      
      const contextPrompt = `Regarding the scheme "${title}" (Department: ${department}, Benefits: ${benefit}): ${userText}`;
      const response = await aiService.sendChatMessage(contextPrompt, chatMessages, userId || "user_001");
      
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: response?.reply || response?.text || "I processed your request, but did not receive a valid response format. Please try again." }
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I am unable to contact the Saathi AI server right now. Please verify backend API service connections." }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
        <p className="text-sm font-semibold text-brand-muted">Fetching scheme specifications...</p>
      </div>
    );
  }

  if (isError || !scheme) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-800">Scheme not found</h2>
        <p className="text-sm text-brand-muted">
          The requested scheme specifications could not be retrieved from the server. Check your FastAPI connection endpoints.
        </p>
        <button onClick={() => nav("/search")} className="px-6 py-2.5 rounded-xl bg-brand-blue text-white font-medium hover:bg-blue-700 transition-colors">
          Back to Scheme Explorer
        </button>
      </div>
    );
  }

  // Schema fallback fields to support both static DB schemes and dynamically matched schemes
  const schemeTitle = scheme.title || scheme.scheme_name || "Newly Discovered Scheme";
  const schemeDept = scheme.department || "Government of India";
  const schemeBenefitFull = scheme.benefit_full || scheme.description || "";
  const schemeState = scheme.state || "All India";
  const schemeCategory = scheme.category || "General";
  const schemeBenefit = scheme.benefit || "AI evaluated benefits";
  const schemeBeneficiaries = scheme.beneficiaries || "N/A";
  const schemeDeadline = scheme.deadline || "Ongoing";
  const schemeRating = scheme.rating || "4.5";
  
  const schemeEligibility = Array.isArray(scheme.eligibility) 
    ? scheme.eligibility 
    : (scheme.eligibility_criteria ? [scheme.eligibility_criteria] : []);
    
  const reqDocs = getRequiredDocuments(schemeTitle);
  const docKey = userId ? `js_user_documents_${userId}` : "js_user_documents_guest";
  const userDocs = React.useMemo(() => {
    try {
      const savedDocs = localStorage.getItem(docKey);
      return savedDocs ? JSON.parse(savedDocs) : [];
    } catch (e) {
      return [];
    }
  }, [userId, docKey]);

  const hasCount = reqDocs.filter(d => userDocs.includes(d)).length;
  const completionPercent = reqDocs.length > 0 ? Math.round((hasCount / reqDocs.length) * 100) : 0;
  const missingDocs = reqDocs.filter(d => !userDocs.includes(d));
    
  const schemeSteps = Array.isArray(scheme.steps)
    ? scheme.steps
    : ["Navigate to the official portal website", "Submit your verified identity credentials", "Review status and receive disbursements"];
    
  const schemeFaqs = Array.isArray(scheme.faqs) ? scheme.faqs : [];
  const officialUrl = scheme.official_website || "https://india.gov.in";

  return (
    <div className="space-y-8 animate-fade-in-up pb-48 lg:pb-36" data-testid="scheme-details">
      
      {/* Back button */}
      <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-muted hover:text-brand-ink transition-colors" data-testid="back-button">
        <ArrowLeft className="w-4 h-4" /> Back to schemes
      </button>

      {/* Title Hero Banner */}
      <section className="card-soft p-6 sm:p-8 md:p-10 border border-slate-100 bg-gradient-to-br from-white via-blue-50/10 to-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blueLight/20 rounded-bl-full -z-10" />
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-brand-blueLight text-brand-blue text-xs font-semibold uppercase">{schemeState}</span>
              <span className="chip bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase">{schemeCategory}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-ink tracking-tight leading-tight">
              {schemeTitle}
            </h1>
            <p className="text-brand-muted flex items-center gap-2 text-sm font-medium">
              <Building2 className="w-4 h-4 text-slate-400" /> {schemeDept}
            </p>
            <p className="text-slate-650 text-base leading-relaxed max-w-3xl pt-2">
              {schemeBenefitFull}
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={handleBookmarkToggle}
                data-testid="detail-save"
                className={`h-11 px-5 rounded-xl border-2 font-medium flex items-center gap-2 transition-all active:scale-95 ${
                  isSaved ? "border-brand-orange bg-brand-orangeLight text-brand-orange" : "border-slate-200 text-brand-ink hover:border-brand-blue hover:text-brand-blue"
                }`}
              >
                <Bookmark className="w-4.5 h-4.5" fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved" : "Save Scheme"}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Scheme link copied to clipboard!");
                }}
                className="h-11 px-5 rounded-xl border-2 border-slate-200 text-brand-ink hover:border-brand-blue hover:text-brand-blue font-medium flex items-center gap-2 transition-colors active:scale-95"
              >
                <Share2 className="w-4.5 h-4.5" /> Share
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="lg:w-80 grid grid-cols-2 gap-3 w-full flex-shrink-0">
            <MetricStat label="Benefit" value={schemeBenefit} icon={IndianRupee} tone="green" />
            <MetricStat label="Beneficiaries" value={schemeBeneficiaries} icon={Users} tone="blue" />
            <MetricStat label="Deadline" value={schemeDeadline} icon={Calendar} tone="orange" />
            <MetricStat label="User Rating" value={schemeRating ? `${schemeRating}/5` : "4.5/5"} icon={Star} tone="amber" />
          </div>
        </div>
      </section>

      {/* Main Grid: Details tabs + AI Scheme Assistant Panel */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Scheme specifications Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl h-auto grid grid-cols-4 w-full" data-testid="detail-tabs">
              <TabsTrigger value="overview" data-testid="tab-overview" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">Overview</TabsTrigger>
              <TabsTrigger value="eligibility" data-testid="tab-eligibility" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">Eligibility</TabsTrigger>
              <TabsTrigger value="documents" data-testid="tab-documents" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">Documents</TabsTrigger>
              <TabsTrigger value="process" data-testid="tab-apply" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">Apply Step</TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="mt-6 focus:outline-none">
              <div className="card-soft p-6 sm:p-8 space-y-6 border border-slate-100 bg-white">
                <div>
                  <h3 className="font-display text-lg font-bold text-brand-ink mb-3">Key Benefits Overview</h3>
                  <p className="text-slate-650 leading-relaxed text-sm">
                    {schemeBenefitFull || "No detailed benefit description available from the department."}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-display text-sm font-bold text-brand-ink">Important Highlights</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" /><span className="text-slate-655">Direct Income/Benefit Disbursement via DBT (Direct Benefit Transfer) to Aadhaar linked Accounts.</span></li>
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" /><span className="text-slate-655">Administered through verified central/state nodal agencies.</span></li>
                    <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" /><span className="text-slate-655">Zero processing fee. Free verification checks on government official portals.</span></li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Eligibility Tab Content */}
            <TabsContent value="eligibility" className="mt-6 focus:outline-none">
              <div className="card-soft p-6 sm:p-8 space-y-6 border border-slate-100 bg-white">
                <h3 className="font-display text-lg font-bold text-brand-ink mb-2">Eligibility Criteria</h3>
                {schemeEligibility.length > 0 ? (
                  <ul className="space-y-3">
                    {schemeEligibility.map((criteria, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                        <span className="text-slate-655">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-brand-muted">Please contact the AI assistant or visit the official site for detailed criteria.</p>
                )}
                
                <div className="pt-4 border-t">
                  <button
                    onClick={() => nav("/eligibility")}
                    data-testid="check-eligibility-btn"
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-brand-blue text-white font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" /> Run AI Eligibility Matcher
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab Content */}
            <TabsContent value="documents" className="mt-6 focus:outline-none">
              <div className="card-soft p-6 sm:p-8 space-y-6 border border-slate-100 bg-white">
                <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                  <h3 className="font-display text-lg font-bold text-brand-ink">Required Documentation</h3>
                  <span className="text-xs text-brand-blue font-semibold cursor-pointer hover:underline" onClick={() => nav("/profile")}>
                    Manage Documents in Profile →
                  </span>
                </div>
                
                {userDocs && userDocs.length > 0 ? (
                  /* Available vs Missing Diagnostics */
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wider font-bold text-brand-muted">Required Checklist</p>
                      <div className="space-y-2">
                        {reqDocs.map((doc, i) => {
                          const hasDoc = userDocs.includes(doc);
                          return (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${hasDoc ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                              <span className="text-sm">{hasDoc ? "✅" : "❌"}</span>
                              <span className="text-xs font-semibold text-brand-ink flex-1">{doc}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-brand-muted mb-2">Completion Status</p>
                        <p className="font-display text-2xl font-extrabold text-brand-ink">{completionPercent}% Complete</p>
                        <p className="text-xs text-slate-600 mt-2">
                          You already have <span className="font-bold">{hasCount}</span> of <span className="font-bold">{reqDocs.length}</span> required documents.
                        </p>
                      </div>

                      {missingDocs.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider mb-1.5">Missing Documents:</p>
                          <ul className="space-y-1.5 pl-1">
                            {missingDocs.map((doc, i) => (
                              <li key={i} className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed rounded-2xl bg-slate-50 border-slate-200 flex flex-col items-center justify-center space-y-3" data-testid="no-docs-checklist">
                    <p className="text-sm text-brand-muted max-w-sm">
                      You haven't configured your document checklist yet. Complete the "My Documents" section in your Profile to check which required documents you possess.
                    </p>
                    <button
                      onClick={() => nav("/profile")}
                      className="px-4 h-9 rounded-lg bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      Go to Profile & Documents
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Process Tab Content */}
            <TabsContent value="process" className="mt-6 focus:outline-none">
              <div className="card-soft p-6 sm:p-8 space-y-6 border border-slate-100 bg-white">
                <h3 className="font-display text-lg font-bold text-brand-ink mb-4">Official Application Flow</h3>
                {schemeSteps.length > 0 ? (
                  <ol className="space-y-6">
                    {schemeSteps.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="w-9 h-9 rounded-full bg-brand-blueLight text-brand-blue grid place-items-center font-display font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="pt-1.5">
                          <p className="text-sm font-bold text-brand-ink leading-tight">{step}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-brand-muted">Process not listed. Please check the official link.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* FAQs Section */}
          {schemeFaqs.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-display text-xl font-bold text-brand-ink flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" /> Frequently Asked Questions
              </h3>
              <div className="card-soft px-2 border border-slate-100 shadow-sm bg-white">
                <Accordion type="single" collapsible className="w-full">
                  {schemeFaqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-slate-100">
                      <AccordionTrigger className="px-4 text-left font-semibold text-brand-ink text-sm hover:no-underline py-4">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 text-slate-650 text-xs leading-relaxed pb-4">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          )}

          {/* Sticky Official Website Redirect and Checker Nudge Footer Bar */}
          <div className="fixed bottom-20 left-0 right-0 lg:relative lg:bottom-0 lg:left-0 lg:right-0 lg:max-w-none z-20 px-4 sm:px-6 lg:px-0 mt-8">
            <div className="card-soft p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-slate-100 bg-white">
              <div className="text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Official Service Provider</p>
                <p className="font-display font-semibold text-brand-ink text-sm mt-0.5">{schemeDept}</p>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => nav("/eligibility")}
                  className="flex-1 h-11 px-5 rounded-xl border border-slate-200 text-brand-ink hover:border-brand-blue hover:text-brand-blue font-semibold text-xs transition-colors"
                >
                  Verify Eligibility First
                </button>
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="apply-now"
                  className="flex-1 h-11 px-6 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  Apply on Official Website <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive AI Assistant Panel */}
        <div className="space-y-6">
          <div className="card-soft border border-slate-100 flex flex-col h-[480px] bg-slate-50/50 shadow-sm">
            
            {/* AI Panel Header */}
            <div className="p-4 border-b bg-white rounded-t-2xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-purple-600 grid place-items-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-brand-ink leading-none">Saathi AI Assistant</h3>
                <span className="text-[10px] text-brand-green font-medium">Scheme Specialist</span>
              </div>
            </div>

            {/* Chat message display window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-brand-blue text-white rounded-tr-none shadow-sm" 
                      : "bg-white border text-brand-ink rounded-tl-none shadow-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-tl-none p-3 flex gap-1 items-center">
                    {[0, 1, 2].map(n => (
                      <span key={n} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendQuery} className="p-3 border-t bg-white rounded-b-2xl flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about details, documents, deadlines..."
                className="flex-1 h-9 px-3 rounded-lg border text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiTyping}
                className="w-9 h-9 rounded-lg bg-brand-blue text-white grid place-items-center hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}

function MetricStat({ label, value, icon: Icon, tone }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className={`w-9 h-9 rounded-xl grid place-items-center ${tones[tone]}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-3">{label}</p>
      <p className="font-display font-bold text-brand-ink mt-0.5 truncate text-sm">{value}</p>
    </div>
  );
}
