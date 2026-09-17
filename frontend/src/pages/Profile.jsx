import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Shield, Briefcase, Calendar, MapPin, IndianRupee,
  GraduationCap, Users, Loader2, LogOut, Sparkles, Landmark,
  ShieldCheck, FileText, CheckCircle2, QrCode
} from "lucide-react";
import { profileService } from "@/services/profileService";
import { useApp } from "@/context/AppContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Zod validation schema for demographic preferences
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(1, "Age must be at least 1").max(115, "Please enter a valid age"),
  gender: z.enum(["Female", "Male", "Other"], { errorMap: () => ({ message: "Please select a gender" }) }),
  state: z.string().min(1, "Please select a state"),
  district: z.string().min(1, "District is required"),
  occupation: z.string().min(1, "Please select an occupation"),
  income: z.string().min(1, "Please select an annual income bracket"),
  education: z.string().min(1, "Please select education level"),
  category: z.string().min(1, "Please select community category"),
  disabilityStatus: z.enum(["No", "Yes"], { errorMap: () => ({ message: "Please select disability status" }) }),
});

const STATES = [
  "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu",
  "Telangana", "Uttar Pradesh", "West Bengal"
];

const OCCUPATIONS = [
  "Farmer", "Self-employed", "Salaried Employee", "Student", "Unemployed", "Retired"
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

const ALL_DOCUMENTS = [
  "Aadhaar Card", "PAN Card", "Bank Passbook", "Income Certificate",
  "Domicile Certificate", "Caste Certificate", "Disability Certificate",
  "Land Record", "Passport Size Photograph"
];

export default function Profile() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { userId, setUserId } = useApp();

  const [showGuestProfile, setShowGuestProfile] = useState(() => {
    if (userId) return true;
    const hasGuestProfile = localStorage.getItem("js_profile_guest");
    return !!hasGuestProfile;
  });

  const [guestProfile, setGuestProfile] = useState(() => {
    if (!userId) {
      try {
        const guestData = localStorage.getItem("js_profile_guest");
        return guestData ? JSON.parse(guestData) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [checkedDocs, setCheckedDocs] = useState(() => {
    try {
      const savedDocs = localStorage.getItem(userId ? `js_user_documents_${userId}` : "js_user_documents_guest");
      return savedDocs ? JSON.parse(savedDocs) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      const savedDocs = localStorage.getItem(userId ? `js_user_documents_${userId}` : "js_user_documents_guest");
      setCheckedDocs(savedDocs ? JSON.parse(savedDocs) : []);
    } catch (e) {
      setCheckedDocs([]);
    }
  }, [userId]);

  const handleDocumentToggle = (doc) => {
    setCheckedDocs((prev) => {
      const exists = prev.includes(doc);
      const updated = exists ? prev.filter((d) => d !== doc) : [...prev, doc];
      localStorage.setItem(userId ? `js_user_documents_${userId}` : "js_user_documents_guest", JSON.stringify(updated));
      return updated;
    });
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profilePreferences", userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
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
    },
    values: userId ? (profile || undefined) : (guestProfile || undefined)
  });

  const activeGender = watch("gender");
  const activeDisability = watch("disabilityStatus");

  // Watch fields for completion progress
  const watchAllFields = watch();
  const completionPercent = React.useMemo(() => {
    const fields = ["name", "age", "gender", "state", "district", "occupation", "income", "education", "category", "disabilityStatus"];
    let filled = 0;
    fields.forEach(f => {
      if (watchAllFields[f] !== undefined && watchAllFields[f] !== null && String(watchAllFields[f]).trim() !== "") {
        filled++;
      }
    });
    return Math.round((filled / fields.length) * 100);
  }, [watchAllFields]);

  // Save demographic preferences to Supabase backend via FastAPI
  const saveMutation = useMutation({
    mutationFn: (data) => profileService.saveProfile(data, userId),
    onSuccess: (res) => {
      if (res && res.user_id) {
        setUserId(res.user_id);
      }
      toast.success("Citizen preferences updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profilePreferences"] });
    },
    onError: () => {
      toast.error("Failed to save preferences. Central database unreachable.");
    }
  });

  const onSubmit = (data) => {
    if (userId) {
      saveMutation.mutate(data);
    } else {
      localStorage.setItem("js_profile_guest", JSON.stringify(data));
      const guestExtra = {
        category: data.category,
        disabilityStatus: data.disabilityStatus,
        district: data.district,
        state: data.state
      };
      localStorage.setItem(`js_profile_extra_guest`, JSON.stringify(guestExtra));
      setGuestProfile(data);
      toast.success("Demographic parameters saved locally!");
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0b3b60] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Querying National Citizen Directory...</p>
      </div>
    );
  }

  const citizenName = profile?.name || guestProfile?.name || "Citizen of India";
  const citizenState = profile?.state || guestProfile?.state || "All India";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up" data-testid="profile-page">
      
      {/* Official Government Header */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
            <span className="text-slate-900">भारत सरकार</span>
            <span className="text-slate-300">|</span>
            <span className="uppercase text-slate-700">Government of India</span>
            <span className="bg-blue-50 text-[#0b3b60] border border-blue-200 px-2 py-0.5 rounded text-[10px]">
              नागरिक पहचान एवं प्रोफ़ाइल
            </span>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Citizen Profile & Demographic Record
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              नागरिक विवरण, दस्तावेज एवं पात्रता प्राथमिकताएं
            </p>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
              Maintain your demographic indicators to enable automated AI evaluation across central ministries and state welfare schemes.
            </p>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column: Official Citizen Identity Card */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Card Tricolor Accent */}
            <div className="w-full h-1 flex">
              <div className="h-full flex-1 bg-[#FF9933]" />
              <div className="h-full flex-1 bg-slate-100" />
              <div className="h-full flex-1 bg-[#138808]" />
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0b3b60] text-white flex items-center justify-center font-bold text-sm">
                    जन
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-none">JanSahay ID</p>
                    <p className="text-[10px] text-slate-400 font-semibold">National Portal Pass</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                  {userId ? "VERIFIED" : "GUEST"}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Citizen Name</p>
                <p className="text-sm font-bold text-slate-900">{citizenName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Jurisdiction / State</p>
                <p className="text-xs font-semibold text-slate-800">{citizenState}</p>
              </div>

              {userId && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Citizen Reference UID</p>
                  <p className="text-xs font-mono font-bold text-slate-700 truncate">{userId}</p>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>DBT & DigiLocker Ready</span>
              </div>

              {/* Logout button */}
              {userId && (
                <div className="border-t border-slate-150 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUserId(null);
                      toast.success("Successfully logged out.");
                      nav("/signin");
                    }}
                    className="w-full h-9 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    data-testid="profile-logout-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out Citizen ID
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Form or Guest Options */}
        {!userId && !showGuestProfile ? (
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 border border-slate-200 rounded-xl flex flex-col items-center text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0b3b60] grid place-items-center border border-blue-200">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-display font-bold text-base text-slate-900">National Citizen Authentication</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sign in with your Citizen ID or register a new identity profile to securely sync welfare entitlements.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pt-2">
                <button
                  onClick={() => nav("/signin")}
                  className="flex-1 h-10 rounded-lg bg-[#0b3b60] hover:bg-[#07253d] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Citizen Sign In
                </button>
                <button
                  onClick={() => nav("/create-id")}
                  className="flex-1 h-10 rounded-lg border border-[#0b3b60] text-[#0b3b60] bg-white hover:bg-blue-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Create Citizen ID
                </button>
              </div>

              <button
                onClick={() => setShowGuestProfile(true)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 hover:underline pt-1 cursor-pointer"
                data-testid="continue-as-guest"
              >
                Continue in Guest Mode
              </button>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 space-y-6">
            {!userId && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-900">
                <span>⚠️ <strong>Guest Mode:</strong> Preferences are stored in your local session. Sign in to link across devices.</span>
                <div className="flex gap-2 font-bold">
                  <button onClick={() => nav("/signin")} className="text-[#0b3b60] hover:underline cursor-pointer">
                    Sign In
                  </button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => setShowGuestProfile(false)} className="text-slate-600 hover:underline cursor-pointer">
                    Options
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 shadow-xs">
              {/* Completion Bar */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Profile Readiness</span>
                  <span className={completionPercent === 100 ? "text-emerald-700" : "text-amber-700"}>
                    {completionPercent}% Complete
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-[#0b3b60] transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-150 pb-2 uppercase tracking-wide">
                Demographic Information / व्यक्तिगत विवरण
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Full Name (पूरा नाम)</Label>
                  <Input
                    {...register("name")}
                    placeholder="e.g. Ramesh Kumar"
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                    data-testid="profile-name-input"
                  />
                  {errors.name && <p className="text-[10px] font-semibold text-rose-600">{errors.name.message}</p>}
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Age (उम्र)</Label>
                  <Input
                    type="number"
                    {...register("age")}
                    placeholder="e.g. 35"
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                    data-testid="profile-age-input"
                  />
                  {errors.age && <p className="text-[10px] font-semibold text-rose-600">{errors.age.message}</p>}
                </div>

                {/* Gender */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-800">Gender (लिंग)</Label>
                  <div className="flex gap-2.5">
                    {["Female", "Male", "Other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setValue("gender", g)}
                        className={`flex-1 h-9 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          activeGender === g 
                            ? "bg-blue-50 border-[#0b3b60] text-[#0b3b60] font-bold" 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {errors.gender && <p className="text-[10px] font-semibold text-rose-600">{errors.gender.message}</p>}
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">State (राज्य)</Label>
                  <select
                    {...register("state")}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select State...</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-[10px] font-semibold text-rose-600">{errors.state.message}</p>}
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">District (जिला)</Label>
                  <Input
                    {...register("district")}
                    placeholder="e.g. Patna"
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                  />
                  {errors.district && <p className="text-[10px] font-semibold text-rose-600">{errors.district.message}</p>}
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Occupation (व्यवसाय)</Label>
                  <select
                    {...register("occupation")}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select Occupation...</option>
                    {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.occupation && <p className="text-[10px] font-semibold text-rose-600">{errors.occupation.message}</p>}
                </div>

                {/* Income */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Annual Income (वार्षिक आय)</Label>
                  <select
                    {...register("income")}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select Income Bracket...</option>
                    {INCOME_BRACKETS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {errors.income && <p className="text-[10px] font-semibold text-rose-600">{errors.income.message}</p>}
                </div>

                {/* Education */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Education Level (शिक्षा)</Label>
                  <select
                    {...register("education")}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select Education...</option>
                    {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {errors.education && <p className="text-[10px] font-semibold text-rose-600">{errors.education.message}</p>}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Community Category (जाति वर्ग)</Label>
                  <select
                    {...register("category")}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-[#0b3b60] transition-colors"
                  >
                    <option value="">Select Category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="text-[10px] font-semibold text-rose-600">{errors.category.message}</p>}
                </div>

                {/* Disability Status */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-800">Registered Disability Certificate (दिव्यांग स्थिति)</Label>
                  <div className="flex gap-2.5">
                    {["No", "Yes"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setValue("disabilityStatus", option)}
                        className={`flex-1 h-9 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          activeDisability === option 
                            ? "bg-blue-50 border-[#0b3b60] text-[#0b3b60] font-bold" 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {errors.disabilityStatus && <p className="text-[10px] font-semibold text-rose-600">{errors.disabilityStatus.message}</p>}
                </div>

              </div>

              {/* Save Preferences Button */}
              <div className="pt-3 border-t border-slate-150 flex justify-end">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="h-10 px-6 bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                  data-testid="save-preferences-btn"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Details...
                    </>
                  ) : (
                    "Save Official Profile"
                  )}
                </Button>
              </div>
            </form>

            {/* My Documents Checklist */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-xs">
              <div className="border-b border-slate-150 pb-2">
                <h3 className="font-display text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Verified Documents Repository / नागरिक दस्तावेज
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Select the verified certificates currently in your DigiLocker or physical possession.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_DOCUMENTS.map((doc) => {
                  const hasDoc = checkedDocs.includes(doc);
                  return (
                    <label
                      key={doc}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        hasDoc ? "border-[#0b3b60] bg-blue-50/50 text-[#0b3b60]" : "border-slate-200 hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={hasDoc}
                        onChange={() => handleDocumentToggle(doc)}
                        className="w-4 h-4 rounded text-[#0b3b60] border-slate-300 focus:ring-[#0b3b60] cursor-pointer"
                        data-testid={`doc-${doc.toLowerCase().replace(/ /g, "-")}`}
                      />
                      <span className="text-xs font-semibold flex-1">{doc}</span>
                      {hasDoc && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
