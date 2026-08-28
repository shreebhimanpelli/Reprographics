"use client";

import { BrandMark } from "@/components/brand-mark";
import {
  RoleBanner,
  canSeeAdmin,
  canSeeAnalytics,
  canSeeQueue,
} from "@/components/rolebanner";
import { cn } from "@/lib/cn";
import type { TabId, User } from "@/types";
import {
  BarChart3,
  ChevronDown,
  Clock,
  FileText,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  QrCode,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  currentUser: User | null;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenGoogleSSO: () => void;
  onOpenQRCode: () => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onResetData?: () => void;
  onLogout?: () => void;
}

const tabs: {
  id: TabId;
  label: string;
  icon: typeof FileText;
  show: (user: User | null) => boolean;
}[] = [
  { id: "submit", label: "Submit Job", icon: FileText, show: () => true },
  { id: "my-jobs", label: "My History", icon: Clock, show: () => true },
  {
    id: "queue",
    label: "Repro Queue",
    icon: LayoutGrid,
    show: (user) => canSeeQueue(user?.role),
  },
  {
    id: "admin",
    label: "User DB & Admin",
    icon: Shield,
    show: (user) => canSeeAdmin(user?.role),
  },
  {
    id: "analytics",
    label: "MIS Telemetry",
    icon: BarChart3,
    show: (user) => canSeeAnalytics(user?.role),
  },
];

export function Navbar({
  currentUser,
  onOpenGoogleSSO,
  onOpenQRCode,
  activeTab,
  setActiveTab,
  onLogout,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const visibleTabs = tabs.filter((tab) => tab.show(currentUser));

  const navButton = (tab: (typeof tabs)[number], onPick?: () => void) => {
    const Icon = tab.icon;
    const active = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => {
          setActiveTab(tab.id);
          onPick?.();
        }}
        className={cn(
          "flex items-center gap-2 min-h-11 px-3.5 rounded-xl text-xs font-bold transition-all",
          active
            ? "bg-flame-orange text-white shadow-sm"
            : "text-flame-muted hover:text-flame-ink hover:bg-flame-paper",
        )}
      >
        <Icon className="w-4 h-4" />
        {tab.label}
        {tab.id === "queue" && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-flame-blue/10 bg-flame-paper/95 backdrop-blur-xl shadow-sm">
      <div className="max-w-page mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16 gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-flame-blue"
              onClick={() => setSheetOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <BrandMark compact />
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-flame-ivory border border-flame-blue/10 p-1.5 rounded-2xl">
            {visibleTabs.map((tab) => navButton(tab))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenQRCode}
              className="flex items-center gap-1.5 min-h-11 bg-flame-ivory hover:bg-flame-gold/20 text-flame-blue border border-flame-blue/15 px-3 rounded-xl text-xs font-bold transition-all"
              title="Generate & View Scan QR Code for Mobile Access"
            >
              <QrCode className="w-4 h-4 text-flame-orange" />
              <span className="hidden sm:inline">Portal QR</span>
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 min-h-11 p-1.5 rounded-xl bg-flame-ivory hover:bg-flame-gold/15 border border-flame-blue/10 text-left"
                >
                  <img
                    src={
                      currentUser.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`
                    }
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-flame-gold/40"
                  />
                  <div className="hidden lg:block">
                    <div className="text-xs font-bold text-flame-ink leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-flame-muted truncate max-w-[120px]">
                      {currentUser.email}
                    </div>
                  </div>
                  <span className="hidden sm:inline">
                    <RoleBanner role={currentUser.role} />
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-flame-muted ml-1" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-flame-paper border border-flame-blue/10 rounded-2xl shadow-module-lg p-2 z-50">
                    <div className="px-3 py-2 border-b border-flame-blue/10 mb-1">
                      <p className="text-[11px] font-medium text-flame-muted">
                        Signed in as
                      </p>
                      <p className="text-xs font-bold text-flame-ink truncate">
                        {currentUser.email}
                      </p>
                      <div className="mt-1">
                        <RoleBanner role={currentUser.role} />
                      </div>
                    </div>
                    <div className="pt-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenGoogleSSO();
                        }}
                        className="w-full text-left min-h-11 px-3 rounded-xl hover:bg-flame-ivory text-flame-ink text-xs flex items-center gap-2 font-bold"
                      >
                        <LogIn className="w-3.5 h-3.5 text-flame-blue" />
                        Switch Google Account
                      </button>
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left min-h-11 px-3 rounded-xl hover:bg-rose-50 text-rose-600 text-xs flex items-center gap-2 font-bold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenGoogleSSO}
                className="flex items-center gap-2 min-h-11 bg-flame-blue hover:bg-flame-blue-deep text-white text-xs font-bold px-4 rounded-xl"
              >
                <LogIn className="w-4 h-4" />
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Google SSO Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-flame-ink/40"
            onClick={() => setSheetOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-sm bg-flame-paper shadow-module-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <BrandMark compact />
              <button
                type="button"
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl"
                onClick={() => setSheetOpen(false)}
              >
                <X className="w-5 h-5 text-flame-muted" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {visibleTabs.map((tab) => navButton(tab, () => setSheetOpen(false)))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
