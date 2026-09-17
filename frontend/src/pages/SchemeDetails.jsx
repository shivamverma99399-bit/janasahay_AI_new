import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Bookmark, Share2, FileText, CheckCircle2,
  ChevronRight, Star, Users, Calendar, Building2, IndianRupee,
  Sparkles, Bot, Send, Loader2, Globe, HelpCircle, ShieldCheck,
  Landmark, ExternalLink, ShieldAlert
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
  const location = useLocation();
  const [isSaved, setIsSaved] = useState(false);
  const { userId } = useApp();

  const isProcessRequested = location.pathname.includes("/guide") || 
    location.pathname.includes("/apply") || 
    location.search.includes("tab=process") || 
    location.search.includes("tab=apply");

  const [activeTab, setActiveTab] = useState(() => (isProcessRequested ? "process" : "overview"));

  useEffect(() => {
    if (isProcessRequested) {
      setActiveTab("process");
    }
  }, [isProcessRequested]);

  // AI Assistant panel local state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);
  const [chatSessionId] = useState(() => `session_details_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Fetch scheme details dynamically by searching the full list locally
  const { data: scheme, isLoading, isError } = useQuery({
    queryKey: ["schemeDetails", id],
    queryFn: () => schemeService.getSchemeById(id),
    enabled: !!id,
  });

  const docKey = userId ? `js_user_documents_${userId}` : "js_user_documents_guest";
  const userDocs = React.useMemo(() => {
    try {
      const savedDocs = localStorage.getItem(docKey);
      return savedDocs ? JSON.parse(savedDocs) : [];
    } catch (e) {
      return [];
    }
  }, [userId, docKey]);

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
          text: `Namaste! 🙏 I am Saathi, your official scheme assistant for "${title}". Ask me about required documents, eligibility verification, or step-by-step application instructions.`
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
        toast.success("Scheme saved to your profile!");
      } else {
        toast.info("Scheme removed from saved list.");
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
      
      const contextPrompt = `Regarding the official government scheme "${title}" (Nodal Ministry/Dept: ${department}, Benefit: ${benefit}): ${userText}`;
      const response = await aiService.sendChatMessage(contextPrompt, chatMessages, userId || "user_001", chatSessionId);
      
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: response?.reply || response?.text || "Request processed. You can also consult the official department website for further queries." }
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Saathi AI is unable to contact the backend service at this moment. Please check connectivity." }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#0b3b60] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Retrieving official scheme specifications...</p>
      </div>
    );
  }

  if (isError || !scheme) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto space-y-4 bg-white border border-slate-200 p-8 rounded-2xl">
        <h2 className="font-display text-xl font-bold text-slate-900">Official Scheme Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested scheme dossier could not be retrieved from the central repository.
        </p>
        <button onClick={() => nav("/search")} className="px-5 py-2.5 rounded-lg bg-[#0b3b60] text-white text-xs font-semibold hover:bg-[#07253d] transition-colors">
          Return to Scheme Directory
        </button>
      </div>
    );
  }

  const schemeTitle = scheme.title || scheme.scheme_name || "Government Scheme";
  const schemeDept = scheme.department || "Government of India";
  const schemeBenefitFull = scheme.benefit_full || scheme.description || "";
  const schemeState = scheme.state || "All India";
  const schemeCategory = scheme.category || "General Welfare";
  const schemeBenefit = scheme.benefit || "Direct Benefit";
  const schemeBeneficiaries = scheme.beneficiaries || "All Eligible Citizens";
  const schemeDeadline = scheme.deadline || "Ongoing";
  const schemeRating = scheme.rating || "4.8";
  
  const schemeEligibility = Array.isArray(scheme.eligibility) 
    ? scheme.eligibility 
    : (scheme.eligibility_criteria ? [scheme.eligibility_criteria] : []);
    
  const reqDocs = getRequiredDocuments(schemeTitle);

  const hasCount = reqDocs.filter(d => userDocs.includes(d)).length;
  const completionPercent = reqDocs.length > 0 ? Math.round((hasCount / reqDocs.length) * 100) : 0;
  const missingDocs = reqDocs.filter(d => !userDocs.includes(d));
    
  const schemeSteps = Array.isArray(scheme.steps)
    ? scheme.steps
    : ["Access the verified National/State Portal link", "Complete citizen identity authentication (Aadhaar/OTP)", "Submit application details and review DBT disbursement status"];
    
  const schemeFaqs = Array.isArray(scheme.faqs) ? scheme.faqs : [];
  const officialUrl = scheme.official_website || "https://india.gov.in";

  return (
    <div className="space-y-6 animate-fade-in-up pb-48 lg:pb-36" data-testid="scheme-details">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button onClick={() => nav(-1)} className="hover:text-slate-900 flex items-center gap-1 cursor-pointer" data-testid="back-button">
          <ArrowLeft className="w-3.5 h-3.5" /> Scheme Directory
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-bold truncate">{schemeTitle}</span>
      </div>

      {/* Official Scheme Dossier Header Card */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Tricolor line */}
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Government identity badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">भारत सरकार</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-700 uppercase">Government of India</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-[#0b3b60] border border-blue-200">
                {schemeState}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                {schemeCategory}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> DBT Direct Benefit
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmarkToggle}
                data-testid="detail-save"
                className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSaved ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} />
                <span>{isSaved ? "Saved" : "Save Scheme"}</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Scheme link copied!");
                }}
                className="h-8 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Scheme Title & Ministry */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {schemeTitle}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-1.5 mt-1.5">
              <Landmark className="w-4 h-4 text-[#0b3b60]" />
              <span>Nodal Authority: {schemeDept}</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl mt-2.5">
              {schemeBenefitFull}
            </p>
          </div>

          {/* Key Scheme Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <MetricStat label="Estimated Benefit" value={schemeBenefit} icon={IndianRupee} tone="green" />
            <MetricStat label="Target Beneficiary" value={schemeBeneficiaries} icon={Users} tone="blue" />
            <MetricStat label="Application Window" value={schemeDeadline} icon={Calendar} tone="orange" />
            <MetricStat label="Portal Verification" value="100% DBT Verified" icon={ShieldCheck} tone="amber" />
          </div>
        </div>
      </section>

      {/* Main Grid: Specification Tabs + Right Column Assistant */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Scheme specifications Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl h-auto grid grid-cols-4 w-full border border-slate-200" data-testid="detail-tabs">
              <TabsTrigger value="overview" data-testid="tab-overview" className="py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0b3b60] data-[state=active]:shadow-xs text-xs font-bold">
                Overview
              </TabsTrigger>
              <TabsTrigger value="eligibility" data-testid="tab-eligibility" className="py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0b3b60] data-[state=active]:shadow-xs text-xs font-bold">
                Eligibility
              </TabsTrigger>
              <TabsTrigger value="documents" data-testid="tab-documents" className="py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0b3b60] data-[state=active]:shadow-xs text-xs font-bold">
                Documents
              </TabsTrigger>
              <TabsTrigger value="process" data-testid="tab-apply" className="py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0b3b60] data-[state=active]:shadow-xs text-xs font-bold">
                How to Apply
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="mt-4 focus:outline-none">
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 shadow-xs">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    Scheme Objectives & Citizen Entitlement
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                    {schemeBenefitFull || "No detailed benefit description available from the department."}
                  </p>
                </div>
                
                <div className="space-y-2.5 pt-2 border-t border-slate-150">
                  <h4 className="font-display text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Administrative Highlights & Safeguards
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Direct Benefit Transfer (DBT) directly into Aadhaar-seeded bank accounts.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Administered under Union / State Department regulatory guidelines.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Zero middleman commission. Registration and grievance redressal are free of charge.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Eligibility Tab Content */}
            <TabsContent value="eligibility" className="mt-4 focus:outline-none">
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 shadow-xs">
                <h3 className="font-display text-sm font-bold text-slate-900 mb-1 uppercase tracking-wide">
                  Official Eligibility Criteria / पात्रता मानदंड
                </h3>
                {schemeEligibility.length > 0 ? (
                  <ul className="space-y-2.5">
                    {schemeEligibility.map((criteria, i) => (
                      <li key={i} className="flex gap-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-[#0b3b60] flex-shrink-0 mt-0.5" />
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">Consult the official department website or Saathi AI for detailed criteria.</p>
                )}
                
                <div className="pt-3 border-t border-slate-150">
                  <button
                    onClick={() => nav("/eligibility")}
                    data-testid="check-eligibility-btn"
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run AI Eligibility Matcher</span>
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab Content */}
            <TabsContent value="documents" className="mt-4 focus:outline-none">
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-150 pb-3 flex-wrap gap-2">
                  <h3 className="font-display text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Mandatory Documentation / आवश्यक दस्तावेज
                  </h3>
                  <span className="text-xs text-[#0b3b60] font-bold cursor-pointer hover:underline" onClick={() => nav("/profile")}>
                    Manage Documents in Profile →
                  </span>
                </div>
                
                {userDocs && userDocs.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Checklist</p>
                      <div className="space-y-1.5">
                        {reqDocs.map((doc, i) => {
                          const hasDoc = userDocs.includes(doc);
                          return (
                            <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold ${hasDoc ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                              <span>{hasDoc ? "✅" : "⚠️"}</span>
                              <span className="flex-1">{doc}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Readiness Status</p>
                        <p className="font-display text-2xl font-bold text-slate-900">{completionPercent}% Ready</p>
                        <p className="text-xs text-slate-600 mt-1">
                          You currently hold <span className="font-bold">{hasCount}</span> of <span className="font-bold">{reqDocs.length}</span> required certificates.
                        </p>
                      </div>

                      {missingDocs.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-200">
                          <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider mb-1">To Obtain / Pending:</p>
                          <ul className="space-y-1 pl-1">
                            {missingDocs.map((doc, i) => (
                              <li key={i} className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed rounded-xl bg-slate-50 border-slate-200 space-y-2.5" data-testid="no-docs-checklist">
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Update your available documents in your Profile to generate instant eligibility readiness scores.
                    </p>
                    <button
                      onClick={() => nav("/profile")}
                      className="px-4 h-8 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Configure Documents
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Process Tab Content */}
            <TabsContent value="process" className="mt-4 focus:outline-none">
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-xs">
                <h3 className="font-display text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                  Standard Government Application Workflow
                </h3>
                <ol className="space-y-3">
                  {schemeSteps.map((step, i) => (
                    <li key={i} className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-[#0b3b60] text-white grid place-items-center font-bold text-xs flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>
          </Tabs>

          {/* FAQs Section */}
          {schemeFaqs.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0b3b60]" />
                <span>Frequently Asked Questions / अक्सर पूछे जाने वाले प्रश्न</span>
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 px-3 shadow-xs">
                <Accordion type="single" collapsible className="w-full">
                  {schemeFaqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-slate-200">
                      <AccordionTrigger className="px-2 text-left font-semibold text-slate-900 text-xs sm:text-sm hover:no-underline py-3">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="px-2 text-slate-600 text-xs leading-relaxed pb-3">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          )}

          {/* Official Website Redirect & Security Notice */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Government Portal
                </span>
                <p className="font-display font-bold text-slate-900 text-sm mt-1">{schemeDept}</p>
                <p className="text-xs text-slate-500">Applications are submitted directly on the official department server.</p>
              </div>
              
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => nav("/eligibility")}
                  className="flex-1 h-10 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Verify Eligibility
                </button>
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="apply-now"
                  className="flex-1 h-10 px-5 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <span>Apply on Official Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Security Advisory: The Government of India never charges fee for scheme registration. Do not share OTPs or bank passwords with unauthorized agents.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Saathi AI Assistant Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[480px] shadow-xs overflow-hidden">
            
            {/* AI Panel Header */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0b3b60] text-white grid place-items-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs text-slate-900 leading-none">साथी AI / Saathi Scheme Assistant</h3>
                <span className="text-[10px] text-emerald-700 font-semibold">Live Government Assistant</span>
              </div>
            </div>

            {/* Chat message display window */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-[#0b3b60] text-white rounded-tr-none shadow-xs" 
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-2.5 flex gap-1 items-center">
                    {[0, 1, 2].map(n => (
                      <span key={n} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendQuery} className="p-2.5 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about documents, income limits, application..."
                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiTyping}
                className="w-9 h-9 rounded-lg bg-[#0b3b60] text-white grid place-items-center hover:bg-[#07253d] disabled:opacity-40 transition-colors cursor-pointer"
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
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 grid place-items-center text-[#0b3b60]">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2.5">{label}</p>
      <p className="font-display font-bold text-slate-900 mt-0.5 truncate text-xs sm:text-sm">{value}</p>
    </div>
  );
}
