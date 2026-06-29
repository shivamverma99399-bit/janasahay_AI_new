import React, { useState } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Compass, Bot, User, Search, Globe, Sparkles, Newspaper, Bell
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "./ui/dropdown-menu";
import { notificationService } from "@/services/notificationService";
import NotificationDrawer from "./NotificationDrawer";

const LANGUAGES = [
  { code: "en", label: "English", native: "EN" },
  { code: "hi", label: "हिन्दी", native: "HI" }
];

const sideNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Explore Schemes", icon: Compass },
  { to: "/eligibility", label: "Eligibility Checker", icon: Sparkles },
  { to: "/ai", label: "Saathi AI Chat", icon: Bot, badge: "AI" },
  { to: "/government-updates", label: "Govt. Updates", icon: Newspaper },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile / Preferences", icon: User },
];

const bottomNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Explore", icon: Compass },
  { to: "/ai", label: "Saathi", icon: Bot, special: true },
  { to: "/eligibility", label: "Eligibility", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Layout() {
  const { lang, setLang } = useApp();
  const nav = useNavigate();
  const location = useLocation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notificationsList"],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 10000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Placeholder generic citizen info
  const citizenName = "Indian Citizen";

  return (
    <div className="min-h-screen bg-brand-surface/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-100 flex-col z-30" data-testid="desktop-sidebar">
        <div className="px-7 py-6 flex items-center gap-3">
          <Logo />
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-6" data-testid="side-nav">
          {sideNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (item.to === "/notifications") {
                  e.preventDefault();
                  setIsNotifOpen(true);
                }
              }}
              data-testid={`nav-${item.to.replace("/", "") || "home"}`}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive && item.to !== "/notifications"
                    ? "bg-brand-blueLight text-brand-blue"
                    : "text-slate-600 hover:bg-slate-50 hover:text-brand-ink"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-brand-blue to-purple-600 text-white">
                  {item.badge}
                </span>
              )}
              {item.to === "/notifications" && unreadCount > 0 && (
                <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => nav("/profile")} data-testid="sidebar-profile">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-brand-blueLight text-brand-blue">IC</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-ink truncate">{citizenName}</p>
              <p className="text-xs text-brand-muted truncate">Manage Preferences</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Header */}
      <header className="sticky top-0 z-20 glass-nav border-b border-slate-100 lg:pl-72" data-testid="top-header">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="lg:hidden"><Logo compact /></div>

          <div className="hidden sm:flex flex-1 max-w-xl mx-auto">
            <button
              onClick={() => nav("/search")}
              data-testid="header-search-button"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-left"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-500">Search schemes, ministries, eligibility…</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="lang-switcher" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-brand-ink hover:bg-slate-100 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span>{LANGUAGES.find(l => l.code === lang)?.native || "EN"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Choose Language / भाषा चुनें</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={lang} onValueChange={setLang}>
                  {LANGUAGES.map(l => (
                    <DropdownMenuRadioItem key={l.code} value={l.code} data-testid={`lang-${l.code}`}>
                      <span className="font-medium">{l.native}</span>
                      <span className="ml-auto text-xs text-slate-400">{l.label}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setIsNotifOpen(true)}
              data-testid="header-notifications"
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-5 h-5 text-brand-ink" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-rose-600 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="header-avatar" className="rounded-full focus:outline-none">
                  <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-brand-blueLight text-brand-blue">IC</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-semibold text-brand-ink">{citizenName}</p>
                    <p className="text-xs text-brand-muted">Guest User</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav("/profile")} data-testid="menu-profile"><User className="w-4 h-4 mr-2" />Profile Preferences</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="lg:pl-72 pb-24 lg:pb-12" data-testid="main-content">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-nav border-t border-slate-100" data-testid="bottom-nav">
        <div className="grid grid-cols-5 items-end h-[72px] pb-2 px-2">
          {bottomNav.map((item) => {
            const active = item.to === "/" 
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            if (item.special) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-testid={`bnav-${item.to.replace("/", "") || "home"}`}
                  className="flex flex-col items-center gap-1 -mt-6"
                >
                  <span className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-blue to-purple-600 text-white grid place-items-center shadow-lg shadow-brand-blue/30">
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-[10px] font-semibold text-brand-blue">{item.label}</span>
                </NavLink>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={`bnav-${item.to.replace("/", "") || "home"}`}
                className="flex flex-col items-center gap-1 py-2"
              >
                <Icon className={`w-5 h-5 ${active ? "text-brand-blue" : "text-slate-400"}`} />
                <span className={`text-[10px] font-medium ${active ? "text-brand-blue" : "text-slate-500"}`}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Global Notifications Drawer Overlay */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
}

export function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5" data-testid="logo">
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-blue-700 grid place-items-center shadow-sm">
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-orange" />
        <span className="font-display text-white font-bold text-lg leading-none">जन</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display font-bold text-brand-ink tracking-tight">JanSahay</p>
          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-semibold">Govt. of India Service</p>
        </div>
      )}
    </div>
  );
}
