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
        {/* No toggle button here — sidebar is always open on non-Nexus pages.
            On the Nexus page the toggle is embedded in the workspace toolbar. */}

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
