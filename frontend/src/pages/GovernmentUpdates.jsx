import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Search, ArrowRight, Loader2, Newspaper, AlertCircle, RefreshCw } from "lucide-react";
import { updatesService } from "@/services/updatesService";

const CATEGORY_COLORS = {
  Agriculture: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Education: "bg-blue-50 text-blue-700 border-blue-200",
  Health: "bg-red-50 text-red-700 border-red-200",
  Housing: "bg-orange-50 text-orange-700 border-orange-200",
  Employment: "bg-purple-50 text-purple-700 border-purple-200",
  Finance: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Women: "bg-pink-50 text-pink-700 border-pink-200",
  General: "bg-slate-50 text-slate-700 border-slate-200",
};

const PRIORITY_COLORS = {
  High: "bg-rose-100 text-rose-800 border-rose-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Low: "bg-slate-100 text-slate-700 border-slate-250",
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
    // 1. Search Query Filter
    const term = searchQuery.toLowerCase().trim();
    if (term) {
      const matchTitle = (update.title || "").toLowerCase().includes(term);
      const matchDesc = (update.description || "").toLowerCase().includes(term);
      const matchCat = (update.category || "").toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchCat) {
        return false;
      }
    }

    // 2. Active Tab Filter
    if (activeFilter === "All") {
      return true;
    }
    if (activeFilter === "Most Important") {
      return (update.priority || "").toLowerCase() === "high";
    }
    if (activeFilter === "Latest") {
      // Evaluate if update date is recent (e.g. within 15 days of 2026-06-28)
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
    <div className="space-y-8 animate-fade-in-up" data-testid="government-updates-page">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-brand-blue">Newsroom</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mt-1">Government Updates</h1>
        <p className="text-brand-muted mt-2">Latest press releases, scheme amendments, and digital service announcements.</p>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, category, keywords..."
            className="w-full pl-10 pr-4 h-11 bg-transparent rounded-xl outline-none text-brand-ink text-sm placeholder:text-slate-400"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Filter Badges Carousel */}
        <div className="flex flex-wrap gap-2 py-1">
          {FILTER_ITEMS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                activeFilter === filter
                  ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-350"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-soft p-5 border border-slate-100 bg-white flex flex-col justify-between h-48 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-slate-200 rounded-md" />
                  <div className="h-4 w-16 bg-slate-200 rounded-md" />
                </div>
                <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
                <div className="h-4 w-full bg-slate-200 rounded-md" />
              </div>
              <div className="h-8 w-24 bg-slate-200 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="py-16 text-center card-soft border border-rose-100 bg-rose-50/20 max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 grid place-items-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800">Failed to load updates</h3>
            <p className="text-xs text-brand-muted mt-1">Please verify the connection to the `/api/v1/government-updates` endpoint.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-blue-750 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </div>
      )}

      {/* Success Content */}
      {!isLoading && !isError && (
        <>
          {filteredUpdates.length === 0 ? (
            /* Empty State */
            <div className="card-soft p-16 text-center border border-dashed rounded-2xl max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto shadow-inner animate-pulse">
                <Newspaper className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-brand-ink text-base">No government updates available.</h3>
                <p className="text-xs text-brand-muted mt-1">Try resetting your filter tabs or entering a different keyword search.</p>
              </div>
              {(searchQuery || activeFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("All");
                  }}
                  className="px-4 h-9 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid md:grid-cols-2 gap-6">
              {filteredUpdates.map((update) => {
                const catColor = CATEGORY_COLORS[update.category] || CATEGORY_COLORS.General;
                const priorityColor = PRIORITY_COLORS[update.priority] || PRIORITY_COLORS.Low;

                return (
                  <div
                    key={update.id}
                    data-testid={`update-card-${update.id}`}
                    className="card-soft overflow-hidden border border-slate-100 bg-white flex flex-col justify-between h-full group hover:shadow-md transition-shadow"
                  >
                    <div className="p-5 space-y-4">
                      {/* Meta information: Category Badge, Priority Badge & Date */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${catColor}`}>
                          {update.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${priorityColor}`}>
                            {update.priority} Priority
                          </span>
                          <span className="text-[10px] text-brand-muted font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {update.date}
                          </span>
                        </div>
                      </div>

                      {/* Title & Short Description */}
                      <div className="space-y-2">
                        <h3 className="font-display font-bold text-brand-ink text-base sm:text-lg leading-snug group-hover:text-brand-blue transition-colors line-clamp-2">
                          {update.title}
                        </h3>
                        <p className="text-xs text-brand-muted leading-relaxed line-clamp-3">
                          {update.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="px-5 pb-5 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => nav(`/government-updates/${update.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-blueDark transition-colors group/btn cursor-pointer"
                      >
                        Read More <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
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
