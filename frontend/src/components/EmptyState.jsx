import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "./ui/button";

export default function EmptyState({ icon: Icon = Inbox, title, body, action, onAction, testId = "empty-state" }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center shadow-sm" data-testid={testId}>
      <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 text-[#0b3b60] grid place-items-center mb-4 border border-slate-200">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#0b3b60] mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">{body}</p>
      {action && (
        <Button onClick={onAction} className="mt-5 rounded bg-[#0b3b60] hover:bg-[#07253d] text-white text-xs font-semibold px-4 h-9 shadow-sm" data-testid={`${testId}-action`}>
          {action}
        </Button>
      )}
    </div>
  );
}
