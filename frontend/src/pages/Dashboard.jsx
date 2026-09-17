import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Sparkles, Compass, Wheat, GraduationCap,
  Heart, Home as HomeIcon, Briefcase, PiggyBank, Accessibility,
  ArrowRight, MessageSquare, Shield, HelpCircle, FileText, Bot,
  Landmark, Building2, MapPin, ShieldCheck, Bell, ExternalLink,
  Award, CheckCircle2, ChevronRight
} from "lucide-react";
import { schemeService } from "@/services/schemeService";
import { aiService } from "@/services/aiService";
import { useApp } from "@/context/AppContext";

const CATEGORIES = [
  { id: "agriculture", label: "Agriculture & Rural", hindi: "कृषि एवं ग्रामीण विकास", count: "312 Schemes", icon: Wheat, badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "education", label: "Education & Learning", hindi: "शिक्षा एवं छात्रवृत्ति", count: "245 Schemes", icon: GraduationCap, badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "healthcare", label: "Health & Wellness", hindi: "स्वास्थ्य एवं परिवार कल्याण", count: "189 Schemes", icon: Heart, badge: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "housing", label: "Housing & Shelter", hindi: "आवास एवं शहरी विकास", count: "134 Schemes", icon: HomeIcon, badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "employment", label: "Employment & Skilling", hindi: "रोजगार एवं कौशल विकास", count: "208 Schemes", icon: Briefcase, badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "pension", label: "Social Security & Pension", hindi: "सामाजिक सुरक्षा एवं पेंशन", count: "165 Schemes", icon: PiggyBank, badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
];

const BENEFICIARY_SEGMENTS = [
  { label: "Farmers & Agriculture", hindi: "किसान कल्याण", icon: Wheat, query: "farmer" },
  { label: "Students & Youth", hindi: "छात्र एवं युवा", icon: GraduationCap, query: "student" },
  { label: "Women & Child", hindi: "महिला एवं बाल", icon: Heart, query: "women" },
  { label: "Senior Citizens", hindi: "वरिष्ठ नागरिक", icon: PiggyBank, query: "pension" },
  { label: "MSME & Artisans", hindi: "उद्यम एवं स्वरोजगार", icon: Briefcase, query: "employment" },
  { label: "Divyangjan (PWD)", hindi: "दिव्यांगजन सशक्तिकरण", icon: Accessibility, query: "disability" },
];

const GOV_PORTALS = [
  { name: "National Portal of India", url: "https://www.india.gov.in", desc: "Single window access to government info & services" },
  { name: "myScheme Portal", url: "https://www.myscheme.gov.in", desc: "National scheme directory and citizen search" },
  { name: "DBT Bharat", url: "https://dbtbharat.gov.in", desc: "Direct Benefit Transfer welfare portal" },
  { name: "DigiLocker", url: "https://www.digilocker.gov.in", desc: "Digital wallet for citizen documents" },
  { name: "UMANG", url: "https://web.umang.gov.in", desc: "Unified Mobile App for New-age Governance" },
];

export default function Dashboard() {
  const nav = useNavigate();
  const { userId } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch schemes from actual API service
  const { data: schemes = [], isLoading, isError } = useQuery({
    queryKey: ["schemes"],
    queryFn: () => schemeService.getSchemes(),
  });

  const guestUserId = localStorage.getItem("js_guest_user_id");
  const activeUserId = userId || guestUserId;

  // Fetch dynamic user recommendations if active session userId is present
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["userDashboard", activeUserId],
    queryFn: () => aiService.checkEligibility(activeUserId),
    enabled: !!activeUserId,
  });

  const recommendedSchemes = dashboardData?.recommended_schemes?.slice(0, 3) || [];
  const featuredSchemes = schemes.slice(0, 3);
  const recentSchemes = schemes.slice(3, 6);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      nav(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      nav("/search");
    }
  };

  const selectCategory = (catId) => {
    nav(`/search?cat=${catId}`);
  };

  return (
    <div className="relative space-y-8 pb-16 animate-fade-in-up" data-testid="dashboard">
      
      {/* Real Government Portal Discovery & Search Hub */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Tricolor Accent Line */}
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        {/* Official Identity Strip */}
        <div className="bg-slate-50/80 px-5 sm:px-8 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs flex-shrink-0">
              <AshokaEmblem className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 tracking-wide">भारत सरकार</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">Government of India</span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  नागरिक सेवा पोर्टल
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                National Portal for Citizen Schemes, Subsidies & Benefits · Digital India Initiative
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-[11px]">100% DBT Verified</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
              <Landmark className="w-3.5 h-3.5 text-[#0b3b60]" />
              <span className="font-semibold text-[11px]">48 Union Ministries</span>
            </div>
          </div>
        </div>

        {/* Official Header Content & Search */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-100 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>SINGLE-WINDOW WELFARE PORTAL · एकीकृत कल्याणकारी सेवा</span>
            </div>

            {/* Small Dignified Title as requested */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
              Discover Government Schemes Instantly
            </h1>
            
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              सरकारी योजनाओं, वित्तीय अनुदान एवं डीबीटी लाभों की खोज करें
            </p>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Find Central and State Government welfare schemes, scholarships, direct cash transfers (DBT), agriculture grants, and financial assistance tailored to your eligibility.
            </p>
          </div>

          {/* Official Government Search Console */}
          <form onSubmit={handleSearchSubmit} className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 focus-within:border-[#0b3b60] focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-xs" data-testid="search-bar">
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="flex-1 flex items-center gap-3 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by scheme name, ministry, or keyword (e.g. Kisan, Scholarship, Awas, Sukanya, Health)..."
                  className="w-full h-11 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-sm font-medium"
                  data-testid="search-input"
                />
              </div>
              <button
                type="submit"
                data-testid="search-submit"
                className="h-11 px-7 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 flex-shrink-0 active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>Search Schemes</span>
              </button>
            </div>

            {/* Popular Schemes Quick Chips */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-slate-700">Popular Searches:</span>
              {[
                { label: "PM-KISAN (किसान निधि)", query: "PM-KISAN" },
                { label: "Ayushman Bharat (स्वास्थ्य)", query: "Ayushman Bharat" },
                { label: "Post-Matric Scholarship", query: "Scholarship" },
                { label: "PM Awas Yojana (आवास)", query: "Awas" },
                { label: "Atal Pension", query: "Pension" },
                { label: "Lakhpati Didi", query: "Women" },
              ].map((item) => (
                <button
                  key={item.query}
                  type="button"
                  onClick={() => nav(`/search?q=${encodeURIComponent(item.query)}`)}
                  className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 hover:text-blue-800 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </form>

          {/* Government Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => nav("/eligibility")}
              data-testid="dash-check-eligibility"
              className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-[#e65100] hover:bg-[#c64400] text-white font-semibold text-xs transition-colors shadow-sm active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Check Eligibility (AI Matchmaker)</span>
            </button>
            <button
              onClick={() => nav("/search")}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs transition-colors shadow-xs active:scale-95"
            >
              <Compass className="w-4 h-4 text-[#0b3b60]" />
              <span>Browse All Schemes</span>
            </button>
            <button
              onClick={() => nav("/government-updates")}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Latest Guidelines & Gazettes</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Official Announcements Ticker */}
      <section className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-950 overflow-hidden shadow-xs">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2.5 py-1 rounded-md flex-shrink-0">
          <Bell className="w-3.5 h-3.5 text-amber-800 animate-pulse" />
          <span>नवीनतम / Announcements</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-slate-700 font-medium">
            🔔 Direct Benefit Transfer (DBT) verification window active for AY 2026-27 · PM-KISAN 17th tranche disbursed · National Scholarship Portal applications open · Verify Aadhaar-bank account link for instant subsidy credit.
          </p>
        </div>
        <button
          onClick={() => nav("/government-updates")}
          className="text-[11px] font-bold text-blue-800 hover:underline flex items-center gap-1 flex-shrink-0"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* National Scheme Metrics Counters */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center flex-shrink-0">
            <Landmark className="w-5 h-5 text-[#0b3b60]" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-display">1,400+</div>
            <div className="text-xs text-slate-500 font-medium">Central & State Schemes</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 grid place-items-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-display">100% DBT</div>
            <div className="text-xs text-slate-500 font-medium">Direct Benefit Transfer</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 grid place-items-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-display">48 Ministries</div>
            <div className="text-xs text-slate-500 font-medium">Union Departments</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-purple-50 border border-purple-100 grid place-items-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-display">36 States / UTs</div>
            <div className="text-xs text-slate-500 font-medium">Pan-India Coverage</div>
          </div>
        </div>
      </section>

      {/* Target Citizen Beneficiary Segments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>योजना लाभार्थी वर्ग</span>
              <span className="text-slate-300">|</span>
              <span>Schemes by Beneficiary Segment</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore welfare programs mapped to specific demographic profiles</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BENEFICIARY_SEGMENTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => nav(`/search?q=${encodeURIComponent(item.query)}`)}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0b3b60] hover:shadow-sm text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-[#0b3b60] grid place-items-center transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#0b3b60] transition-colors leading-snug">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{item.hindi}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>प्रमुख क्षेत्र एवं श्रेणियां</span>
              <span className="text-slate-300">|</span>
              <span>Sectors & Scheme Categories</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Official classification by key socio-economic departments</p>
          </div>
          <button onClick={() => nav("/search")} className="text-xs font-bold text-[#0b3b60] hover:underline flex items-center gap-1">
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => selectCategory(c.id)}
                data-testid={`cat-${c.id}`}
                className="bg-white border border-slate-200 hover:border-[#0b3b60] hover:shadow-sm p-4 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer group"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 grid place-items-center text-slate-700 group-hover:text-[#0b3b60] group-hover:bg-blue-50 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-display font-bold text-slate-900 text-xs leading-tight block mt-3 group-hover:text-[#0b3b60] transition-colors">
                    {c.label}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                    {c.hindi}
                  </span>
                </div>
                <span className="inline-block mt-3 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit">
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* AI Recommendations / Eligibility Section */}
      {userId ? (
        <section className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  पात्रता सत्यापन
                </span>
                <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Recommended Schemes (AI Matched)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">Personalized scheme recommendations generated by Saathi AI based on your demographic profile.</p>
            </div>
            <button onClick={() => nav("/eligibility/results")} className="text-xs font-bold text-[#0b3b60] hover:underline">
              View Verification Report →
            </button>
          </div>

          {isDashboardLoading ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="p-4 border rounded-xl animate-pulse h-36 bg-slate-100" />
              ))}
            </div>
          ) : recommendedSchemes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedSchemes.map((s, idx) => (
                <div
                  key={s.id || idx}
                  onClick={() => nav(`/scheme/${s.id}`)}
                  className="p-4 border border-slate-200 hover:border-[#0b3b60] rounded-xl bg-slate-50/50 hover:bg-white flex flex-col justify-between cursor-pointer text-left h-full transition-all group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {s.match_score || 80}% Match
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{s.department || "Government Scheme"}</span>
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-sm leading-snug group-hover:text-[#0b3b60] transition-colors line-clamp-2">
                      {s.title || s.scheme_name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {s.ai_reason || s.description || s.summary}
                    </p>
                  </div>
                  <div className="border-t border-slate-200 pt-3 mt-4 flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-700">{s.benefit || "Direct Benefit"}</span>
                    <span className="text-[#0b3b60] font-semibold flex items-center gap-0.5">Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No matching schemes found yet. You can run the AI Eligibility Matchmaker with updated details.
            </div>
          )}
        </section>
      ) : (
        <section className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#0b3b60]" /> Personalized Schemes Eligibility Check
            </h3>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Tell Saathi AI your age, income, state, and occupation, and we will run live eligibility verification to identify customized government subsidies matching your profile.
            </p>
          </div>
          <button
            onClick={() => nav("/profile")}
            className="w-full sm:w-auto h-10 px-5 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-xs shadow-xs transition-all active:scale-95 flex-shrink-0"
          >
            Setup Demographic Preferences
          </button>
        </section>
      )}

      {/* Schemes Grid (Featured & Recent) */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Featured Schemes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" /> Featured Central Schemes (प्रमुख योजनाएं)
            </h2>
            <button onClick={() => nav("/search")} className="text-xs font-bold text-[#0b3b60] hover:underline">View All</button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => <SchemeCardSkeleton key={n} />)}
            </div>
          ) : isError || schemes.length === 0 ? (
            <FallbackList nav={nav} />
          ) : (
            <div className="space-y-3">
              {featuredSchemes.map((s) => (
                <SchemeItemRow key={s.id} scheme={s} onClick={() => nav(`/scheme/${s.id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Government Schemes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-700" /> State & UT Schemes (राज्य योजनाएं)
            </h2>
            <button onClick={() => nav("/search")} className="text-xs font-bold text-[#0b3b60] hover:underline">View All</button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => <SchemeCardSkeleton key={n} />)}
            </div>
          ) : isError || schemes.length === 0 ? (
            <FallbackList nav={nav} />
          ) : (
            <div className="space-y-3">
              {recentSchemes.map((s) => (
                <SchemeItemRow key={s.id} scheme={s} onClick={() => nav(`/scheme/${s.id}`)} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Official Government Portals Ecosystem Directory */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#0b3b60]" />
              <span>National Government Portal Ecosystem · आधिकारिक पोर्टल निर्देशिका</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified Indian Government convergence platforms</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {GOV_PORTALS.map((portal) => (
            <a
              key={portal.name}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-[#0b3b60] hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#0b3b60] transition-colors">{portal.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#0b3b60]" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{portal.desc}</p>
              </div>
              <span className="text-[9px] font-semibold text-[#0b3b60] mt-2 block">Visit portal →</span>
            </a>
          ))}
        </div>
      </section>

      {/* Floating AI Button (Navigates to Saathi Chat) */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <button
          onClick={() => nav("/ai")}
          data-testid="floating-ai-btn"
          className="group flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border border-amber-400/40"
        >
          <MessageSquare className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="text-xs">Ask Saathi AI / सहायता</span>
        </button>
      </div>

      {/* Authentic Indian Government Portal Footer */}
      <footer className="border-t border-slate-200 pt-8 mt-12 text-xs text-slate-600 space-y-4">
        <div className="flex flex-wrap justify-center items-center gap-6 text-slate-700">
          <div className="flex items-center gap-1.5 font-medium"><Shield className="w-4 h-4 text-emerald-700" /> Secure Citizen Gateway</div>
          <div className="flex items-center gap-1.5 font-medium"><HelpCircle className="w-4 h-4 text-[#0b3b60]" /> National Toll-Free: 1915 / 1800-11-0031</div>
          <div className="flex items-center gap-1.5 font-medium"><FileText className="w-4 h-4 text-amber-700" /> GIGW 3.0 Compliance</div>
        </div>
        <p className="max-w-2xl mx-auto leading-relaxed text-slate-500 text-center text-[11px]">
          JanSahay is an official citizen facilitation portal for discovery of Central and State Government schemes. Application submissions, eKYC, and document approvals occur on designated Union Ministry & State Department portals.
        </p>
        <div className="text-[10px] text-slate-400 text-center space-y-1">
          <p>© 2026 Government Scheme Discovery Portal. Digital India Initiative · National Informatics Centre (NIC) Compatible.</p>
          <p>Designed and developed in alignment with Guidelines for Indian Government Websites (GIGW).</p>
        </div>
      </footer>

    </div>
  );
}

function AshokaEmblem({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="#0b3b60" strokeWidth="2.5" fill="#f8fafc" />
      <circle cx="50" cy="50" r="16" stroke="#0b3b60" strokeWidth="2" fill="none" />
      <circle cx="50" cy="50" r="4" fill="#0b3b60" />
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={50 + 16 * Math.cos((i * 15 * Math.PI) / 180)}
          y2={50 + 16 * Math.sin((i * 15 * Math.PI) / 180)}
          stroke="#0b3b60"
          strokeWidth="1.2"
        />
      ))}
      <path d="M30 76 H70 V82 H30 Z" fill="#0b3b60" />
      <path d="M26 82 H74 V86 H26 Z" fill="#d97706" />
      <path d="M35 48 C35 34 42 22 50 22 C58 22 65 34 65 48 C65 58 58 64 50 64 C42 64 35 58 35 48 Z" stroke="#0b3b60" strokeWidth="2" fill="white" />
      <path d="M26 50 C26 38 32 28 38 28 C42 34 42 46 38 56 C34 56 26 55 26 50 Z" stroke="#0b3b60" strokeWidth="1.5" fill="white" opacity="0.95" />
      <path d="M74 50 C74 38 68 28 62 28 C58 34 58 46 62 56 C66 56 74 55 74 50 Z" stroke="#0b3b60" strokeWidth="1.5" fill="white" opacity="0.95" />
    </svg>
  );
}

function SchemeItemRow({ scheme, onClick }) {
  return (
    <div
      onClick={onClick}
      data-testid={`scheme-row-${scheme.id}`}
      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0b3b60] hover:shadow-xs flex justify-between items-center gap-4 cursor-pointer text-left group transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-[#0b3b60] tracking-wide bg-blue-50 px-2 py-0.5 rounded border border-blue-150">
            {scheme.state || "All India"}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {scheme.department}
          </span>
        </div>
        <h3 className="font-display font-bold text-slate-900 text-sm mt-1.5 group-hover:text-[#0b3b60] transition-colors truncate">
          {scheme.title || scheme.scheme_name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-1 mt-1">
          {scheme.summary || scheme.description || scheme.benefit_full}
        </p>
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Benefit</p>
        <p className="font-display font-bold text-emerald-700 text-xs mt-0.5">{scheme.benefit || "Verified Benefit"}</p>
        <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-50 group-hover:text-[#0b3b60] grid place-items-center mt-1.5 transition-colors">
          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

function SchemeCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-5/6" />
      </div>
      <div className="w-16 h-10 bg-slate-200 rounded flex-shrink-0" />
    </div>
  );
}

function FallbackList({ nav }) {
  return (
    <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-3">
      <p className="text-xs text-slate-600">
        No active schemes found in this section. Browse the official scheme catalog.
      </p>
      <button
        onClick={() => nav("/search")}
        className="text-xs font-semibold text-[#0b3b60] border border-[#0b3b60]/30 px-3.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
      >
        Open Scheme Directory
      </button>
    </div>
  );
}
