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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar — always pinned to the left, full viewport height */}
      <div 
        className={cn(
          "hidden md:flex md:flex-col fixed inset-y-0 left-0 transition-all duration-300 ease-in-out z-40",
          sidebarHidden ? "w-0 overflow-hidden opacity-0" : "w-72 opacity-100"
        )}
      >
        <Sidebar className="w-72 h-full" />
      </div>

      {/* Main Content — offset by sidebar width, scrolls independently */}
      <main className={cn(
        "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        sidebarHidden ? "md:ml-0" : "md:ml-72"
      )}>
        <div className="flex-1">
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
