import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, ExternalLink, Loader2, AlertCircle, Landmark, ShieldCheck, FileText } from "lucide-react";
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

export default function GovernmentUpdateDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  // Load all updates and filter locally to find the selected ID record
  const { data: updates = [], isLoading, isError } = useQuery({
    queryKey: ["governmentUpdatesV15"],
    queryFn: () => updatesService.getUpdates(),
  });

  const update = updates.find((item) => String(item.id) === String(id));

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#0b3b60] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Retrieving official gazette text...</p>
      </div>
    );
  }

  if (isError || !update) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto space-y-4 bg-white border border-slate-200 p-8 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 grid place-items-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Announcement Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            The requested circular could not be found or has been archived.
          </p>
        </div>
        <button
          onClick={() => nav("/government-updates")}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[#0b3b60] text-white text-xs font-semibold hover:bg-[#07253d] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Bulletins
        </button>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[update.category] || CATEGORY_COLORS.General;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in-up" data-testid="government-update-details-page">
      
      {/* Back Navigation Button */}
      <button
        onClick={() => nav("/government-updates")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Official Bulletins
      </button>

      {/* Main Official Gazette Container */}
      <article className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Tricolor line */}
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Official Gazette Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">भारत सरकार</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-700 uppercase">Government of India</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${catColor}`}>
                {update.category}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Published: {update.date}
            </span>
          </div>

          {/* Full Title */}
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            {update.title}
          </h1>

          {/* Issuing Authority Tag */}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Landmark className="w-4 h-4 text-[#0b3b60]" />
            <span>Issuing Authority: Press Information Bureau (PIB) / Nodal Central Ministry</span>
          </div>

          {/* Description Content */}
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3 pt-2">
            <p>{update.description}</p>
          </div>

          {/* Official External Link Action */}
          {update.url && (
            <div className="pt-4 border-t border-slate-150 flex items-center justify-between flex-wrap gap-3">
              <span className="text-[11px] text-slate-500">Official Ministry Circular Reference</span>
              <a
                href={update.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <span>Read Full Official Gazette Release</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
