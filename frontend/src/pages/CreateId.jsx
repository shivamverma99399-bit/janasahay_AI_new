import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { profileService } from "@/services/profileService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Sparkles, Loader2, ClipboardCheck, ArrowRight, UserCheck } from "lucide-react";
import { Logo } from "@/components/Layout";

const STATES = [
  "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu",
  "Telangana", "Uttar Pradesh", "West Bengal"
];

const OCCUPATIONS = [
  "Farmer", "Self-employed", "Salaried", "Student", "Unemployed", "Retired"
];

const INCOME_BRACKETS = [
  "Below ₹1 Lakh", "₹1L – ₹3L", "₹3L – ₹6L", "₹6L – ₹18L", "Above ₹18L"
];

const EDUCATION_LEVELS = [
  "Primary Education", "Secondary (Class 10)", "Senior Secondary (Class 12)",
  "Diploma", "Undergraduate Degree", "Postgraduate or Above", "No Formal Education"
];

const CATEGORIES = [
  "General", "OBC", "SC", "ST", "EWS"
];

export default function CreateId() {
  const nav = useNavigate();
  const { setUserId } = useApp();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Female",
    state: "",
    district: "",
    occupation: "",
    income: "",
    education: "",
    category: "",
    disabilityStatus: "No",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.state || !formData.occupation || !formData.income || !formData.education || !formData.category) {
      toast.error("Please fill in all the required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await profileService.saveProfile(formData);
      if (res && res.user_id) {
        setCreatedId(res.user_id);
        toast.success("JanSahay Citizen ID generated successfully!");
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err) {
      toast.error("Profile registration failed. Server offline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (createdId) {
      navigator.clipboard.writeText(createdId);
      toast.success("JanSahay ID copied to clipboard!");
    }
  };

  const enterPortal = () => {
    if (createdId) {
      setUserId(createdId);
      nav("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden animate-fade-in-up" data-testid="create-id-page">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blueLight/30 rounded-bl-full filter blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50/40 rounded-tr-full filter blur-3xl -z-10" />

      {!createdId ? (
        <div className="w-full max-w-2xl card-soft border border-slate-100 bg-white p-8 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4">
            <Logo />
            <div className="text-center sm:text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-blue uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-brand-orange animate-pulse" /> Digital Identity Node
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-brand-ink">Generate Citizen ID</h1>
            <p className="text-xs text-brand-muted">
              Register your profile details to obtain a secure JanSahay ID and match eligibility specifications.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-ink">Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  data-testid="reg-name"
                  className="h-10 rounded-lg border bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-ink">Age</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  placeholder="e.g. 35"
                  required
                  data-testid="reg-age"
                  className="h-10 rounded-lg border bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-brand-ink">Gender</Label>
                <div className="flex gap-3">
                  {["Female", "Male", "Other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleChange("gender", g)}
                      className={`flex-1 h-10 border rounded-lg text-xs font-semibold transition-all ${
                        formData.gender === g
                          ? "bg-brand-blueLight border-brand-blue text-brand-blue"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-ink">State of Residence</Label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  required
                  data-testid="reg-state"
                  className="w-full h-10 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                >
                  <option value="">Select State...</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-ink">District</Label>
                <Input
                  value={formData.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  placeholder="e.g. Patna"
                  className="h-10 rounded-lg border bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              {/* Occupation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-ink">Occupation</Label>
                <select
                  value={formData.occupation}
                  onChange={(e) => handleChange("occupation", e.target.value)}
                  required
                  data-testid="reg-occupation"
                  className="w-full h-10 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                >
                  <option value="">Select Occupation...</option>
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Income */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-ink">Annual Household Income</Label>
                <select
                  value={formData.income}
                  onChange={(e) => handleChange("income", e.target.value)}
                  required
                  data-testid="reg-income"
                  className="w-full h-10 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                >
                  <option value="">Select Income Bracket...</option>
                  {INCOME_BRACKETS.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              {/* Education */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-ink">Education Level</Label>
                <select
                  value={formData.education}
                  onChange={(e) => handleChange("education", e.target.value)}
                  required
                  data-testid="reg-education"
                  className="w-full h-10 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                >
                  <option value="">Select Education...</option>
                  {EDUCATION_LEVELS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-ink">Community Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  required
                  data-testid="reg-category"
                  className="w-full h-10 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                >
                  <option value="">Select Category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Disability Status */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-brand-ink">Do you have a registered disability certificate?</Label>
                <div className="flex gap-3">
                  {["No", "Yes"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleChange("disabilityStatus", option)}
                      className={`flex-1 h-10 border rounded-lg text-xs font-semibold transition-all ${
                        formData.disabilityStatus === option
                          ? "bg-brand-blueLight border-brand-blue text-brand-blue"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-750"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-5 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => nav("/signin")}
                className="text-xs font-semibold text-brand-muted hover:text-brand-ink"
              >
                Back to Sign In
              </button>

              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="reg-submit"
                className="h-11 px-8 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  "Generate JanSahay ID"
                )}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* Success Identity Card Modal Screen */
        <div className="w-full max-w-lg space-y-6 text-center animate-fade-in-up">
          <div className="card-soft border-2 border-emerald-100 p-8 bg-white space-y-6 shadow-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="text-left">
                <p className="font-display font-extrabold text-brand-ink tracking-tight">जनसहाय भारत</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Government of India Nodal ID</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-green grid place-items-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Verification Badge */}
            <div className="py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-100 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 mx-auto">
              <Shield className="w-4 h-4 text-emerald-600" /> Identity Verified and Saved to Supabase
            </div>

            {/* Profile Info */}
            <div className="text-left space-y-3 text-sm border-y py-4 my-2">
              <div className="flex justify-between">
                <span className="text-brand-muted font-medium">Citizen Name:</span>
                <span className="font-semibold text-brand-ink">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted font-medium">State / Region:</span>
                <span className="font-semibold text-brand-ink">{formData.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted font-medium">Category:</span>
                <span className="font-semibold text-brand-ink">{formData.category}</span>
              </div>
              <div className="flex flex-col gap-1 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Your JanSahay ID (UUID):</span>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-slate-50 font-mono text-xs text-brand-ink">
                  <span className="truncate pr-2">{createdId}</span>
                  <button
                    onClick={copyToClipboard}
                    data-testid="copy-id-btn"
                    className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-brand-blue flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-450 leading-normal max-w-sm mx-auto">
              Please copy and save this Citizen ID. You will need it to sign in during subsequent demo sessions.
            </p>

            <Button
              onClick={enterPortal}
              data-testid="enter-portal-btn"
              className="w-full h-11 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 mt-4"
            >
              Enter JanSahay Portal <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
