import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Shield, Briefcase, Calendar, MapPin, IndianRupee, GraduationCap, Users, Loader2 } from "lucide-react";
import { profileService } from "@/services/profileService";
import { useApp } from "@/context/AppContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export default function Profile() {
  const queryClient = useQueryClient();
  const { userId, setUserId } = useApp();

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
    // Populate form values dynamically when backend data completes loading
    values: profile || undefined
  });

  const activeGender = watch("gender");
  const activeDisability = watch("disabilityStatus");

  // Save demographic preferences to Supabase backend via FastAPI
  const saveMutation = useMutation({
    mutationFn: (data) => profileService.saveProfile(data),
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
    saveMutation.mutate(data);
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
          </div>
        </div>

        {/* Right Column Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="card-soft p-6 sm:p-8 border border-slate-100 bg-white space-y-6 shadow-sm">
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
        </div>

      </div>
    </div>
  );
}
