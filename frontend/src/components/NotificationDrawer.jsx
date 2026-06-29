import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Bell,
  Trash2,
  Clock,
  Sparkles,
  Newspaper,
  GraduationCap,
  Sprout,
  Home,
  Heart,
  Bot,
  Info,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { notificationService } from "@/services/notificationService";

const FILTER_ITEMS = [
  { id: "All", label: "All" },
  { id: "Unread", label: "Unread" },
  { id: "Updates", label: "Updates" },
  { id: "Deadlines", label: "Deadlines" },
  { id: "Recommendations", label: "Recommendations" },
];

const THEMES = {
  "New Scheme": {
    icon: Sparkles,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  "Government Update": {
    icon: Newspaper,
    color: "text-blue-600 bg-blue-50 border-blue-100",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  "Application Deadline": {
    icon: Clock,
    color: "text-rose-600 bg-rose-50 border-rose-100",
    badge: "bg-rose-105 text-rose-800 border-rose-200",
  },
  "Scholarship": {
    icon: GraduationCap,
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  "Farmer Scheme": {
    icon: Sprout,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  "Housing Scheme": {
    icon: Home,
    color: "text-orange-600 bg-orange-50 border-orange-100",
    badge: "bg-orange-100 text-orange-850 border-orange-205",
  },
  "Health Scheme": {
    icon: Heart,
    color: "text-red-600 bg-red-50 border-red-100",
    badge: "bg-red-100 text-red-800 border-red-200",
  },
  "AI Recommendation": {
    icon: Bot,
    color: "text-purple-600 bg-purple-50 border-purple-100",
    badge: "bg-purple-105 text-purple-800 border-purple-200",
  },
  "System Announcement": {
    icon: Info,
    color: "text-slate-600 bg-slate-50 border-slate-100",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
  },
};

const PRIORITY_COLORS = {
  High: "bg-rose-50 text-rose-700 border-rose-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-slate-50 text-slate-600 border-slate-100",
};

export default function NotificationDrawer({ isOpen, onClose }) {
  const qc = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["notificationsList"],
    queryFn: () => notificationService.getNotifications(),
    enabled: isOpen,
  });

  // MUTATIONS
  const readMut = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries(["notificationsList"]),
  });

  const readAllMut = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries(["notificationsList"]),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () => qc.invalidateQueries(["notificationsList"]),
  });

  const clearAllMut = useMutation({
    mutationFn: () => notificationService.clearAll(),
    onSuccess: () => qc.invalidateQueries(["notificationsList"]),
  });

  if (!isOpen) return null;

  // Filter Selection
  const filteredList = notifications.filter((n) => {
    if (activeFilter === "Unread") return !n.is_read;
    if (activeFilter === "Updates") return n.type === "Government Update";
    if (activeFilter === "Deadlines") return n.type === "Application Deadline";
    if (activeFilter === "Recommendations") return n.type === "AI Recommendation";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="notification-overlay">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer content panel */}
      <div className="relative w-full sm:w-112 max-w-md h-full bg-slate-50 flex flex-col shadow-2xl animate-slide-in-right z-50 border-l border-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-150 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-blue" />
            <h2 className="font-display font-bold text-brand-ink text-base sm:text-lg">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global actions row */}
        {notifications.length > 0 && (
          <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex justify-between items-center flex-shrink-0">
            <button
              onClick={() => readAllMut.mutate()}
              disabled={readAllMut.isPending}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-blue hover:text-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All as Read
            </button>
            <button
              onClick={() => clearAllMut.mutate()}
              disabled={clearAllMut.isPending}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-rose-600 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        )}

        {/* Filter Category Chips row */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto flex-shrink-0 no-scrollbar">
          {FILTER_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase border transition-all flex-shrink-0 cursor-pointer ${
                activeFilter === item.id
                  ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Core List View */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Skeleton Loaders */}
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-3 h-24">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="py-12 text-center bg-white border border-rose-100 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Failed to load notifications</p>
                <p className="text-[10px] text-brand-muted mt-0.5">Please check network or restart backend.</p>
              </div>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-brand-blue hover:bg-blue-750 text-white text-[10px] font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Content Loaded */}
          {!isLoading && !isError && (
            <>
              {filteredList.length === 0 ? (
                /* Empty state */
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 grid place-items-center shadow-inner">
                    <Bell className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-ink text-sm sm:text-base">No notifications yet.</h3>
                    <p className="text-[11px] text-brand-muted mt-1">Updates on scheme deadlines and releases appear here.</p>
                  </div>
                </div>
              ) : (
                /* List grid */
                <div className="space-y-3.5">
                  {filteredList.map((notif) => {
                    const theme = THEMES[notif.type] || THEMES["System Announcement"];
                    const IconComp = theme.icon;
                    const priorityColor = PRIORITY_COLORS[notif.priority] || PRIORITY_COLORS.Low;

                    return (
                      <div
                        key={notif.id}
                        data-testid={`notification-card-${notif.id}`}
                        className={`bg-white border rounded-2xl p-4 flex gap-3 relative transition-all hover:shadow-md border-slate-100 group ${
                          !notif.is_read ? "ring-1 ring-brand-blue/10 bg-blue-50/5 shadow-sm" : ""
                        }`}
                      >
                        {/* Unread dot indicator */}
                        {!notif.is_read && (
                          <div className="absolute right-3.5 top-3.5 w-2 h-2 rounded-full bg-brand-blue" />
                        )}

                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl border flex-shrink-0 flex items-center justify-center ${theme.color}`}>
                          <IconComp className="w-4.5 h-4.5" />
                        </div>

                        {/* Text Block */}
                        <div className="flex-1 space-y-1.5 min-w-0 pr-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {notif.created_at}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${priorityColor}`}>
                              {notif.priority}
                            </span>
                          </div>
                          
                          <h4 className="font-display font-bold text-brand-ink text-xs sm:text-sm leading-tight">
                            {notif.title}
                          </h4>
                          
                          <p className="text-[11px] text-brand-muted leading-relaxed break-words">
                            {notif.description}
                          </p>

                          <div className="flex items-center gap-3 pt-2">
                            {/* Read trigger */}
                            {!notif.is_read && (
                              <button
                                onClick={() => readMut.mutate(notif.id)}
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-blue hover:text-blue-800 transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Mark Read
                              </button>
                            )}
                            
                            {/* Delete trigger */}
                            <button
                              onClick={() => deleteMut.mutate(notif.id)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
