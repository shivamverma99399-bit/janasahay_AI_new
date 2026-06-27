import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, Info, ShieldCheck, Loader2, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react";
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
      toast.error("Failed to mark alert as read.");
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
        return <CheckCircle2 className="w-5 h-5 text-brand-green" />;
      case "updates":
        return <Info className="w-5 h-5 text-brand-blue" />;
      case "deadlines":
        return <Calendar className="w-5 h-5 text-brand-orange" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up" data-testid="notifications-page">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-brand-blue">Alerts Portal</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight mt-1">Notifications</h1>
          <p className="text-brand-muted mt-2">Personalized alerts on matching scheme progress, deadlines, and news updates.</p>
        </div>
      </div>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
          <p className="text-sm text-brand-muted">Loading notifications dashboard...</p>
        </div>
      )}

      {isError && (
        <div className="py-16 text-center card-soft border border-rose-100 bg-rose-50/20 max-w-md mx-auto">
          <p className="text-sm font-semibold text-rose-700">Unable to retrieve notification feeds</p>
          <p className="text-xs text-brand-muted mt-2">FastAPI backend notifications node currently offline.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-6">
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl grid grid-cols-4 w-full md:w-fit">
              <TabsTrigger value="all" className="rounded-lg py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">All Alerts</TabsTrigger>
              <TabsTrigger value="status" className="rounded-lg py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Status</TabsTrigger>
              <TabsTrigger value="updates" className="rounded-lg py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Updates</TabsTrigger>
              <TabsTrigger value="deadlines" className="rounded-lg py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Deadlines</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 focus:outline-none">
              {filteredNotifications.length === 0 ? (
                <div className="card-soft p-12 text-center border border-dashed border-slate-200 bg-white space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 grid place-items-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-brand-muted">No notifications under "{activeTab}" filter.</p>
                </div>
              ) : (
                <div className="card-soft divide-y divide-slate-100 border border-slate-100 bg-white shadow-sm">
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      data-testid={`notif-item-${notif.id}`}
                      onClick={() => handleMarkAsRead(notif.id, notif.read)}
                      className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                        notif.read ? "bg-white hover:bg-slate-50" : "bg-blue-50/20 hover:bg-blue-50/30"
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-white border grid place-items-center flex-shrink-0 shadow-sm">
                        {getIcon(notif.category)}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className={`font-display text-sm tracking-tight ${notif.read ? "font-medium text-brand-ink" : "font-bold text-brand-ink"}`}>
                            {notif.title}
                          </h3>
                          {!notif.read && (
                            <span className="w-2.5 h-2.5 bg-brand-orange rounded-full flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {notif.timestamp || "Just now"}
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
