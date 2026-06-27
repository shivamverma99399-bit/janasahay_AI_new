import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" data-testid="not-found-page">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-lg animate-fade-in-up">
        
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-brand-orange grid place-items-center mx-auto border border-orange-100">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-extrabold text-brand-ink">
            Page Not Found
          </h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400">
            त्रुटि 404 · पृष्ठ नहीं मिला
          </p>
          <p className="text-sm text-brand-muted leading-relaxed">
            The page you are looking for is unavailable, has been removed, or the route has been disabled under our simplified architecture rules.
          </p>
        </div>

        {/* Home Action */}
        <div className="pt-4 border-t border-slate-100">
          <Button
            onClick={() => nav("/")}
            className="w-full h-11 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <Home className="w-4 h-4" /> Back to Home Page
          </Button>
        </div>

      </div>
    </div>
  );
}
