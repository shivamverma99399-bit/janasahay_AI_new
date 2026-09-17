import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Home, Search, HelpCircle, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between" data-testid="not-found-page">
      {/* Top Tricolor Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* Official Header Strip */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#0b3b60] bg-white flex items-center justify-center p-1 shadow-sm">
              <span className="text-[#0b3b60] font-black text-xs">GOI</span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-800 tracking-wide">भारत सरकार | Government of India</div>
              <div className="text-[10px] text-slate-500">JanSahay National Portal Services · जनसहाय</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            HTTP 404 · GIGW 3.0
          </span>
        </div>
      </header>

      {/* Main Error Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-lg border-2 border-slate-200 p-8 text-center space-y-6 shadow-md">
          
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border-2 border-amber-200 grid place-items-center mx-auto shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider">
              त्रुटि 404 · पृष्ठ अनुपलब्ध
            </div>
            <h1 className="text-2xl font-bold text-[#0b3b60]">
              Page Not Found / पृष्ठ नहीं मिला
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              The requested official URL does not exist or has been relocated within the JanSahay National Welfare directory.
            </p>
          </div>

          <div className="bg-slate-50 rounded-md border border-slate-200 p-3 text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#0b3b60]" /> Suggested Actions:
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
              <li>Verify the web address for typing errors</li>
              <li>Browse the centralized National Schemes Directory</li>
              <li>Consult the Saathi AI Citizen Assistant</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 border-t border-slate-200">
            <Button
              onClick={() => nav("/")}
              className="w-full sm:w-auto h-10 bg-[#0b3b60] hover:bg-[#07253d] text-white font-medium text-xs rounded px-4 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Home className="w-4 h-4" /> National Portal Home
            </Button>
            <Button
              onClick={() => nav("/search")}
              variant="outline"
              className="w-full sm:w-auto h-10 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded px-4 flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" /> Search Directory
            </Button>
          </div>

        </div>
      </main>

      {/* Official Sub-footer */}
      <footer className="bg-[#0b3b60] text-slate-200 text-[11px] py-3 px-4 text-center border-t border-slate-700">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© JanSahay · Ministry of Electronics & IT / National Informatics Centre</span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <PhoneCall className="w-3 h-3 text-amber-400" /> National Helpline: 1800-11-0031 / 1915
          </span>
        </div>
      </footer>
    </div>
  );
}
