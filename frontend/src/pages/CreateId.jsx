import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { profileService } from "@/services/profileService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Sparkles, Loader2, ClipboardCheck, ArrowRight, UserCheck, Landmark, ShieldCheck } from "lucide-react";
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
  const [formData, setFormData] = useState(() => {
    try {
      const guestData = localStorage.getItem("js_profile_guest");
      if (guestData) {
        const parsed = JSON.parse(guestData);
        return {
          name: parsed.name || "",
          age: parsed.age || "",
          gender: parsed.gender || "Female",
          state: parsed.state || "",
          district: parsed.district || "",
          occupation: parsed.occupation || "",
          income: parsed.income || "",
          education: parsed.education || "",
          category: parsed.category || "",
          disabilityStatus: parsed.disabilityStatus || "No",
        };
      }
    } catch (e) {}
    return {
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
    };
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
        const newUserId = res.user_id;

        const guestDocs = localStorage.getItem("js_user_documents_guest");
        if (guestDocs) {
          localStorage.setItem(`js_user_documents_${newUserId}`, guestDocs);
        }

        const guestExtra = localStorage.getItem("js_profile_extra_guest");
        if (guestExtra) {
          localStorage.setItem(`js_profile_extra_${newUserId}`, guestExtra);
        }

        localStorage.removeItem("js_profile_guest");
        localStorage.removeItem("js_profile_extra_guest");
        localStorage.removeItem("js_guest_user_id");
        localStorage.removeItem("js_user_documents_guest");
        sessionStorage.removeItem("js_chat_conversations_guest");

        setCreatedId(newUserId);
        toast.success("Citizen Identity Pass created successfully!");
      } else {
        toast.error("Failed to generate Citizen ID from central authority.");
      }
    } catch (err) {
      toast.error("Central registration endpoint unreachable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdId) return;
    navigator.clipboard.writeText(createdId);
    toast.success("Citizen ID copied to clipboard!");
  };

  const enterPortal = () => {
    if (createdId) {
      setUserId(createdId);
      nav("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative" data-testid="create-id-page">
      {!createdId ? (
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden space-y-6 animate-fade-in-up">
          {/* Tricolor Ribbon */}
          <div className="w-full h-1.5 flex border-b border-slate-200">
            <div className="h-full flex-1 bg-[#FF9933]" />
            <div className="h-full flex-1 bg-slate-100" />
            <div className="h-full flex-1 bg-[#138808]" />
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <Logo />
              <div className="text-right">
                <span className="text-[10px] font-bold bg-blue-50 text-[#0b3b60] border border-blue-200 px-2 py-0.5 rounded block">
                  नागरिक पहचान पत्र पंजीकरण
                </span>
                <span className="text-[10px] text-slate-400 font-medium">National Citizen Registry</span>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Enroll Citizen Digital Identity
              </h1>
              <p className="text-xs text-slate-500">
                Register your demographic information to generate an official JanSahay Citizen Reference UID for direct scheme eligibility and DBT convergence.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Full Name (पूरा नाम)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    data-testid="reg-name"
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Age (उम्र)</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    placeholder="e.g. 35"
                    required
                    data-testid="reg-age"
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-800">Gender (लिंग)</Label>
                  <div className="flex gap-2.5">
                    {["Female", "Male", "Other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleChange("gender", g)}
                        className={`flex-1 h-9 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          formData.gender === g
                            ? "bg-blue-50 border-[#0b3b60] text-[#0b3b60] font-bold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">State (गृह राज्य)</Label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    required
                    data-testid="reg-state"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select State...</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">District (जिला)</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => handleChange("district", e.target.value)}
                    placeholder="e.g. Patna"
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Occupation (व्यवसाय)</Label>
                  <select
                    value={formData.occupation}
                    onChange={(e) => handleChange("occupation", e.target.value)}
                    required
                    data-testid="reg-occupation"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select Occupation...</option>
                    {OCCUPATIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Income */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Annual Income (वार्षिक आय)</Label>
                  <select
                    value={formData.income}
                    onChange={(e) => handleChange("income", e.target.value)}
                    required
                    data-testid="reg-income"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select Income Bracket...</option>
                    {INCOME_BRACKETS.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>

                {/* Education */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Education (शिक्षा)</Label>
                  <select
                    value={formData.education}
                    onChange={(e) => handleChange("education", e.target.value)}
                    required
                    data-testid="reg-education"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select Education...</option>
                    {EDUCATION_LEVELS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Social Category (जाति वर्ग)</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    required
                    data-testid="reg-category"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select Category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Disability Status */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-800">Registered Disability Certificate (दिव्यांग स्थिति)</Label>
                  <div className="flex gap-2.5">
                    {["No", "Yes"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleChange("disabilityStatus", option)}
                        className={`flex-1 h-9 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          formData.disabilityStatus === option
                            ? "bg-blue-50 border-[#0b3b60] text-[#0b3b60] font-bold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-150 pt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => nav("/signin")}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Already have an ID? Sign In
                </button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="reg-submit"
                  className="h-10 px-6 bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-xs rounded-lg flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enrolling Profile...
                    </>
                  ) : (
                    "Generate Citizen ID"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Success Screen */
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden animate-fade-in-up">
          {/* Tricolor line */}
          <div className="w-full h-1.5 flex border-b border-slate-200">
            <div className="h-full flex-1 bg-[#FF9933]" />
            <div className="h-full flex-1 bg-slate-100" />
            <div className="h-full flex-1 bg-[#138808]" />
          </div>

          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center mx-auto border border-emerald-200">
              <UserCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                पंजीकरण सफल · ENROLLMENT VERIFIED
              </span>
              <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight pt-1">
                Official Citizen Pass Issued
              </h2>
              <p className="text-xs text-slate-500">
                Your credentials have been securely provisioned to the central database.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Citizen Name:</span>
                <span className="font-bold text-slate-900">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">State / Region:</span>
                <span className="font-bold text-slate-900">{formData.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-bold text-slate-900">{formData.category}</span>
              </div>
              
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Your Citizen Reference UID:</span>
                <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-[#0b3b60]">
                  <span className="truncate pr-1">{createdId}</span>
                  <button
                    onClick={copyToClipboard}
                    data-testid="copy-id-btn"
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-[#0b3b60] flex-shrink-0 cursor-pointer"
                    title="Copy to clipboard"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Please save your Citizen ID for future logins and verification across department portals.
            </p>

            <Button
              onClick={enterPortal}
              data-testid="enter-portal-btn"
              className="w-full h-10 bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Access JanSahay Portal</span> <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
