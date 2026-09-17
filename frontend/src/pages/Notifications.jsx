import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Calendar, Info, ShieldCheck, Loader2, CheckCircle2,
  MessageSquare, AlertTriangle, Landmark, ChevronRight
} from "lucide-react";
import { profileService } from "@/services/profileService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Notifications() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch notifications list dynamically
  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ["notificationsAlerts"],
    queryFn: async () => {
      try {
        return await profileService.getNotifications();
      } catch (err) {
        return [];
      }
    }
  });

  // Mark notification as read mutation
  const readMutation = useMutation({
    mutationFn: (id) => profileService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationsAlerts"] });
    },
    onError: () => {
      toast.error("Failed to update notification status.");
    }
  });

  const handleMarkAsRead = (id, read) => {
    if (!read) {
      readMutation.mutate(id);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    return n.category === activeTab;
  });

  const getIcon = (category) => {
    switch (category) {
      case "status":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "updates":
        return <Info className="w-4 h-4 text-[#0b3b60]" />;
      case "deadlines":
        return <Calendar className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up" data-testid="notifications-page">
      
      {/* Official Government Header */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="w-full h-1.5 flex border-b border-slate-200">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-slate-100" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        <div className="p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
            <span className="text-slate-900">भारत सरकार</span>
            <span className="text-slate-300">|</span>
            <span className="uppercase text-slate-700">Government of India</span>
            <span className="bg-blue-50 text-[#0b3b60] border border-blue-200 px-2 py-0.5 rounded text-[10px]">
              नागरिक सूचना पोर्टल
            </span>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Citizen Alerts & Notifications
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              डीबीटी संवितरण, आवेदन स्थिति एवं योजना समय-सीमा
            </p>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
              Official notifications on verified schemes, DBT cash transfer announcements, application deadlines, and ministry advisories.
            </p>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0b3b60] animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking central notification service...</p>
        </div>
      )}

      {isError && (
        <div className="py-16 text-center bg-white border border-rose-200 rounded-xl p-6 max-w-md mx-auto space-y-2">
          <p className="text-xs font-bold text-rose-700">Unable to retrieve alerts feed</p>
          <p className="text-[11px] text-slate-500">Central notification server unreachable.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200 grid grid-cols-4 w-full sm:w-fit">
              <TabsTrigger value="all" className="rounded-md py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#0b3b60] data-[state=active]:shadow-xs">All Alerts</TabsTrigger>
              <TabsTrigger value="status" className="rounded-md py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#0b3b60] data-[state=active]:shadow-xs">Status</TabsTrigger>
              <TabsTrigger value="updates" className="rounded-md py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#0b3b60] data-[state=active]:shadow-xs">Gazette</TabsTrigger>
              <TabsTrigger value="deadlines" className="rounded-md py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#0b3b60] data-[state=active]:shadow-xs">Deadlines</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 focus:outline-none">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-white space-y-2.5">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 grid place-items-center mx-auto border border-slate-200">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-sm">No notifications in this category</h3>
                  <p className="text-xs text-slate-500">All citizen advisories and scheme updates have been acknowledged.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.is_read)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        n.is_read 
                          ? "bg-white border-slate-200 text-slate-700" 
                          : "bg-blue-50/40 border-blue-200 text-slate-900 shadow-xs"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 grid place-items-center flex-shrink-0 mt-0.5">
                        {getIcon(n.category)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {n.title}
                          </h4>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" title="Unread" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {n.created_at ? new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent Advisory"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

    </div>
  );
}
