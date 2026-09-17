import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Star, ArrowUpRight, Users, ShieldCheck, Landmark } from "lucide-react";
import { schemeService } from "@/services/schemeService";
import { toast } from "sonner";

export default function SchemeCard({ scheme, variant = "default" }) {
  const nav = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  const handleBookmarkToggle = async (e) => {
    e.stopPropagation();
    try {
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      await schemeService.toggleSaveScheme(scheme.id);
      
      if (newSavedState) {
        toast.success(`Scheme "${scheme.title || scheme.scheme_name}" saved to your list!`);
      } else {
        toast.info(`Scheme "${scheme.title || scheme.scheme_name}" removed from saved list.`);
      }
    } catch (err) {
      setIsSaved((prev) => !prev);
      toast.error("Failed to update saved status.");
    }
  };

  const schemeTitle = scheme.title || scheme.scheme_name || "Government Scheme";
  const schemeDept = scheme.department || "Government of India";
  const schemeSummary = scheme.summary || scheme.description || "Official welfare scheme benefits available.";
  const schemeBenefit = scheme.benefit || "Direct Benefit";
  const schemeState = scheme.state || "All India";
  const schemeCategory = scheme.category || scheme.tags?.[0] || "Welfare";

  return (
    <div
      data-testid={`scheme-card-${scheme.id}`}
      onClick={() => nav(`/scheme/${scheme.id}`)}
      className={`group bg-white p-5 sm:p-6 rounded-xl cursor-pointer flex flex-col h-full border border-slate-200 hover:border-[#0b3b60] hover:shadow-md transition-all ${
        variant === "compact" ? "min-h-[200px]" : ""
      }`}
    >
      {/* Top Government Meta Strip */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-[#0b3b60] border border-blue-200">
            {schemeState}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
            {schemeCategory}
          </span>
        </div>
        <button
          onClick={handleBookmarkToggle}
          data-testid={`save-${scheme.id}`}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isSaved ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
          title={isSaved ? "Saved" : "Save Scheme"}
        >
          <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Scheme Title & Department */}
      <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 leading-snug mb-1 line-clamp-2 group-hover:text-[#0b3b60] transition-colors">
        {schemeTitle}
      </h3>
      <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1">
        <Landmark className="w-3 h-3 text-slate-400 flex-shrink-0" />
        <span className="truncate">{schemeDept}</span>
      </p>

      {/* Summary */}
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 flex-1">
        {schemeSummary}
      </p>

      {/* Eligible / Failed checks */}
      {scheme.reasons && scheme.reasons.length > 0 && (
        <div className="mb-4 pt-3 border-t border-dashed border-slate-200 text-left">
          <p className="text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eligible Criteria:</span>
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            {scheme.reasons.map((r, i) => (
              <li key={i} className="text-[11px] text-emerald-900 font-medium">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {scheme.failed_checks && scheme.failed_checks.length > 0 && (
        <div className="mb-4 pt-3 border-t border-dashed border-slate-200 text-left">
          <p className="text-[11px] font-bold text-rose-800 mb-1">Ineligible Criteria:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {scheme.failed_checks.map((fc, i) => (
              <li key={i} className="text-[11px] font-medium text-rose-700">
                {fc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Benefit & Action strip */}
      <div className="flex items-center justify-between pt-3.5 border-t border-slate-200">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Benefit / लाभ</p>
          <p className="font-display font-bold text-emerald-700 text-sm mt-0.5">{schemeBenefit}</p>
        </div>
        <div className="flex items-center gap-2">
          {(scheme.rating || scheme.match_score !== undefined) && (
            <div className="flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Star className="w-3 h-3 fill-current text-amber-500" />
              <span>{scheme.rating ? `${scheme.rating}` : `${scheme.match_score}% Match`}</span>
            </div>
          )}
          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#0b3b60] text-slate-600 group-hover:text-white grid place-items-center transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
