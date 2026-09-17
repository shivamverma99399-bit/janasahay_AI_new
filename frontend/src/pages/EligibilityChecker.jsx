import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2, ShieldCheck, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { aiService } from "@/services/aiService";
import { profileService } from "@/services/profileService";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const STEPS = [
  {
    id: "basic",
    title: "Applicant Demographic Profile",
    hindi: "आवेदक की व्यक्तिगत जानकारी",
    body: "Enter baseline demographic information to filter central and state eligibility criteria.",
    fields: [
      { id: "age", label: "Age of Applicant (उम्र)", type: "number", placeholder: "e.g. 32" },
      { id: "gender", label: "Gender (लिंग)", type: "radio", options: ["Female", "Male", "Other"] },
      { id: "state", label: "State of Permanent Residence (गृह राज्य)", type: "select", options: ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"] },
    ]
  },
  {
    id: "income",
    title: "Income & Occupational Category",
    hindi: "आय एवं रोजगार का विवरण",
    body: "Used to determine eligibility under economic weaker section (EWS) thresholds and sector-specific grants.",
    fields: [
      { id: "occupation", label: "Occupation Status (व्यवसाय)", type: "radio", options: ["Farmer", "Self-employed", "Salaried", "Student", "Unemployed", "Retired"] },
      { id: "income", label: "Annual Household Income (वार्षिक पारिवारिक आय)", type: "radio", options: ["Below ₹1 Lakh", "₹1L – ₹3L", "₹3L – ₹6L", "₹6L – ₹18L", "Above ₹18L"] },
    ]
  },
  {
    id: "social",
    title: "Social Category & Inclusion",
    hindi: "सामाजिक वर्ग एवं विशेष स्थिति",
    body: "Constitutional reservations, minority welfare, and disability support quotas.",
    fields: [
      { id: "category", label: "Social Category (जाति वर्ग)", type: "radio", options: ["General", "OBC", "SC", "ST", "EWS"] },
      { id: "disability", label: "Differently-Abled / Divyangjan (दिव्यांग स्थिति)", type: "radio", options: ["No", "Yes"] },
    ]
  },
  {
    id: "family",
    title: "Household & Agricultural Details",
    hindi: "पारिवारिक एवं भूमि स्वामित्व",
    body: "Assessment for PM-KISAN, Sukanya Samriddhi, PMAY, and rural welfare benefits.",
    fields: [
      { id: "household", label: "Household Size / Dependents (परिवार के सदस्य)", type: "number", placeholder: "e.g. 4" },
      { id: "girl_child", label: "Do you have a girl child below 10 years? (बालिका स्थिति)", type: "radio", options: ["No", "Yes"] },
      { id: "land", label: "Cultivable Farmland Ownership (कृषि भूमि)", type: "radio", options: ["No", "Yes — less than 2 acres", "Yes — more than 2 acres"] },
    ]
  }
];

export default function EligibilityChecker() {
  const nav = useNavigate();
  const { userId, setUserId } = useApp();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profilePreferences", userId],
    queryFn: () => profileService.getProfile(userId),
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync profile to answers
  React.useEffect(() => {
    if (profile) {
      setAnswers(prev => ({
        ...profile,
        disability: profile.disabilityStatus || prev.disability,
        ...prev
      }));
    }
  }, [profile]);

  // Compute active steps (only steps with missing fields)
  const activeSteps = React.useMemo(() => {
    if (!profile) return STEPS;

    return STEPS.map(step => {
      const missingFields = step.fields.filter(field => {
        const profileKey = field.id === "disability" ? "disabilityStatus" : field.id;
        const val = profile[profileKey];
        return val === undefined || val === null || String(val).trim() === "";
      });
      return {
        ...step,
        fields: missingFields
      };
    }).filter(step => step.fields.length > 0);
  }, [profile]);

  // Redirect if profile is fully complete
  React.useEffect(() => {
    if (profile && activeSteps.length === 0 && !isProfileLoading) {
      const activeId = userId || localStorage.getItem("js_guest_user_id");
      nav("/eligibility/results", { replace: true, state: { userId: activeId, answers: profile } });
    }
  }, [profile, activeSteps, isProfileLoading, nav, userId]);

  if (isProfileLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0b3b60] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Verifying saved citizen credentials...</p>
      </div>
    );
  }

  const stepsToUse = activeSteps.length > 0 ? activeSteps : STEPS;
  const step = stepsToUse[stepIndex] || stepsToUse[0];

  const setAnswer = (id, v) => setAnswers((a) => ({ ...a, [id]: v }));
  
  // Verify all fields in current step are filled out
  const stepComplete = step.fields.every(f => answers[f.id] && String(answers[f.id]).trim() !== "");

  const goNext = async () => {
    if (stepIndex < stepsToUse.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setIsSubmitting(true);
      try {
        const mergedProfile = {
          ...profile,
          ...answers,
          disabilityStatus: answers.disability !== undefined ? answers.disability : (profile?.disabilityStatus || "No")
        };
        const res = await profileService.saveProfile(mergedProfile, userId);
        const activeId = res?.user_id || userId || localStorage.getItem("js_guest_user_id");
        if (activeId) {
          if (userId) {
            setUserId(activeId);
          }
          toast.success("Eligibility verification completed!");
          nav("/eligibility/results", { state: { userId: activeId, answers: mergedProfile } });
        } else {
          throw new Error("Missing user_id on profile registration callback");
        }
      } catch (err) {
        console.error(err);
        const errMsg = err?.response?.data?.detail || err?.message || "Server validation error.";
        toast.error(`Eligibility Diagnostic Error: ${errMsg}`);
        nav("/eligibility/results", { state: { error: errMsg, answers } });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up" data-testid="eligibility-checker">
      
      {/* Top Breadcrumb */}
      <button 
        disabled={isSubmitting}
        onClick={() => stepIndex > 0 ? setStepIndex(stepIndex - 1) : nav(-1)} 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer" 
        data-testid="elig-back"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Previous Step
      </button>

      {/* Main Diagnostic Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Tricolor line */}
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Strip */}
          <div className="flex items-center justify-between border-b border-slate-150 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">भारत सरकार</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-700 uppercase">Government of India</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0b3b60] border border-blue-200">
                नागरिक पात्रता मूल्यांकन प्रणाली
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>GIGW Compliant Diagnostic</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Section {stepIndex + 1} of {stepsToUse.length}</span>
              <span className="text-[#0b3b60]">{Math.round(((stepIndex + 1) / stepsToUse.length) * 100)}% Complete</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full bg-[#0b3b60] transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / stepsToUse.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 mb-2">
              <Sparkles className="w-3 h-3 text-amber-600" /> AI-Assisted Eligibility Diagnostic
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {step.title}
            </h1>
            {step.hindi && (
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{step.hindi}</p>
            )}
            <p className="text-xs text-slate-600 mt-1.5">{step.body}</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6 pt-2" data-testid="elig-form">
            {step.fields.map((f) => (
              <Field key={f.id} field={f} value={answers[f.id]} onChange={(v) => setAnswer(f.id, v)} disabled={isSubmitting} />
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-5 mt-4">
            <span className="text-[11px] text-slate-500 text-center sm:text-left">
              Data is processed securely in accordance with National Data Governance Framework.
            </span>
            
            <Button
              onClick={goNext}
              disabled={!stepComplete || isSubmitting}
              data-testid="elig-next"
              className="w-full sm:w-auto h-11 px-7 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Eligibility...
                </>
              ) : stepIndex === stepsToUse.length - 1 ? (
                <>
                  <span>Generate Eligibility Report</span> <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Proceed to Next Step</span> <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ field, value, onChange, disabled }) {
  if (field.type === "radio") {
    return (
      <div className="space-y-2">
        <Label className="font-bold text-slate-800 text-xs block">{field.label}</Label>
        <RadioGroup value={value || ""} onValueChange={onChange} className="grid sm:grid-cols-2 gap-2.5" disabled={disabled}>
          {field.options.map((opt) => (
            <label
              key={opt}
              htmlFor={`${field.id}-${opt}`}
              data-testid={`opt-${field.id}-${opt.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors text-xs font-semibold ${
                value === opt ? "border-[#0b3b60] bg-blue-50/70 text-[#0b3b60]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RadioGroupItem value={opt} id={`${field.id}-${opt}`} disabled={disabled} />
              <span className="flex-1">{opt}</span>
              {value === opt && <CheckCircle2 className="w-4 h-4 text-[#0b3b60] ml-auto flex-shrink-0" />}
            </label>
          ))}
        </RadioGroup>
      </div>
    );
  }
  
  if (field.type === "select") {
    return (
      <div className="space-y-2">
        <Label className="font-bold text-slate-800 text-xs block">{field.label}</Label>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          data-testid={`select-${field.id}`}
          className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-[#0b3b60] outline-none transition-colors disabled:opacity-50"
        >
          <option value="">Select State / UT...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="font-bold text-slate-800 text-xs block">{field.label}</Label>
      <Input
        type={field.type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder}
        data-testid={`input-${field.id}`}
        className="h-11 rounded-lg border border-slate-200 focus:border-[#0b3b60] bg-white text-xs font-medium text-slate-800"
      />
    </div>
  );
}
