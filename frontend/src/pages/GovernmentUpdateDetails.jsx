import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { updatesService } from "@/services/updatesService";

const CATEGORY_COLORS = {
  Agriculture: "bg-emerald-50 text-emerald-700 border-emerald-205",
  Education: "bg-blue-50 text-blue-700 border-blue-205",
  Health: "bg-red-50 text-red-700 border-red-205",
  Housing: "bg-orange-50 text-orange-700 border-orange-205",
  Employment: "bg-purple-50 text-purple-700 border-purple-205",
  Finance: "bg-indigo-50 text-indigo-700 border-indigo-205",
  Women: "bg-pink-50 text-pink-700 border-pink-205",
  General: "bg-slate-50 text-slate-700 border-slate-205",
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
        <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
        <p className="text-sm font-semibold text-brand-muted">Loading update details...</p>
      </div>
    );
  }

  if (isError || !update) {
    return (
      <div className="py-20 text-center max-w-xl mx-auto space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 grid place-items-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800">Announcement Not Found</h2>
          <p className="text-sm text-brand-muted mt-2">
            The requested update ID may have been archived or removed from the system.
          </p>
        </div>
        <button
          onClick={() => nav("/government-updates")}
          className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-brand-blue text-white font-medium hover:bg-blue-750 transition-colors shadow cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Newsroom
        </button>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[update.category] || CATEGORY_COLORS.General;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up" data-testid="government-update-details-page">
      {/* Back Navigation Button */}
      <button
        onClick={() => nav("/government-updates")}
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Newsroom
      </button>

      {/* Main Announcement Container */}
      <article className="card-soft p-6 sm:p-8 border border-slate-100 bg-white shadow-sm space-y-6">
        
        {/* Meta Category & Date Info */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${catColor}`}>
            {update.category}
          </span>
          <span className="text-xs text-brand-muted font-semibold flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Published: {update.date}
          </span>
        </div>

        {/* Full Title */}
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-ink leading-tight tracking-tight">
          {update.title}
        </h1>

        {/* Complete Description Paragraphs */}
        <div className="text-sm sm:text-base text-slate-650 leading-relaxed whitespace-pre-line space-y-4">
          <p>{update.description}</p>
        </div>

        {/* Official Link Action Button */}
        {update.url && (
          <div className="pt-6 border-t border-slate-100">
            <a
              href={update.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-brand-blue hover:bg-blue-750 text-white font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Visit Official Website <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </article>
    </div>
  );
}
