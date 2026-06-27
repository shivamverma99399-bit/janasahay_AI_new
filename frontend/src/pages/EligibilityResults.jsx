import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { aiService } from "@/services/aiService";
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, ArrowLeft, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import SchemeCard from "@/components/SchemeCard";

export default function EligibilityResults() {
  const location = useLocation();
  const nav = useNavigate();
  const { userId: contextUserId } = useApp();
  
  const { userId: stateUserId, answers, error: stateError } = location.state || {};
  const activeUserId = stateUserId || contextUserId;

  // Redirect to eligibility form if no user is registered/active
  useEffect(() => {
    if (!activeUserId && !stateError) {
      nav("/eligibility", { replace: true });
    }
  }, [activeUserId, stateError, nav]);

  // Fetch match recommendations from backend /api/dashboard/{user_id}
  const { data, isLoading, isError } = useQuery({
    queryKey: ["eligibilityMatches", activeUserId],
    queryFn: () => aiService.checkEligibility(activeUserId),
    enabled: !!activeUserId,
  });

  const recommendedSchemes = data?.recommended_schemes || [];
  
  // Categorize flat n8n matches based on match score threshold
  const matched = recommendedSchemes.filter(s => (s.match_score || 0) >= 75);
  const partial = recommendedSchemes.filter(s => (s.match_score || 0) >= 40 && (s.match_score || 0) < 75);
  const notEligible = recommendedSchemes.filter(s => (s.match_score || 0) < 40);

  // Estimate total benefits (summarize matching count or sum values if available)
  const estimated = matched.length > 0 ? `Qualified for ${matched.length} Schemes` : "0 Matches";

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
        <p className="text-sm font-semibold text-brand-muted">Saathi AI is running matchmaker algorithms via n8n...</p>
      </div>
    );
  }

  if (isError || stateError) {
    return (
      <div className="py-20 max-w-xl mx-auto space-y-6 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 grid place-items-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-slate-800">Connection Interrupted</h1>
          <p className="text-sm text-brand-muted leading-relaxed">
            The AI eligibility matching service could not process your parameters. Please confirm that your FastAPI backend and associated n8n workflows are actively deployed.
          </p>
        </div>
        <button
          onClick={() => nav("/eligibility")}
          className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-brand-blue text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Retake Questionnaire
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in-up" data-testid="eligibility-results">
      
      {/* Header Back Button */}
      <button onClick={() => nav("/eligibility")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-muted hover:text-brand-ink transition-colors">
        <ArrowLeft className="w-4 h-4" /> Restart Verification
      </button>

      {/* Success Summary Hero Banner */}
      <section className="card-soft p-8 sm:p-12 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border border-emerald-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-green text-white grid place-items-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <Sparkles className="w-3 h-3 text-brand-orange animate-pulse" /> Saathi Assessment Verified
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight pt-1">
                You match with <span className="text-brand-green font-extrabold">{matched.length} schemes</span>
              </h1>
              <p className="text-xs text-brand-muted">
                Evaluated against community demographics and income parameters.
              </p>
            </div>
          </div>
          <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Estimated annual support</p>
            <p className="font-display text-2xl font-extrabold text-brand-green mt-1">{estimated}</p>
          </div>
        </div>
      </section>

      {/* Matched Schemes List */}
      <section className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="font-display text-xl font-bold text-brand-green flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Matched Schemes ({matched.length})
          </h2>
          <p className="text-xs text-brand-muted">You qualify for the following benefits. Direct external portal links are open below.</p>
        </div>
        {matched.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {matched.map((s, idx) => (
              <div key={s.id || idx} className="relative">
                <SchemeCard scheme={s} />
                <div className="absolute top-4 right-12 text-xs font-bold text-brand-green bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 pointer-events-none">
                  {s.match_score}% Match
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed rounded-2xl text-brand-muted text-sm bg-slate-50/50">
            No exact matching schemes found.
          </div>
        )}
      </section>

      {/* Partially Matched List */}
      <section className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="font-display text-xl font-bold text-brand-orange flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Partially Matched ({partial.length})
          </h2>
          <p className="text-xs text-brand-muted">You are close to qualifying. Review missing documentation details below.</p>
        </div>
        {partial.length > 0 ? (
          <div className="space-y-3">
            {partial.map((s, idx) => (
              <div key={s.id || idx} className="card-soft p-5 border border-slate-100 flex items-start sm:items-center justify-between gap-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange grid place-items-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-ink text-sm">{s.title || s.scheme_name}</h3>
                    <p className="text-xs text-brand-muted mt-0.5">{s.ai_reason || "Check full eligibility requirements details."}</p>
                  </div>
                </div>
                <button
                  onClick={() => nav(`/scheme/${s.id}`)}
                  className="px-4 h-9 rounded-lg border text-xs font-semibold text-brand-orange border-brand-orange/20 hover:bg-orange-50 transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed rounded-2xl text-brand-muted text-sm bg-slate-50/50">
            No partially matched schemes.
          </div>
        )}
      </section>

      {/* Not Eligible List */}
      <section className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="font-display text-xl font-bold text-slate-550 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-slate-400" /> Excluded Schemes ({notEligible.length})
          </h2>
          <p className="text-xs text-brand-muted">Schemes where community eligibility caps exceed current parameters.</p>
        </div>
        {notEligible.length > 0 ? (
          <div className="card-soft divide-y divide-slate-100 border border-slate-100 bg-white shadow-sm">
            {notEligible.map((s, idx) => (
              <div key={s.id || idx} className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 grid place-items-center flex-shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-ink text-sm">{s.title || s.scheme_name}</h3>
                    <p className="text-xs text-brand-muted mt-0.5">{s.ai_reason || "Demographic/income criteria mismatch."}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase">{s.state || "All India"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed rounded-2xl text-brand-muted text-sm bg-slate-50/50">
            No excluded schemes.
          </div>
        )}
      </section>

      {/* Lower Recovery Actions */}
      <div className="flex flex-wrap gap-3 justify-center pt-8 border-t">
        <button onClick={() => nav("/eligibility")} className="h-11 px-6 rounded-xl border-2 border-slate-200 hover:border-brand-blue hover:text-brand-blue font-semibold text-xs transition-colors flex items-center gap-2 active:scale-95">
          <RefreshCw className="w-4 h-4" /> Retake Diagnostic Check
        </button>
        <button onClick={() => nav("/ai")} className="h-11 px-6 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-md active:scale-95">
          <Sparkles className="w-4 h-4 text-brand-orange animate-pulse" /> Query Saathi AI Assistant
        </button>
      </div>

    </div>
  );
}
