import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { profileService } from "@/services/profileService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Sparkles, Loader2, ArrowRight } from "lucide-react";
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
        setUserId(citizenId.trim());
        toast.success(`Welcome back, ${profile.name || "Citizen"}!`);
        nav("/");
      } else {
        toast.error("Citizen ID not found. Please create a new ID.");
      }
    } catch (err) {
      toast.error("Unable to verify ID with Supabase server. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const useDemoId = () => {
    setCitizenId(demoId);
    toast.info("Demo ID pre-filled!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" data-testid="signin-page">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blueLight/30 rounded-bl-full filter blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50/40 rounded-tr-full filter blur-3xl -z-10" />

      <div className="w-full max-w-md card-soft border border-slate-100 bg-white p-8 shadow-xl space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Logo />
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-brand-ink tracking-tight">Citizen Sign In</h1>
            <p className="text-xs text-brand-muted max-w-[280px]">
              Access your personalized dashboard using your unique JanSahay Citizen ID.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="citizen-id" className="text-xs font-bold text-brand-ink">
              JanSahay Citizen ID
            </Label>
            <Input
              id="citizen-id"
              type="text"
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value)}
              placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              data-testid="citizen-id-input"
              className="h-11 rounded-lg border bg-slate-50 focus:bg-white"
            />
          </div>

          <Button
            type="submit"
            disabled={!citizenId.trim() || isVerifying}
            data-testid="signin-submit"
            className="w-full h-11 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying ID...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Demo Assistant */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
          <p className="text-[11px] font-semibold text-brand-blue flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-pulse" /> Testing Shortcut
          </p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Click the button below to automatically load a valid test Citizen ID registered in Supabase.
          </p>
          <button
            onClick={useDemoId}
            data-testid="demo-id-btn"
            className="w-full h-9 rounded-lg border border-brand-blue/30 text-brand-blue text-xs font-bold bg-white hover:bg-brand-blueLight transition-colors"
          >
            Fill Demo Citizen ID
          </button>
        </div>

        {/* Links */}
        <div className="border-t pt-4 text-center space-y-2">
          <p className="text-xs text-brand-muted">
            First time using the portal?{" "}
            <button
              onClick={() => nav("/create-id")}
              className="text-brand-blue hover:underline font-bold"
              data-testid="go-to-register"
            >
              Create a JanSahay ID
            </button>
          </p>
          <div className="flex justify-center items-center gap-1.5 text-[10px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> Secure Government Nodal Gateway
          </div>
        </div>
      </div>
    </div>
  );
}
