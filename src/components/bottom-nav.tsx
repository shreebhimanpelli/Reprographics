"use client";

import {
  canSeeAdmin,
  canSeeAnalytics,
  canSeeQueue,
} from "@/components/rolebanner";
import { cn } from "@/lib/cn";
import type { TabId, User } from "@/types";
import {
  BarChart3,
  Clock,
  FileText,
  LayoutGrid,
  Shield,
} from "lucide-react";

export function BottomNav({
  currentUser,
  activeTab,
  setActiveTab,
}: {
  currentUser: User | null;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}) {
  const items = [
    { id: "submit" as TabId, label: "Submit", icon: FileText, show: true },
    { id: "my-jobs" as TabId, label: "History", icon: Clock, show: true },
    {
      id: "queue" as TabId,
      label: "Queue",
      icon: LayoutGrid,
      show: canSeeQueue(currentUser?.role),
    },
    {
      id: "admin" as TabId,
      label: "Admin",
      icon: Shield,
      show: canSeeAdmin(currentUser?.role),
    },
    {
      id: "analytics" as TabId,
      label: "MIS",
      icon: BarChart3,
      show: canSeeAnalytics(currentUser?.role),
    },
  ].filter((item) => item.show);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-flame-blue/10 bg-flame-paper/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-h-14 text-[10px] font-bold",
                active ? "text-flame-orange" : "text-flame-muted",
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
