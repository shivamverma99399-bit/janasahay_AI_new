import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, Sparkles, Compass, Wheat, GraduationCap,
  Heart, Home as HomeIcon, Briefcase, PiggyBank, Accessibility,
  ArrowRight, MessageSquare, Shield, HelpCircle, FileText, Bot, AlertTriangle
} from "lucide-react";
import { schemeService } from "@/services/schemeService";
import { aiService } from "@/services/aiService";
import { useApp } from "@/context/AppContext";

const CATEGORIES = [
  { id: "agriculture", label: "Agriculture", icon: Wheat, color: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50 text-emerald-600" },
  { id: "education", label: "Education", icon: GraduationCap, color: "from-blue-500 to-indigo-600", bgLight: "bg-blue-50 text-blue-600" },
  { id: "healthcare", label: "Healthcare", icon: Heart, color: "from-rose-500 to-pink-600", bgLight: "bg-rose-50 text-rose-600" },
  { id: "housing", label: "Housing", icon: HomeIcon, color: "from-amber-500 to-orange-600", bgLight: "bg-amber-50 text-amber-600" },
  { id: "employment", label: "Employment", icon: Briefcase, color: "from-purple-500 to-violet-600", bgLight: "bg-purple-50 text-purple-600" },
  { id: "pension", label: "Pension", icon: PiggyBank, color: "from-cyan-500 to-blue-600", bgLight: "bg-cyan-50 text-cyan-600" },
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
    <div className="relative space-y-12 pb-16 animate-fade-in-up" data-testid="dashboard">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-blue-700 to-indigo-800 text-white px-8 py-10 sm:px-12 sm:py-12 md:px-16 md:py-12 min-h-[380px] md:min-h-[420px] lg:min-h-[460px] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-60" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative z-10 max-w-3xl space-y-5">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold uppercase tracking-widest text-blue-100"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
            Empowering Citizens Through Tech
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-none"
          >
            Discover Government <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Schemes</span> Instantly
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-blue-100 max-w-xl font-normal leading-relaxed"
          >
            JanSahay is an AI-powered platform to find schemes you qualify for, understand requirements, and get guided application support.
          </motion.p>
          
          {/* Hero CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <button
              onClick={() => nav("/eligibility")}
              data-testid="dash-check-eligibility"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-brand-orange text-white font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Find Schemes for Me (AI Matchmaker)
            </button>
            <button
              onClick={() => nav("/search")}
              className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur border border-white/20 font-medium active:scale-95"
            >
              <Compass className="w-4 h-4" /> Browse Catalog
            </button>
          </motion.div>
        </div>
      </section>

      {/* Interactive Search Bar Section */}
      <section className="relative z-10 -mt-16 max-w-4xl mx-auto px-4">
        <form onSubmit={handleSearchSubmit} className="card-soft shadow-xl p-3 flex flex-col md:flex-row gap-3 bg-white/95 backdrop-blur border border-slate-100" data-testid="search-bar">
          <div className="flex items-center gap-3 flex-1 px-3">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords (e.g. farmer, scholarship, housing, medical)..."
              className="flex-1 h-12 bg-transparent outline-none text-brand-ink placeholder:text-slate-400 text-base"
              data-testid="search-input"
            />
          </div>
          <button
            type="submit"
            data-testid="search-submit"
            className="h-12 px-8 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-medium transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"
          >
            Search Schemes
          </button>
        </form>
      </section>

      {/* Popular Categories */}
      <section className="space-y-6">
        <div className="text-center md:text-left">
          <h2 className="font-display text-2xl font-bold text-brand-ink">Popular Categories</h2>
          <p className="text-sm text-brand-muted mt-1">Explore schemes classified by primary benefits and sectors</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => selectCategory(c.id)}
                data-testid={`cat-${c.id}`}
                className="card-soft card-soft-hover p-6 text-center flex flex-col items-center gap-3 border border-slate-100 transition-all cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-2xl grid place-items-center ${c.bgLight} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-display font-medium text-brand-ink text-sm leading-tight">{c.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* AI Matches Banner / recommended section */}
      {userId ? (
        <section className="space-y-6 bg-gradient-to-br from-blue-50/20 via-white to-indigo-50/20 p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-brand-ink flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-orange animate-pulse" /> Recommended for You (AI Matched)
              </h2>
              <p className="text-xs text-brand-muted mt-1">Personalized scheme recommendations generated by Saathi AI via Supabase demographics.</p>
            </div>
            <button onClick={() => nav("/eligibility/results")} className="text-xs font-semibold text-brand-blue hover:underline">View Verification Report</button>
          </div>

          {isDashboardLoading ? (
            <div className="grid sm:grid-cols-3 gap-5">
              {[1, 2, 3].map(n => (
                <div key={n} className="card-soft p-5 border animate-pulse h-40 bg-slate-200" />
              ))}
            </div>
          ) : recommendedSchemes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendedSchemes.map((s, idx) => (
                <div
                  key={s.id || idx}
                  onClick={() => nav(`/scheme/${s.id}`)}
                  className="card-soft card-soft-hover p-5 border border-slate-100 bg-white flex flex-col justify-between cursor-pointer text-left h-full group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] uppercase font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                        {s.match_score || 80}% Match
                      </span>
                      <span className="text-[9px] text-brand-muted font-semibold">{s.department || "Government Scheme"}</span>
                    </div>
                    <h3 className="font-display font-bold text-brand-ink text-sm leading-snug group-hover:text-brand-blue transition-colors line-clamp-2">
                      {s.title || s.scheme_name}
                    </h3>
                    <p className="text-xs text-brand-muted mt-2 line-clamp-2">
                      {s.ai_reason || s.description || s.summary}
                    </p>
                  </div>
                  <div className="border-t pt-3 mt-4 flex justify-between items-center text-xs">
                    <span className="font-bold text-brand-green">{s.benefit || "AI Match"}</span>
                    <span className="text-brand-blue font-semibold flex items-center gap-0.5">Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-brand-muted bg-slate-50 rounded-2xl">
              No matching schemes found. You can retake the Matchmaker checker.
            </div>
          )}
        </section>
      ) : (
        <section className="card-soft p-6 sm:p-8 bg-gradient-to-r from-blue-50/30 to-indigo-50/10 border border-slate-150 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-brand-ink text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-brand-blue" /> Personalized Schemes Diagnostic
            </h3>
            <p className="text-xs text-brand-muted max-w-xl">
              Tell Saathi AI your age, income, state, and occupation, and we will run live matchmaker scripts to fetch customized government support matching your profile.
            </p>
          </div>
          <button
            onClick={() => nav("/profile")}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-semibold text-xs shadow transition-all active:scale-95 flex-shrink-0"
          >
            Setup Demographic Preferences
          </button>
        </section>
      )}

      {/* Schemes Grid (Featured & Recent) */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Featured Schemes */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display text-2xl font-bold text-brand-ink flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" /> Featured Schemes
            </h2>
            <button onClick={() => nav("/search")} className="text-sm font-semibold text-brand-blue hover:underline">View All</button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => <SchemeCardSkeleton key={n} />)}
            </div>
          ) : isError || schemes.length === 0 ? (
            <FallbackList nav={nav} />
          ) : (
            <div className="space-y-4">
              {featuredSchemes.map((s) => (
                <SchemeItemRow key={s.id} scheme={s} onClick={() => nav(`/scheme/${s.id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Government Schemes */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display text-2xl font-bold text-brand-ink flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand-green" /> Recent Announcements
            </h2>
            <button onClick={() => nav("/search")} className="text-sm font-semibold text-brand-blue hover:underline">View All</button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => <SchemeCardSkeleton key={n} />)}
            </div>
          ) : isError || schemes.length === 0 ? (
            <FallbackList nav={nav} />
          ) : (
            <div className="space-y-4">
              {recentSchemes.map((s) => (
                <SchemeItemRow key={s.id} scheme={s} onClick={() => nav(`/scheme/${s.id}`)} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Floating AI Button (Navigates to Saathi Chat) */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <button
          onClick={() => nav("/ai")}
          data-testid="floating-ai-btn"
          className="group flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-brand-blue to-indigo-700 text-white font-medium shadow-xl hover:shadow-brand-blue/30 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <MessageSquare className="w-5 h-5 animate-pulse" />
          <span>Ask Saathi AI</span>
        </button>
      </div>

      {/* Government Friendly Footer */}
      <footer className="border-t border-slate-200 pt-10 mt-16 text-xs text-brand-muted text-center space-y-4">
        <div className="flex justify-center items-center gap-6">
          <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-600" /> Secure Government Gateway</div>
          <div className="flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-indigo-600" /> National Support Directory</div>
          <div className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-brand-orange" /> Terms & Privacy</div>
        </div>
        <p className="max-w-2xl mx-auto leading-relaxed text-slate-400">
          JanSahay is an independent portal built for citizen assistance. All scheme logos, criteria, and details are loaded dynamically from department endpoints. Application submissions occur on verified department URLs.
        </p>
        <p className="text-[10px] text-slate-400">© 2026 Government Scheme Discovery Portal. Digital India Initiative.</p>
      </footer>

    </div>
  );
}

function SchemeItemRow({ scheme, onClick }) {
  return (
    <div
      onClick={onClick}
      data-testid={`scheme-row-${scheme.id}`}
      className="card-soft card-soft-hover p-5 border border-slate-100 flex justify-between items-center gap-4 cursor-pointer text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-brand-blue tracking-wide bg-brand-blueLight px-2 py-0.5 rounded">
            {scheme.state || "All India"}
          </span>
          <span className="text-[10px] text-brand-muted font-medium">
            {scheme.department}
          </span>
        </div>
        <h3 className="font-display font-bold text-brand-ink text-base mt-2 group-hover:text-brand-blue transition-colors truncate">
          {scheme.title || scheme.scheme_name}
        </h3>
        <p className="text-xs text-brand-muted line-clamp-1 mt-1">
          {scheme.summary || scheme.description || scheme.benefit_full}
        </p>
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Benefit</p>
        <p className="font-display font-bold text-brand-green text-sm mt-0.5">{scheme.benefit || "AI Match"}</p>
        <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-brand-blueLight group-hover:text-brand-blue grid place-items-center mt-2 transition-colors">
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

function SchemeCardSkeleton() {
  return (
    <div className="card-soft p-5 border border-slate-100 flex justify-between items-center animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-1/4" />
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-5/6" />
      </div>
      <div className="w-16 h-12 bg-slate-200 rounded flex-shrink-0" />
    </div>
  );
}

function FallbackList({ nav }) {
  return (
    <div className="card-soft p-8 text-center border border-dashed border-slate-200 space-y-4">
      <p className="text-sm text-brand-muted">
        No active schemes found. Set up your endpoints or browse manually.
      </p>
      <button
        onClick={() => nav("/search")}
        className="text-xs font-semibold text-brand-blue border border-brand-blue/30 px-4 py-2 rounded-lg hover:bg-brand-blueLight transition-colors"
      >
        Open Scheme Directory
      </button>
    </div>
  );
}
