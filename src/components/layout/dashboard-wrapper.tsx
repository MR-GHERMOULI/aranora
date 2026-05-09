'use client';

import React from 'react';
import { useSidebar } from "@/components/providers/sidebar-context";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { ReadOnlyBanner } from "@/components/billing/read-only-banner";
import { SubscriptionNotifier } from "@/components/subscriptions/subscription-notifier";
import { TimerBar } from "@/components/time-tracking/timer-bar";
import { AccessLogger } from "@/components/security/access-logger";
import { Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

interface DashboardWrapperProps {
  children: React.ReactNode;
  upcomingRenewals: any;
}

export function DashboardWrapper({ children, upcomingRenewals }: DashboardWrapperProps) {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, toggleSidebar } = useSidebar();
  const [mounted, setMounted] = React.useState(false);
  const isNexus = pathname.includes('/nexus');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // When leaving Nexus, always re-expand the sidebar
  React.useEffect(() => {
    if (!isNexus) {
      setIsCollapsed(false);
    }
  }, [isNexus, setIsCollapsed]);

  // Sidebar is collapsible ONLY on Nexus; elsewhere it is always expanded
  const sidebarHidden = mounted && isNexus && isCollapsed;

  return (
    <div className="h-full relative flex overflow-hidden bg-gray-50 w-full">
      {/* Sidebar Container */}
      <div 
        className={cn(
          "hidden h-full md:flex md:flex-col transition-all duration-300 ease-in-out z-40",
          sidebarHidden ? "w-0 overflow-hidden opacity-0" : "w-72 opacity-100"
        )}
      >
        <Sidebar className="w-72 shrink-0" />
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Toggle Button - only on non-Nexus pages (Nexus has it integrated in its toolbar) */}
        {!isNexus && (
          <div className="absolute top-6 left-6 z-[100]">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="bg-white/90 backdrop-blur-md shadow-xl border-gray-200 hover:bg-white hover:scale-110 transition-all rounded-2xl"
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <ReadOnlyBanner />
          {children}
        </div>
      </main>

      <SubscriptionNotifier renewingSubs={upcomingRenewals} />
      <TimerBar />
      <AccessLogger />
    </div>
  );
}
