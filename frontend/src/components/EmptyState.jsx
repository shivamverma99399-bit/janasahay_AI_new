import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "./ui/button";

export default function EmptyState({ icon: Icon = Inbox, title, body, action, onAction, testId = "empty-state" }) {
  return (
    <div className="card-soft p-10 sm:p-14 text-center" data-testid={testId}>
      <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-blueLight text-brand-blue grid place-items-center mb-5">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display text-xl font-semibold text-brand-ink mb-2">{title}</h3>
      <p className="text-sm text-brand-muted max-w-md mx-auto leading-relaxed">{body}</p>
      {action && (
        <Button onClick={onAction} className="mt-6 rounded-xl bg-brand-blue hover:bg-brand-blueDark text-white" data-testid={`${testId}-action`}>
          {action}
        </Button>
      )}
    </div>
  );
}
