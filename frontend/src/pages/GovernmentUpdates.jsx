import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar, Search, ArrowRight, Loader2, Newspaper, AlertCircle,
  RefreshCw, Landmark, ShieldCheck, FileText, ChevronRight
} from "lucide-react";
import { updatesService } from "@/services/updatesService";

const CATEGORY_COLORS = {
  Agriculture: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Education: "bg-blue-50 text-blue-800 border-blue-200",
  Health: "bg-rose-50 text-rose-800 border-rose-200",
  Housing: "bg-amber-50 text-amber-800 border-amber-200",
  Employment: "bg-purple-50 text-purple-800 border-purple-200",
  Finance: "bg-indigo-50 text-indigo-800 border-indigo-200",
  Women: "bg-pink-50 text-pink-800 border-pink-200",
  General: "bg-slate-100 text-slate-800 border-slate-200",
};

const PRIORITY_COLORS = {
  High: "bg-rose-50 text-rose-700 border-rose-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
};

const FILTER_ITEMS = [
  "All",
  "Agriculture",
  "Education",
  "Health",
  "Housing",
  "Employment",
  "Women",
  "Finance",
  "Latest",
  "Most Important",
];

export default function GovernmentUpdates() {
  const nav = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: updates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["governmentUpdatesV15"],
    queryFn: () => updatesService.getUpdates(),
  });

  // Filter & Search Evaluation
  const filteredUpdates = updates.filter((update) => {
    const term = searchQuery.toLowerCase().trim();
    if (term) {
      const matchTitle = (update.title || "").toLowerCase().includes(term);
      const matchDesc = (update.description || "").toLowerCase().includes(term);
      const matchCat = (update.category || "").toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchCat) {
        return false;
      }
    }

    if (activeFilter === "All") {
      return true;
    }
    if (activeFilter === "Most Important") {
      return (update.priority || "").toLowerCase() === "high";
    }
    if (activeFilter === "Latest") {
      try {
        const uDate = new Date(update.date);
        const limitDate = new Date("2026-06-15");
        return uDate >= limitDate;
      } catch (e) {
        return true;
      }
    }
    return (update.category || "").toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="government-updates-page">
      
      {/* Official Government Header Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
            <span className="text-slate-900">भारत सरकार</span>
            <span className="text-slate-300">|</span>
            <span className="uppercase text-slate-700">Government of India</span>
            <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[10px]">
              आधिकारिक विज्ञप्तियां एवं सूचनाएं
            </span>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Official Government Gazettes & Notifications
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              प्रेस सूचना ब्यूरो (PIB) एवं मंत्रालयों की आधिकारिक घोषणाएं
            </p>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
              Official policy announcements, scheme amendments, deadline extensions, and financial disbursement circulars from Central & State ministries.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative max-w-md w-full bg-slate-50 rounded-lg border border-slate-200 focus-within:bg-white focus-within:border-[#0b3b60] transition-colors">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars by title, ministry, keyword..."
            className="w-full pl-9 pr-4 h-10 bg-transparent outline-none text-slate-900 text-xs font-medium placeholder:text-slate-400"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {FILTER_ITEMS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                activeFilter === filter
                  ? "bg-[#0b3b60] text-white border-[#0b3b60] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#0b3b60] hover:text-[#0b3b60]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 border border-slate-200 rounded-xl bg-white space-y-3">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="py-16 text-center bg-white border border-rose-200 rounded-xl p-6 max-w-xl mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 grid place-items-center mx-auto border border-rose-200">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm">Failed to retrieve circulars</h3>
            <p className="text-xs text-slate-500 mt-1">Please verify network connection to the central bulletin endpoint.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-[#0b3b60] text-white text-xs font-semibold hover:bg-[#07253d] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Content Grid */}
      {!isLoading && !isError && (
        <>
          {filteredUpdates.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-xl bg-white border-slate-200 max-w-md mx-auto space-y-3">
              <Newspaper className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">No circulars matching filter criteria</h3>
                <p className="text-xs text-slate-500 mt-0.5">Try resetting your category filter or clearing the search text.</p>
              </div>
              {(searchQuery || activeFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("All");
                  }}
                  className="px-3.5 h-8 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredUpdates.map((update) => {
                const catColor = CATEGORY_COLORS[update.category] || CATEGORY_COLORS.General;
                const priorityColor = PRIORITY_COLORS[update.priority] || PRIORITY_COLORS.Low;

                return (
                  <div
                    key={update.id}
                    data-testid={`update-card-${update.id}`}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0b3b60] hover:shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Meta */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${catColor}`}>
                          {update.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${priorityColor}`}>
                            {update.priority} Priority
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {update.date}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-[#0b3b60] transition-colors line-clamp-2">
                          {update.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {update.description}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-3.5 mt-3 border-t border-slate-150 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">PIB / Central Ministry Release</span>
                      <button
                        onClick={() => nav(`/government-updates/${update.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0b3b60] hover:underline cursor-pointer"
                      >
                        <span>Read Circular</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
