import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Grid3x3, List, X, Loader2, ArrowUpDown } from "lucide-react";
import { schemeService } from "@/services/schemeService";
import SchemeCard from "@/components/SchemeCard";
import EmptyState from "@/components/EmptyState";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";

const CATEGORIES = [
  { id: "agriculture", label: "Agriculture" },
  { id: "education", label: "Education" },
  { id: "healthcare", label: "Healthcare" },
  { id: "women", label: "Women & Child" },
  { id: "housing", label: "Housing" },
  { id: "employment", label: "Employment" },
  { id: "pension", label: "Pension" },
  { id: "disability", label: "Differently-Abled" },
];

const STATES = [
  "All India", "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
];

const SORT_OPTIONS = [
  { id: "name_asc", label: "Name (A-Z)" },
  { id: "name_desc", label: "Name (Z-A)" },
  { id: "benefit_desc", label: "High Benefit" },
  { id: "rating_desc", label: "Top Rated" },
];

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
        // Keyword Search
        const searchTarget = `${s.title || ""} ${s.summary || ""} ${s.department || ""}`.toLowerCase();
        const matchQ = !q || searchTarget.includes(q.toLowerCase());

        // Category Filter
        const matchCat = cat === "all" || String(s.category).toLowerCase() === cat.toLowerCase();

        // State Filter
        const matchState = state === "All India" || s.state === "All India" || String(s.state).toLowerCase() === state.toLowerCase();

        return matchQ && matchCat && matchState;
      })
      .sort((a, b) => {
        if (sort === "name_asc") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sort === "name_desc") {
          return (b.title || "").localeCompare(a.title || "");
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
      prev.set("page", "1"); // Reset pagination on change
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
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-brand-blue">Directory</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mt-1">Search Government Schemes</h1>
        <p className="text-brand-muted mt-2">Filter and find detailed central & state government schemes</p>
      </div>

      {/* Search Input Bar */}
      <div className="card-soft p-2 flex items-center gap-2 border border-slate-100 shadow-sm" data-testid="search-bar">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 px-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Type a scheme name, department or keyword and press enter…"
            className="flex-1 h-11 bg-transparent outline-none text-brand-ink placeholder:text-slate-450"
            data-testid="search-input"
          />
          {localQ && (
            <button type="button" onClick={() => { setLocalQ(""); updateParam("q", ""); }} className="text-slate-400 hover:text-brand-ink">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
        
        {/* Sort Select */}
        <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-200 pl-3 mr-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="text-sm text-brand-ink bg-transparent font-medium focus:outline-none"
            data-testid="sort-select"
          >
            {SORT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
          </select>
        </div>

        {/* Desktop Views and Filter Sheet */}
        <FilterSheet state={state} setState={(v) => updateParam("state", v)} cat={cat} setCat={(v) => updateParam("cat", v)} />
        
        <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button onClick={() => setView("grid")} data-testid="view-grid" className={`p-2 rounded-lg ${view === "grid" ? "bg-white shadow-sm text-brand-blue" : "text-slate-400"}`}><Grid3x3 className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} data-testid="view-list" className={`p-2 rounded-lg ${view === "list" ? "bg-white shadow-sm text-brand-blue" : "text-slate-400"}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" data-testid="category-pills">
        <Pill active={cat === "all"} onClick={() => updateParam("cat", "all")} testId="cat-all">All Schemes</Pill>
        {CATEGORIES.map(c => (
          <Pill key={c.id} active={cat === c.id} onClick={() => updateParam("cat", c.id)} testId={`cat-${c.id}`}>
            {c.label}
          </Pill>
        ))}
      </div>

      {/* Active filters summary */}
      {(state !== "All India" || cat !== "all" || q) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-brand-muted">Active filters:</span>
          {q && <FilterChip label={`Keyword: "${q}"`} onClear={() => { setLocalQ(""); updateParam("q", ""); }} />}
          {state !== "All India" && <FilterChip label={state} onClear={() => updateParam("state", "All India")} />}
          {cat !== "all" && <FilterChip label={CATEGORIES.find(c => c.id === cat)?.label} onClear={() => updateParam("cat", "all")} />}
          <button onClick={clearFilters} className="text-brand-blue hover:text-brand-blueDark text-xs font-semibold ml-2">Clear All</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
          <p className="text-sm text-brand-muted">Retrieving schemes from portal database...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="py-16 text-center card-soft border border-rose-100 bg-rose-50/20 max-w-xl mx-auto space-y-3">
          <p className="text-sm font-semibold text-rose-700">Unable to load scheme repository</p>
          <p className="text-xs text-brand-muted">Check your FastAPI service URL environment configs or network connection.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-white border text-sm font-semibold hover:bg-slate-50 transition-colors">Retry Query</button>
        </div>
      )}

      {/* Results output */}
      {!isLoading && !isError && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-muted" data-testid="results-count">
              Found <span className="text-brand-ink font-semibold">{totalItems}</span> matching schemes
            </p>
          </div>

          {schemesList.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No schemes matched your search"
              body="Try widening your search terms, selection categories or start a diagnostic check with Saathi AI."
              action="Run Saathi Eligibility Matchmaker"
              onAction={() => nav("/eligibility")}
            />
          ) : view === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {schemesList.map(s => <SchemeCard key={s.id} scheme={s} />)}
            </div>
          ) : (
            <div className="card-soft divide-y divide-slate-100 border border-slate-100">
              {schemesList.map(s => (
                <button
                  key={s.id}
                  onClick={() => nav(`/scheme/${s.id}`)}
                  data-testid={`scheme-list-${s.id}`}
                  className="w-full p-5 flex items-center gap-5 hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="hidden sm:flex w-12 h-12 rounded-xl bg-brand-blueLight text-brand-blue items-center justify-center font-display font-bold">
                    {s.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-brand-ink truncate text-base">{s.title}</h3>
                    <p className="text-xs text-brand-muted truncate mt-0.5">{s.department}</p>
                  </div>
                  <div className="text-right hidden md:block flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Benefit</p>
                    <p className="font-display font-bold text-brand-green text-sm mt-0.5">{s.benefit}</p>
                  </div>
                  <span className="chip bg-brand-blueLight text-brand-blue text-xs flex-shrink-0">{s.state}</span>
                </button>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setSearchParams((prev) => { prev.set("page", String(page - 1)); return prev; })}
                className="px-4 h-10 rounded-xl border text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-brand-muted px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setSearchParams((prev) => { prev.set("page", String(page + 1)); return prev; })}
                className="px-4 h-10 rounded-xl border text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors"
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
      className={`px-4 h-9 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
        active
          ? "bg-brand-blue text-white border-brand-blue shadow-sm"
          : "bg-white text-brand-ink border-slate-200 hover:border-brand-blue hover:text-brand-blue"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({ label, onClear }) {
  return (
    <span className="chip bg-brand-blueLight text-brand-blue gap-1.5 text-xs">
      {label}
      <button onClick={onClear} className="hover:text-brand-blueDark"><X className="w-3 h-3" /></button>
    </span>
  );
}

function FilterSheet({ state, setState, cat, setCat }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button data-testid="open-filters" className="h-11 px-4 rounded-xl bg-brand-blueLight text-brand-blue text-sm font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl font-bold">Filter Schemes</SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-7">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-brand-muted mb-3">State / Jurisdiction</p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {STATES.map(s => (
                <button
                  key={s}
                  onClick={() => setState(s)}
                  data-testid={`filter-state-${s.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`px-3 py-2 rounded-lg text-sm text-left border ${
                    state === s ? "bg-brand-blueLight border-brand-blue text-brand-blue font-semibold" : "border-slate-200 text-slate-700 hover:border-brand-blue"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-brand-muted mb-3">Category sector</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setCat("all")} className={`px-3 py-2 rounded-lg text-sm border font-medium ${cat === "all" ? "bg-brand-blueLight border-brand-blue text-brand-blue font-semibold" : "border-slate-200 hover:border-brand-blue text-slate-750"}`}>All</button>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`px-3 py-2 rounded-lg text-sm text-left border ${cat === c.id ? "bg-brand-blueLight border-brand-blue text-brand-blue font-semibold" : "border-slate-200 hover:border-brand-blue text-slate-700"}`}
                >{c.label}</button>
              ))}
            </div>
          </div>

          <SheetClose asChild>
            <button data-testid="apply-filters" className="w-full h-12 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-semibold transition-colors">Apply Filters</button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
