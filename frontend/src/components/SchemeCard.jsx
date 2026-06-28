import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Star, ArrowUpRight, Users } from "lucide-react";
import { schemeService } from "@/services/schemeService";
import { toast } from "sonner";

const colorMap = {
  green: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-100" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-100" },
  pink: { bg: "bg-pink-50", text: "text-pink-700", ring: "ring-pink-100" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-100" },
};

export default function SchemeCard({ scheme, variant = "default" }) {
  const nav = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const c = colorMap[scheme.color] || colorMap.blue;

  const handleBookmarkToggle = async (e) => {
    e.stopPropagation();
    try {
      // Optimistic update
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      
      // Call service layer
      await schemeService.toggleSaveScheme(scheme.id);
      
      if (newSavedState) {
        toast.success(`Scheme "${scheme.title}" bookmarked!`);
      } else {
        toast.info(`Scheme "${scheme.title}" removed from bookmarks.`);
      }
    } catch (err) {
      // Revert on error
      setIsSaved((prev) => !prev);
      toast.error("Failed to update bookmark. Endpoint not configured.");
    }
  };

  const schemeTitle = scheme.title || scheme.scheme_name || "Newly Discovered Scheme";
  const schemeDept = scheme.department || "Government of India";
  const schemeSummary = scheme.summary || scheme.description || "Live AI match found.";
  const schemeBenefit = scheme.benefit || "AI evaluated benefits";

  return (
    <div
      data-testid={`scheme-card-${scheme.id}`}
      onClick={() => nav(`/scheme/${scheme.id}`)}
      className={`group card-soft card-soft-hover p-5 sm:p-6 cursor-pointer flex flex-col h-full border border-slate-100 ${variant === "compact" ? "min-h-[200px]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${c.bg} ${c.text}`}>
          {scheme.tags?.[0] || scheme.category || "General"}
        </div>
        <button
          onClick={handleBookmarkToggle}
          data-testid={`save-${scheme.id}`}
          className={`p-1.5 rounded-lg transition-colors ${isSaved ? "text-brand-orange" : "text-slate-300 hover:text-slate-500"}`}
        >
          <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <h3 className="font-display text-lg sm:text-xl font-bold text-brand-ink leading-snug mb-1 line-clamp-2 group-hover:text-brand-blue transition-colors">
        {schemeTitle}
      </h3>
      <p className="text-xs text-brand-muted mb-3">{schemeDept}</p>

      <p className="text-sm text-slate-650 leading-relaxed line-clamp-3 mb-4 flex-1">
        {schemeSummary}
      </p>

      {/* Render Reasons (Passed) if present */}
      {scheme.reasons && scheme.reasons.length > 0 && (
        <div className="mb-4 pt-3 border-t border-dashed border-slate-100">
          <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider mb-1">Matched Qualifications</p>
          <div className="flex flex-wrap gap-1">
            {scheme.reasons.map((r, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                ✓ {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Render Failed Checks if present */}
      {scheme.failed_checks && scheme.failed_checks.length > 0 && (
        <div className="mb-4 pt-3 border-t border-dashed border-slate-100">
          <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider mb-1">Unmet Conditions</p>
          <div className="space-y-1">
            {scheme.failed_checks.map((fc, i) => (
              <p key={i} className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                ✗ {fc}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Benefit</p>
          <p className="font-display font-bold text-brand-ink text-base">{schemeBenefit}</p>
        </div>
        <div className="flex items-center gap-3">
          {scheme.beneficiaries && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3.5 h-3.5" />{scheme.beneficiaries}
            </div>
          )}
          {(scheme.rating || scheme.match_score !== undefined) && (
            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />{scheme.rating || `${scheme.match_score}% Match`}
            </div>
          )}
          <div className={`w-8 h-8 rounded-full ${c.bg} ${c.text} grid place-items-center group-hover:translate-x-0.5 transition-transform`}>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
