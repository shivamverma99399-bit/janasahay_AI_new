import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
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
    title: "Demographic profile",
    body: "We will query schemes matches based on your age, gender, and home state.",
    fields: [
      { id: "age", label: "Age of Applicant", type: "number", placeholder: "e.g. 32" },
      { id: "gender", label: "Gender", type: "radio", options: ["Female", "Male", "Other"] },
      { id: "state", label: "State of Residence", type: "select", options: ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"] },
    ]
  },
  {
    id: "income",
    title: "Income & Occupation",
    body: "Used by the backend to verify income caps and occupational sectors.",
    fields: [
      { id: "occupation", label: "Occupation Status", type: "radio", options: ["Farmer", "Self-employed", "Salaried", "Student", "Unemployed", "Retired"] },
      { id: "income", label: "Annual Household Income", type: "radio", options: ["Below ₹1 Lakh", "₹1L – ₹3L", "₹3L – ₹6L", "₹6L – ₹18L", "Above ₹18L"] },
    ]
  },
  {
    id: "social",
    title: "Social Category",
    body: "Reservation filters for minority and social community quotas.",
    fields: [
      { id: "category", label: "Community Category", type: "radio", options: ["General", "OBC", "SC", "ST", "EWS"] },
      { id: "disability", label: "Differently-Abled (Disability Certificate holders)", type: "radio", options: ["No", "Yes"] },
    ]
  },
  {
    id: "family",
    title: "Household & Farming Details",
    body: "Final verification items for family-centric schemes.",
    fields: [
      { id: "household", label: "Household Size (Family Members)", type: "number", placeholder: "e.g. 4" },
      { id: "girl_child", label: "Do you have a girl child below the age of 10?", type: "radio", options: ["No", "Yes"] },
      { id: "land", label: "Do you own cultivable farmland?", type: "radio", options: ["No", "Yes — less than 2 acres", "Yes — more than 2 acres"] },
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
        <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
        <p className="text-sm font-semibold text-brand-muted">Verifying saved preferences...</p>
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
        // Submit user details as a profile to get a valid user_id
        const res = await profileService.saveProfile(mergedProfile, userId);
        const activeId = res?.user_id || userId || localStorage.getItem("js_guest_user_id");
        if (activeId) {
          if (userId) {
            setUserId(activeId);
          }
          toast.success("AI Profile matched successfully!");
          nav("/eligibility/results", { state: { userId: activeId, answers: mergedProfile } });
        } else {
          throw new Error("Missing user_id on profile registration callback");
        }
      } catch (err) {
        console.error(err);
        const errMsg = err?.response?.data?.detail || err?.message || "Server validation error.";
        toast.error(`Profile Registration Failed: ${errMsg}`);
        // Redirect with error state
        nav("/eligibility/results", { state: { error: errMsg, answers } });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up" data-testid="eligibility-checker">
      <button 
        disabled={isSubmitting}
        onClick={() => stepIndex > 0 ? setStepIndex(stepIndex - 1) : nav(-1)} 
        className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-ink mb-6 disabled:opacity-40 transition-colors" 
        data-testid="elig-back"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-semibold text-brand-ink">Step {stepIndex + 1} of {stepsToUse.length}</span>
          <span className="text-brand-muted">{Math.round(((stepIndex + 1) / stepsToUse.length) * 100)}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-blue to-brand-green transition-all duration-300" style={{ width: `${((stepIndex + 1) / stepsToUse.length) * 100}%` }} />
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 chip bg-brand-blueLight text-brand-blue mb-4">
        <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-pulse" /> AI-Powered Verification Check
      </span>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">{step.title}</h1>
      <p className="text-brand-muted mt-2">{step.body}</p>

      <div className="mt-10 space-y-8" data-testid="elig-form">
        {step.fields.map((f) => (
          <Field key={f.id} field={f} value={answers[f.id]} onChange={(v) => setAnswer(f.id, v)} disabled={isSubmitting} />
        ))}
      </div>

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
        <span className="text-xs text-brand-muted text-center sm:text-left">JanSahay processes demographic queries securely on the central node.</span>
        
        <Button
          onClick={goNext}
          disabled={!stepComplete || isSubmitting}
          data-testid="elig-next"
          className="w-full sm:w-auto h-12 px-8 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-40 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Matching...
            </>
          ) : stepIndex === stepsToUse.length - 1 ? (
            <>
              Perform Diagnostic <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Continue <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({ field, value, onChange, disabled }) {
  if (field.type === "radio") {
    return (
      <div className="space-y-3">
        <Label className="font-bold text-brand-ink text-sm block">{field.label}</Label>
        <RadioGroup value={value || ""} onValueChange={onChange} className="grid sm:grid-cols-2 gap-3" disabled={disabled}>
          {field.options.map((opt) => (
            <label
              key={opt}
              htmlFor={`${field.id}-${opt}`}
              data-testid={`opt-${field.id}-${opt.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                value === opt ? "border-brand-blue bg-brand-blueLight/50" : "border-slate-200 hover:border-brand-blue/30"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RadioGroupItem value={opt} id={`${field.id}-${opt}`} disabled={disabled} />
              <span className="text-sm font-semibold text-brand-ink">{opt}</span>
              {value === opt && <CheckCircle2 className="w-4 h-4 text-brand-blue ml-auto flex-shrink-0" />}
            </label>
          ))}
        </RadioGroup>
      </div>
    );
  }
  
  if (field.type === "select") {
    return (
      <div className="space-y-3">
        <Label className="font-bold text-brand-ink text-sm block">{field.label}</Label>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          data-testid={`select-${field.id}`}
          className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white focus:border-brand-blue outline-none transition-colors disabled:opacity-50"
        >
          <option value="">Choose State...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="font-bold text-brand-ink text-sm block">{field.label}</Label>
      <Input
        type={field.type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder}
        data-testid={`input-${field.id}`}
        className="h-12 rounded-xl border-2 border-slate-200 focus:border-brand-blue bg-white font-medium"
      />
    </div>
  );
}
