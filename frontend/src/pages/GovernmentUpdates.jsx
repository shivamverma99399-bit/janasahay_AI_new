import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ShieldAlert, ArrowRight, Loader2, Newspaper } from "lucide-react";
import { schemeService } from "@/services/schemeService";

const FALLBACK_NEWS_IMAGE = "https://images.unsplash.com/photo-1639416070357-6dc10225abec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW5kaWF8ZW58MHx8fHwxNzgyNTI4MTI4fDA&ixlib=rb-4.1.0&q=85";

export default function GovernmentUpdates() {
  // Fetch updates dynamically from backend api
  const { data: updates = [], isLoading, isError } = useQuery({
    queryKey: ["governmentUpdates"],
    queryFn: () => schemeService.getGovernmentUpdates()
  });

  return (
    <div className="space-y-8 animate-fade-in-up" data-testid="government-updates-page">
      
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-brand-blue">Newsroom</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mt-1">Government Updates</h1>
        <p className="text-brand-muted mt-2">Latest press releases, scheme amendments, and digital service launches.</p>
      </div>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
          <p className="text-sm text-brand-muted">Fetching latest announcements...</p>
        </div>
      )}

      {isError && (
        <div className="py-16 text-center card-soft border border-rose-100 bg-rose-50/20 max-w-xl mx-auto space-y-3">
          <p className="text-sm font-semibold text-rose-700">Failed to load announcements</p>
          <p className="text-xs text-brand-muted">Verify if the FastAPI `/api/updates` endpoint is correctly configured.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {updates.length === 0 ? (
            <div className="card-soft p-12 text-center border border-dashed max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
                <Newspaper className="w-6 h-6" />
              </div>
              <p className="text-sm text-brand-muted">No new announcements posted at this time.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {updates.map((update) => (
                <div
                  key={update.id}
                  data-testid={`update-card-${update.id}`}
                  className="card-soft card-soft-hover overflow-hidden border border-slate-100 bg-white flex flex-col sm:flex-row h-full group cursor-pointer"
                >
                  {/* News Image */}
                  <div className="sm:w-40 h-40 sm:h-auto relative overflow-hidden flex-shrink-0 bg-slate-150">
                    <img
                      src={update.image || FALLBACK_NEWS_IMAGE}
                      alt={update.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col justify-between flex-1 min-w-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-brand-muted font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{update.date || "Just now"}</span>
                        {update.source && (
                          <>
                            <span>·</span>
                            <span className="text-brand-blue uppercase">{update.source}</span>
                          </>
                        )}
                      </div>
                      
                      <h3 className="font-display font-bold text-brand-ink text-sm sm:text-base leading-snug group-hover:text-brand-blue transition-colors line-clamp-2">
                        {update.title}
                      </h3>
                      
                      <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">
                        {update.summary}
                      </p>
                    </div>

                    {update.link && (
                      <a
                        href={update.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand-blue hover:text-brand-blueDark flex items-center gap-1 mt-3"
                      >
                        Read Press Release <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
