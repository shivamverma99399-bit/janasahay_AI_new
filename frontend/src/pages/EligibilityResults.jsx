import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { aiService } from "@/services/aiService";
import {
  CheckCircle2, AlertTriangle, XCircle, Sparkles, ArrowLeft,
  RefreshCw, AlertCircle, Loader2, ShieldCheck, Landmark,
  IndianRupee, ChevronRight
} from "lucide-react";
import SchemeCard from "@/components/SchemeCard";

export default function EligibilityResults() {
  const location = useLocation();
  const nav = useNavigate();
  const { userId: contextUserId } = useApp();
  const [showExcluded, setShowExcluded] = useState(false);
  
  const { userId: stateUserId, answers, error: stateError } = location.state || {};
  const activeUserId = stateUserId || contextUserId;

  // Redirect to eligibility form if no user is registered/active
  useEffect(() => {
    if (!activeUserId && !stateError) {
      nav("/eligibility", { replace: true });
    }
  }, [activeUserId, stateError, nav]);

  // Fetch match recommendations from backend /api/match-schemes
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["eligibilityMatches", activeUserId],
    queryFn: () => {
      const extraStr = localStorage.getItem(`js_profile_extra_${activeUserId}`);
      let extra = null;
      if (extraStr) {
        try {
          extra = JSON.parse(extraStr);
        } catch (e) {}
      }
      return aiService.checkEligibility(activeUserId, extra);
    },
    enabled: !!activeUserId,
  });

  const recommendedSchemes = data?.recommended_schemes || [];
  
  // Categorize matches based on eligibility status and match score threshold
  const matched = recommendedSchemes.filter(s => s.eligible === true);
  const partial = recommendedSchemes.filter(s => s.eligible === false && (s.match_score || 0) >= 40);
  const notEligible = recommendedSchemes.filter(s => s.eligible === false && (s.match_score || 0) < 40);

  // Estimate total benefits
  const estimated = matched.length > 0 ? `Qualified for ${matched.length} Schemes` : "0 Matches";

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#0b3b60] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Evaluating socio-economic parameters against Union Ministry guidelines...</p>
      </div>
    );
  }

  if (isError || stateError) {
    const errorDetails = error?.response?.data?.detail || error?.message || (stateError && String(stateError)) || "Unknown integration error";
    return (
      <div className="py-20 max-w-xl mx-auto space-y-5 text-center bg-white border border-slate-200 p-8 rounded-2xl animate-fade-in-up">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 grid place-items-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-xl font-bold text-slate-900">Diagnostic Interrupted</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The national eligibility matching server encountered an issue processing your parameters:
          </p>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs font-mono text-rose-700 max-h-36 overflow-y-auto">
            {errorDetails}
          </div>
        </div>
        <button
          onClick={() => nav("/eligibility")}
          className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-[#0b3b60] text-white text-xs font-semibold hover:bg-[#07253d] transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retake Diagnostic
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up" data-testid="eligibility-results">
      
      {/* Header Back Button */}
      <button onClick={() => nav("/eligibility")} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Retake Diagnostic / संशोधित करें
      </button>

      {/* Official Assessment Summary Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">भारत सरकार</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-700 uppercase">Government of India</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                पात्रता सत्यापन रिपोर्ट
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Benefit Transfer (DBT) Assessed</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 grid place-items-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  You qualify for <span className="text-emerald-700">{matched.length} Government Schemes</span>
                </h1>
                <p className="text-xs text-slate-500">
                  Evaluated against official community demographics, family income brackets, and land records under Union & State Ministry rules.
                </p>
              </div>
            </div>

            <div className="border-t md:border-t-0 pt-3 md:pt-0 flex-shrink-0 text-left md:text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Eligibility Summary</p>
              <p className="font-display text-lg font-bold text-emerald-700 mt-0.5">{estimated}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Matched Schemes Section */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Eligible Schemes / पात्र योजनाएं ({matched.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">You meet all statutory requirements. Proceed to official application portals below.</p>
        </div>

        {matched.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matched.map((s, idx) => (
              <div key={s.id || idx} className="relative">
                <SchemeCard scheme={s} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed rounded-xl text-slate-500 text-xs bg-slate-50">
            No exact matching schemes found for your current parameter set.
          </div>
        )}
      </section>

      {/* Partially Matched Section */}
      {partial.length > 0 && (
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Conditionally Eligible / आंशिक पात्रता ({partial.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">You are close to qualifying. Review missing document certificates or criteria.</p>
          </div>

          <div className="space-y-3">
            {partial.map((s, idx) => (
              <div key={s.id || idx} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 grid place-items-center flex-shrink-0 mt-0.5 border border-amber-200">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">{s.title || s.scheme_name}</h3>
                    {s.failed_checks && s.failed_checks.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {s.failed_checks.map((fc, i) => (
                          <p key={i} className="text-xs text-rose-700 font-medium flex items-center gap-1">
                            ⚠ Pending Requirement: {fc}
                          </p>
                        ))}
                      </div>
                    )}
                    {s.reasons && s.reasons.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {s.reasons.map((r, i) => (
                          <span key={i} className="inline-flex items-center text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => nav(`/scheme/${s.id}`)}
                  className="px-3.5 h-8 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors self-start sm:self-center cursor-pointer"
                >
                  View Criteria
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Excluded Schemes Section */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
          <div>
            <h2 className="font-display text-base font-bold text-slate-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-slate-400" />
              <span>Ineligible Schemes ({notEligible.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Schemes where demographic or income criteria exceed current statutory limits.</p>
          </div>
          {notEligible.length > 0 && (
            <button
              onClick={() => setShowExcluded(!showExcluded)}
              data-testid="toggle-excluded-btn"
              className="text-xs font-bold text-[#0b3b60] hover:underline bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg cursor-pointer"
            >
              {showExcluded ? "Hide Excluded" : "Show Excluded"}
            </button>
          )}
        </div>

        {showExcluded && notEligible.length > 0 && (
          <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 bg-white shadow-xs animate-fade-in">
            {notEligible.map((s, idx) => (
              <div key={s.id || idx} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 grid place-items-center flex-shrink-0 mt-0.5">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">{s.title || s.scheme_name}</h3>
                    {s.failed_checks && s.failed_checks.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {s.failed_checks.map((fc, i) => (
                          <p key={i} className="text-xs text-rose-700 font-medium">
                            ✗ Excluded: {fc}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-bold uppercase">{s.state || "All India"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recovery Actions */}
      <div className="flex flex-wrap gap-3 justify-center pt-6 border-t border-slate-200">
        <button
          onClick={() => nav("/eligibility")}
          className="h-10 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-xs text-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retake Diagnostic
        </button>
        <button
          onClick={() => nav("/ai")}
          className="h-10 px-5 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Consult Saathi AI on Schemes</span>
        </button>
      </div>

    </div>
  );
}
