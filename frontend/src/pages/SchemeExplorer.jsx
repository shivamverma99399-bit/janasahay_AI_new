import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search, SlidersHorizontal, Grid3x3, List, X, Loader2,
  ArrowUpDown, Landmark, ShieldCheck, ChevronRight
} from "lucide-react";
import { schemeService } from "@/services/schemeService";
import SchemeCard from "@/components/SchemeCard";
import EmptyState from "@/components/EmptyState";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";

const CATEGORIES = [
  { id: "agriculture", label: "Agriculture & Rural", hindi: "कृषि" },
  { id: "education", label: "Education & Learning", hindi: "शिक्षा" },
  { id: "healthcare", label: "Health & Wellness", hindi: "स्वास्थ्य" },
  { id: "women", label: "Women & Child", hindi: "महिला" },
  { id: "housing", label: "Housing & Urban", hindi: "आवास" },
  { id: "employment", label: "Employment & Skilling", hindi: "रोजगार" },
  { id: "pension", label: "Social Security & Pension", hindi: "पेंशन" },
  { id: "disability", label: "Differently-Abled", hindi: "दिव्यांगजन" },
];

const STATES = [
  "All India", "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
];

const SORT_OPTIONS = [
  { id: "name_asc", label: "Name (A-Z)" },
  { id: "name_desc", label: "Name (Z-A)" },
  { id: "benefit_desc", label: "Highest Benefit" },
  { id: "rating_desc", label: "Top Rated" },
];

const CATEGORY_MAP = {
  agriculture: ["agriculture"],
  education: ["education"],
  healthcare: ["healthcare"],
  women: ["women"],
  housing: ["housing"],
  employment: ["employment", "labour"],
  pension: ["social security", "pension"],
  disability: ["differently-abled"],
  business: ["business"]
};

export default function SchemeExplorer() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState("grid");

  // Sync state with URL search params
  const q = searchParams.get("q") || "";
  const cat = searchParams.get("cat") || "all";
  const state = searchParams.get("state") || "All India";
  const sort = searchParams.get("sort") || "name_asc";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Local input query state to avoid API calls on every keystroke
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  // Fetch all schemes from the backend
  const { data: schemes = [], isLoading, isError } = useQuery({
    queryKey: ["schemesAll"],
    queryFn: () => schemeService.getSchemes(),
  });

  // Perform local searching, category/state filtering, sorting, and pagination
  const filteredAndSorted = React.useMemo(() => {
    if (!Array.isArray(schemes)) return [];

    return schemes
      .filter((s) => {
        const title = s.title || s.scheme_name || "";
        const summary = s.summary || s.description || "";
        const category = s.category || "";
        const criteria = s.eligibility_criteria || "";
        const dept = s.department || "Government of India";

        // Keyword Search by Scheme Name, Description, Category, Eligibility criteria, or Nodal Department
        const searchTarget = `${title} ${summary} ${category} ${criteria} ${dept}`.toLowerCase();
        const matchQ = !q || searchTarget.includes(q.toLowerCase());

        // Category Filter with mappings
        let matchCat = false;
        if (cat === "all") {
          matchCat = true;
        } else {
          const dbCatLower = String(category).toLowerCase();
          const targetCats = CATEGORY_MAP[cat.toLowerCase()] || [cat.toLowerCase()];
          matchCat = targetCats.some(tc => dbCatLower.includes(tc) || tc.includes(dbCatLower));
        }

        // State Filter
        const matchState = state === "All India" || s.state === "All India" || String(s.state || "").toLowerCase() === state.toLowerCase();

        return matchQ && matchCat && matchState;
      })
      .sort((a, b) => {
        const aTitle = a.title || a.scheme_name || "";
        const bTitle = b.title || b.scheme_name || "";
        if (sort === "name_asc") {
          return aTitle.localeCompare(bTitle);
        }
        if (sort === "name_desc") {
          return bTitle.localeCompare(aTitle);
        }
        if (sort === "rating_desc") {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sort === "benefit_desc") {
          const getVal = (str) => {
            if (!str) return 0;
            const clean = str.replace(/[^0-9.]/g, "");
            return parseFloat(clean) || 0;
          };
          return getVal(b.benefit) - getVal(a.benefit);
        }
        return 0;
      });
  }, [schemes, q, cat, state, sort]);

  const itemsPerPage = 9;
  const totalItems = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const schemesList = filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      if (value && value !== "all" && value !== "All India") {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam("q", localQ);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setLocalQ("");
  };

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="scheme-explorer">
      
      {/* Official Government Directory Header Banner */}
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
            <span className="bg-blue-50 text-[#0b3b60] border border-blue-200 px-2 py-0.5 rounded text-[10px]">
              राष्ट्रीय योजना निर्देशिका
            </span>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Central & State Government Schemes Directory
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              केंद्रीय एवं राज्य स्तरीय सरकारी योजनाओं की आधिकारिक सूची
            </p>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
              Browse, filter, and compare across official welfare schemes, financial subsidies, and DBT initiatives across all Indian States and Union Territories.
            </p>
          </div>
        </div>
      </section>

      {/* Search Input & Controls Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3" data-testid="search-bar">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 w-full px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 focus-within:bg-white focus-within:border-[#0b3b60] transition-colors">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Search by scheme name, department or keyword..."
            className="flex-1 h-9 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-sm font-medium"
            data-testid="search-input"
          />
          {localQ && (
            <button type="button" onClick={() => { setLocalQ(""); updateParam("q", ""); }} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="submit" className="text-xs font-bold text-white bg-[#0b3b60] hover:bg-[#07253d] px-3 py-1.5 rounded-md transition-colors">
            Search
          </button>
        </form>
        
        {/* Sort Select */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="text-xs text-slate-800 bg-transparent font-semibold focus:outline-none cursor-pointer"
              data-testid="sort-select"
            >
              {SORT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>

          {/* Filter Sheet Trigger */}
          <FilterSheet state={state} setState={(v) => updateParam("state", v)} cat={cat} setCat={(v) => updateParam("cat", v)} />
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button onClick={() => setView("grid")} data-testid="view-grid" className={`p-1.5 rounded-md ${view === "grid" ? "bg-white shadow-xs text-[#0b3b60]" : "text-slate-400"}`} title="Grid view">
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} data-testid="view-list" className={`p-1.5 rounded-md ${view === "list" ? "bg-white shadow-xs text-[#0b3b60]" : "text-slate-400"}`} title="List view">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" data-testid="category-pills">
        <Pill active={cat === "all"} onClick={() => updateParam("cat", "all")} testId="cat-all">All Schemes / सभी योजनाएं</Pill>
        {CATEGORIES.map(c => (
          <Pill key={c.id} active={cat === c.id} onClick={() => updateParam("cat", c.id)} testId={`cat-${c.id}`}>
            {c.label} ({c.hindi})
          </Pill>
        ))}
      </div>

      {/* Active filters summary */}
      {(state !== "All India" || cat !== "all" || q) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Applied Filters:</span>
          {q && <FilterChip label={`Query: "${q}"`} onClear={() => { setLocalQ(""); updateParam("q", ""); }} />}
          {state !== "All India" && <FilterChip label={`Jurisdiction: ${state}`} onClear={() => updateParam("state", "All India")} />}
          {cat !== "all" && <FilterChip label={`Category: ${CATEGORIES.find(c => c.id === cat)?.label}`} onClear={() => updateParam("cat", "all")} />}
          <button onClick={clearFilters} className="text-[#0b3b60] hover:underline font-bold text-xs ml-2">
            Reset Filters
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0b3b60] animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Querying National Scheme Repository...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="py-16 text-center bg-white border border-rose-200 rounded-xl p-6 max-w-xl mx-auto space-y-3">
          <p className="text-sm font-bold text-rose-800">Unable to query scheme directory</p>
          <p className="text-xs text-slate-500">Please verify backend service connections or refresh your session.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-[#0b3b60] text-white text-xs font-semibold hover:bg-[#07253d] transition-colors">
            Retry Search
          </button>
        </div>
      )}

      {/* Results output */}
      {!isLoading && !isError && (
        <>
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <p className="text-xs font-semibold text-slate-600" data-testid="results-count">
              Found <span className="text-slate-900 font-bold">{totalItems}</span> official government schemes
            </p>
            <span className="text-[11px] text-slate-400 font-medium">Verified by Ministry Data</span>
          </div>

          {schemesList.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No schemes match your selected criteria"
              body="Try widening your search terms, removing active filters, or check eligibility with Saathi AI."
              action="Run AI Eligibility Matchmaker"
              onAction={() => nav("/eligibility")}
            />
          ) : view === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemesList.map(s => <SchemeCard key={s.id} scheme={s} />)}
            </div>
          ) : (
            <div className="bg-white rounded-xl divide-y divide-slate-200 border border-slate-200 overflow-hidden">
              {schemesList.map(s => (
                <button
                  key={s.id}
                  onClick={() => nav(`/scheme/${s.id}`)}
                  data-testid={`scheme-list-${s.id}`}
                  className="w-full p-4 flex items-center justify-between gap-4 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-[#0b3b60] border border-blue-200">
                        {s.state || "All India"}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium truncate">{s.department || "Government of India"}</span>
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-sm group-hover:text-[#0b3b60] transition-colors truncate">
                      {s.title || s.scheme_name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {s.summary || s.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Benefit</p>
                    <p className="font-display font-bold text-emerald-700 text-xs mt-0.5">{s.benefit || "Direct Benefit"}</p>
                    <span className="text-[11px] text-[#0b3b60] font-semibold flex items-center justify-end gap-0.5 mt-1">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setSearchParams((prev) => { prev.set("page", String(page - 1)); return prev; })}
                className="px-3.5 h-9 rounded-lg border border-slate-200 bg-white text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-600 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setSearchParams((prev) => { prev.set("page", String(page + 1)); return prev; })}
                className="px-3.5 h-9 rounded-lg border border-slate-200 bg-white text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Pill({ children, active, onClick, testId }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`px-3.5 h-8 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
        active
          ? "bg-[#0b3b60] text-white border-[#0b3b60] shadow-xs"
          : "bg-white text-slate-700 border-slate-200 hover:border-[#0b3b60] hover:text-[#0b3b60]"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
      {label}
      <button onClick={onClear} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
    </span>
  );
}

function FilterSheet({ state, setState, cat, setCat }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button data-testid="open-filters" className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#0b3b60]" />
          <span>Filters</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-lg font-bold text-slate-900">Filter Official Schemes</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2.5">State / Jurisdiction</p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {STATES.map(s => (
                <button
                  key={s}
                  onClick={() => setState(s)}
                  data-testid={`filter-state-${s.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`px-3 py-2 rounded-lg text-xs text-left border cursor-pointer transition-colors ${
                    state === s ? "bg-blue-50 border-[#0b3b60] text-[#0b3b60] font-bold" : "border-slate-200 text-slate-700 hover:border-slate-400"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2.5">Sector & Category</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setCat("all")} className={`px-3 py-2 rounded-lg text-xs border font-medium cursor-pointer ${cat === "all" ? "bg-blue-50 border-[#0b3b60] text-[#0b3b60] font-bold" : "border-slate-200 hover:border-slate-400 text-slate-700"}`}>All Schemes</button>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`px-3 py-2 rounded-lg text-xs text-left border cursor-pointer ${cat === c.id ? "bg-blue-50 border-[#0b3b60] text-[#0b3b60] font-bold" : "border-slate-200 hover:border-slate-400 text-slate-700"}`}
                >{c.label}</button>
              ))}
            </div>
          </div>

          <SheetClose asChild>
            <button data-testid="apply-filters" className="w-full h-10 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-xs transition-colors cursor-pointer">
              Apply Filters
            </button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
