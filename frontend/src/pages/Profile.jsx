import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Shield, Briefcase, Calendar, MapPin, IndianRupee, GraduationCap, Users, Loader2, LogOut, Sparkles } from "lucide-react";
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
      const next = prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc];
      localStorage.setItem(userId ? `js_user_documents_${userId}` : "js_user_documents_guest", JSON.stringify(next));
      toast.success(`${doc} check status updated!`);
      return next;
    });
  };

  // Load demographic preferences from Supabase backend
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profilePreferences", userId],
    queryFn: async () => {
      try {
        if (!userId) return null;
        return await profileService.getProfile(userId);
      } catch (err) {
        // Return null if endpoint fails, enabling fallback default blank form
        return null;
      }
    },
    enabled: !!userId
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
      toast.success("Demographic preferences updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profilePreferences"] });
    },
    onError: () => {
      toast.error("Failed to save preferences. Server database offline.");
    }
  });

  const onSubmit = (data) => {
    if (userId) {
      saveMutation.mutate(data);
    } else {
      localStorage.setItem("js_profile_guest", JSON.stringify(data));
      // Populate guest extra demographics so eligibility engine receives it correctly
      const guestExtra = {
        category: data.category,
        disabilityStatus: data.disabilityStatus,
        district: data.district,
        state: data.state
      };
      localStorage.setItem(`js_profile_extra_guest`, JSON.stringify(guestExtra));
      setGuestProfile(data);
      toast.success("Guest preferences saved locally!");
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
        <p className="text-sm font-semibold text-brand-muted">Loading preferences from server Supabase...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up" data-testid="profile-page">
      
      {/* Title */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-brand-blue">Citizen File</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mt-1">Profile & Preferences</h1>
        <p className="text-brand-muted mt-1">Submit demographic indicators to configure matched AI matching recommendations. Data is stored securely on Supabase.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Column Info */}
        <div className="space-y-4 md:col-span-1">
          <div className="card-soft p-6 space-y-6 border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-blueLight text-brand-blue grid place-items-center flex-shrink-0 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-brand-ink">Identity Profile</h3>
                <p className="text-[10px] text-slate-400 font-medium">Independent Citizen Node</p>
              </div>
            </div>

            <p className="text-xs text-brand-muted leading-relaxed">
              These criteria will be used during scheme querying to match eligibility guidelines set by the Government of India.
            </p>

            <div className="flex items-center gap-2 border-t pt-4 text-xs font-semibold text-emerald-700 bg-emerald-50/30 p-2.5 rounded-lg border-emerald-100">
              <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              Direct Supabase Database Encryption
            </div>

            {/* Logout shortcut */}
            {userId && (
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setUserId(null);
                    toast.success("Successfully logged out.");
                    nav("/signin");
                  }}
                  className="w-full h-10 rounded-lg border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  data-testid="profile-logout-btn"
                >
                  <LogOut className="w-4 h-4" /> Log Out Citizen ID
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column Form or Guest Nudge */}
        {!userId && !showGuestProfile ? (
          <div className="md:col-span-2 space-y-6">
            <div className="card-soft p-8 border border-slate-150 bg-white flex flex-col items-center text-center space-y-5 shadow-sm rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-brand-blueLight text-brand-blue grid place-items-center">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="font-display font-bold text-lg text-brand-ink">Configure Identity Profile</h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Sign in to save your profile, documents, and receive personalized recommendations.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
                <button
                  onClick={() => nav("/signin")}
                  className="flex-1 h-10 rounded-lg bg-brand-blue hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => nav("/create-id")}
                  className="flex-1 h-10 rounded-lg border border-brand-blue text-brand-blue bg-white hover:bg-brand-blueLight text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-spin" style={{ animationDuration: "3s" }} /> Create ID
                </button>
              </div>

              <button
                onClick={() => setShowGuestProfile(true)}
                className="text-xs font-bold text-slate-500 hover:text-brand-ink hover:underline pt-2"
                data-testid="continue-as-guest"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 space-y-6">
            {!userId && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-amber-850">
                  ⚠️ You are in <strong>Guest Mode</strong>. Preferences are saved locally on this browser. Sign in to save across devices.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => nav("/signin")} className="text-[11px] font-bold text-brand-blue hover:underline whitespace-nowrap">
                    Sign In
                  </button>
                  <span className="text-slate-350">|</span>
                  <button onClick={() => setShowGuestProfile(false)} className="text-[11px] font-bold text-slate-500 hover:underline whitespace-nowrap">
                    Show Options
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="card-soft p-6 sm:p-8 border border-slate-100 bg-white space-y-6 shadow-sm">
              
              {/* Completion Indicator Widget */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-ink">Profile Completion</span>
                  <span className={`font-extrabold ${completionPercent === 100 ? "text-brand-green" : "text-brand-orange"}`}>
                    {completionPercent}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-orange to-brand-green transition-all duration-500" 
                    style={{ width: `${completionPercent}%` }} 
                  />
                </div>
                <p className="text-[10px] text-brand-muted">
                  {completionPercent === 100 
                    ? "✓ Your profile is fully configured for accurate eligibility diagnostics!" 
                    : "Fill in all fields to maximize Saathi AI matching accuracy."}
                </p>
              </div>

              <h3 className="font-display text-lg font-bold text-brand-ink border-b pb-2">Demographic Questionnaire</h3>
              
              <div className="grid sm:grid-cols-2 gap-5">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-brand-ink">Full Name</Label>
                  <Input
                    {...register("name")}
                    placeholder="e.g. Ramesh Kumar"
                    className="h-11 rounded-lg border bg-slate-50 focus:bg-white"
                    data-testid="profile-name-input"
                  />
                  {errors.name && <p className="text-[10px] font-semibold text-rose-600">{errors.name.message}</p>}
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-brand-ink">Age</Label>
                  <Input
                    type="number"
                    {...register("age")}
                    placeholder="e.g. 35"
                    className="h-11 rounded-lg border bg-slate-50 focus:bg-white"
                    data-testid="profile-age-input"
                  />
                  {errors.age && <p className="text-[10px] font-semibold text-rose-600">{errors.age.message}</p>}
                </div>

                {/* Gender */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-brand-ink">Gender</Label>
                  <div className="flex gap-3">
                    {["Female", "Male", "Other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setValue("gender", g)}
                        className={`flex-1 h-10 border rounded-lg text-xs font-semibold transition-all ${
                          activeGender === g 
                            ? "bg-brand-blueLight border-brand-blue text-brand-blue" 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700"
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
                  <Label className="text-xs font-bold text-brand-ink">State of Residence</Label>
                  <select
                    {...register("state")}
                    className="w-full h-11 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                  >
                    <option value="">Select State...</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-[10px] font-semibold text-rose-600">{errors.state.message}</p>}
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-brand-ink">District</Label>
                  <Input
                    {...register("district")}
                    placeholder="e.g. Patna"
                    className="h-11 rounded-lg border bg-slate-50 focus:bg-white"
                  />
                  {errors.district && <p className="text-[10px] font-semibold text-rose-600">{errors.district.message}</p>}
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-brand-ink">Occupation</Label>
                  <select
                    {...register("occupation")}
                    className="w-full h-11 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                  >
                    <option value="">Select Occupation...</option>
                    {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.occupation && <p className="text-[10px] font-semibold text-rose-600">{errors.occupation.message}</p>}
                </div>

                {/* Income */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-brand-ink">Annual Household Income</Label>
                  <select
                    {...register("income")}
                    className="w-full h-11 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                  >
                    <option value="">Select Income Bracket...</option>
                    {INCOME_BRACKETS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {errors.income && <p className="text-[10px] font-semibold text-rose-600">{errors.income.message}</p>}
                </div>

                {/* Education */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-brand-ink">Education Level</Label>
                  <select
                    {...register("education")}
                    className="w-full h-11 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                  >
                    <option value="">Select Education...</option>
                    {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {errors.education && <p className="text-[10px] font-semibold text-rose-600">{errors.education.message}</p>}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-brand-ink">Community Category</Label>
                  <select
                    {...register("category")}
                    className="w-full h-11 px-3 border rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-brand-blue transition-colors"
                  >
                    <option value="">Select Category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="text-[10px] font-semibold text-rose-600">{errors.category.message}</p>}
                </div>

                {/* Disability Status */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-brand-ink font-medium">Do you have a registered disability certificate?</Label>
                  <div className="flex gap-3">
                    {["No", "Yes"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setValue("disabilityStatus", option)}
                        className={`flex-1 h-10 border rounded-lg text-xs font-semibold transition-all ${
                          activeDisability === option 
                            ? "bg-brand-blueLight border-brand-blue text-brand-blue" 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-750"
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
              <div className="pt-4 border-t flex justify-end">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="h-11 px-8 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2"
                  data-testid="save-preferences-btn"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </div>
            </form>

            {/* My Documents Checklist Card */}
            <div className="card-soft p-6 sm:p-8 border border-slate-100 bg-white space-y-6 shadow-sm rounded-2xl">
              <div>
                <h3 className="font-display text-lg font-bold text-brand-ink">My Documents</h3>
                <p className="text-xs text-brand-muted mt-1">Select the documents you currently possess. These will be matched against scheme requirements.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {ALL_DOCUMENTS.map((doc) => {
                  const hasDoc = checkedDocs.includes(doc);
                  return (
                    <label
                      key={doc}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        hasDoc ? "border-brand-blue bg-brand-blueLight/30" : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={hasDoc}
                        onChange={() => handleDocumentToggle(doc)}
                        className="w-4 h-4 rounded text-brand-blue border-slate-350 focus:ring-brand-blue cursor-pointer"
                        data-testid={`doc-${doc.toLowerCase().replace(/ /g, "-")}`}
                      />
                      <span className="text-xs font-semibold text-brand-ink">{doc}</span>
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
