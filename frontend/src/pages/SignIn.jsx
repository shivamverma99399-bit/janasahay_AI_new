import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { profileService } from "@/services/profileService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Sparkles, Loader2, ArrowRight, Landmark, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Layout";

export default function SignIn() {
  const nav = useNavigate();
  const { setUserId } = useApp();
  const [citizenId, setCitizenId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const demoId = "ce46fbb4-db89-44e5-9363-cb5ae082802a";

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!citizenId.trim()) return;

    setIsVerifying(true);
    try {
      const profile = await profileService.getProfile(citizenId.trim());
      if (profile) {
        const targetUserId = citizenId.trim();
        
        // Migrate Guest documents checklist
        const guestDocs = localStorage.getItem("js_user_documents_guest");
        if (guestDocs) {
          localStorage.setItem(`js_user_documents_${targetUserId}`, guestDocs);
        }

        // Migrate Guest extra details
        const guestExtra = localStorage.getItem("js_profile_extra_guest");
        if (guestExtra) {
          localStorage.setItem(`js_profile_extra_${targetUserId}`, guestExtra);
        }

        // Merge Guest profile demographics with the signed-in profile
        const guestProfileStr = localStorage.getItem("js_profile_guest");
        if (guestProfileStr) {
          try {
            const guestProfile = JSON.parse(guestProfileStr);
            const mergedProfile = {
              ...guestProfile,
              ...profile,
            };
            Object.keys(mergedProfile).forEach((key) => {
              if (!profile[key] && guestProfile[key]) {
                mergedProfile[key] = guestProfile[key];
              }
            });
            await profileService.saveProfile(mergedProfile, targetUserId);
          } catch (e) {
            console.error("Failed to merge guest profile during sign-in:", e);
          }
        }

        // Clean up guest keys
        localStorage.removeItem("js_profile_guest");
        localStorage.removeItem("js_profile_extra_guest");
        localStorage.removeItem("js_guest_user_id");
        localStorage.removeItem("js_user_documents_guest");
        sessionStorage.removeItem("js_chat_conversations_guest");

        setUserId(targetUserId);
        toast.success(`Welcome back, ${profile.name || "Citizen"}!`);
        nav("/");
      } else {
        toast.error("Citizen ID not found. Please create a new ID.");
      }
    } catch (err) {
      toast.error("Unable to verify ID with central server. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const useDemoId = () => {
    setCitizenId(demoId);
    toast.info("Demo ID pre-filled!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative" data-testid="signin-page">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-md space-y-6 overflow-hidden animate-fade-in-up">
        
        {/* Tricolor Ribbon */}
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Logo />
            <div className="space-y-1">
              <span className="text-[10px] font-bold bg-blue-50 text-[#0b3b60] border border-blue-200 px-2 py-0.5 rounded">
                मेरी पहचान · National Single Sign-On Gateway
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-1">
                Citizen Portal Sign In
              </h1>
              <p className="text-xs text-slate-500 max-w-[280px]">
                Access your citizen file using your registered JanSahay Citizen Reference UID.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="citizen-id" className="text-xs font-bold text-slate-800">
                JanSahay Citizen ID / UID
              </Label>
              <Input
                id="citizen-id"
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
                placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                data-testid="citizen-id-input"
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={!citizenId.trim() || isVerifying}
              data-testid="signin-submit"
              className="w-full h-10 bg-[#0b3b60] hover:bg-[#07253d] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Citizen ID...
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span> <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Assistant */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Authorized Test Credentials
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              For testing evaluation, click below to pre-fill an active verified Citizen ID.
            </p>
            <button
              onClick={useDemoId}
              data-testid="demo-id-btn"
              className="w-full h-8 rounded-lg border border-[#0b3b60]/30 text-[#0b3b60] text-xs font-bold bg-white hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Fill Demo Citizen ID
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-slate-150 pt-4 text-center space-y-2">
            <p className="text-xs text-slate-500">
              First time user?{" "}
              <button
                onClick={() => nav("/create-id")}
                className="text-[#0b3b60] hover:underline font-bold"
                data-testid="go-to-register"
              >
                Create a JanSahay Citizen ID
              </button>
            </p>
            <div className="flex justify-center items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encrypted National Gateway
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
