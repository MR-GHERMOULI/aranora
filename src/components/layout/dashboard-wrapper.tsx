'use client';

import { useSidebar } from "@/components/providers/sidebar-context";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { ReadOnlyBanner } from "@/components/billing/read-only-banner";
import { SubscriptionNotifier } from "@/components/subscriptions/subscription-notifier";
import { TimerBar } from "@/components/time-tracking/timer-bar";
import { AccessLogger } from "@/components/security/access-logger";
import { Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardWrapperProps {
  children: React.ReactNode;
  upcomingRenewals: any;
}

export function DashboardWrapper({ children, upcomingRenewals }: DashboardWrapperProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="h-full relative flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div 
        className={cn(
          "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-40 bg-gray-900 transition-all duration-300 ease-in-out shadow-2xl",
          isCollapsed ? "md:w-0 -translate-x-full" : "md:w-72 translate-x-0"
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 h-full overflow-hidden transition-all duration-300 ease-in-out relative",
          isCollapsed ? "md:pl-0" : "md:pl-72"
        )}
      >
        {/* Toggle Button */}
        <div className="absolute top-6 left-6 z-[100]">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="bg-white/80 backdrop-blur-md shadow-lg border-gray-200 hover:bg-white hover:scale-110 transition-all rounded-xl"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className="h-full overflow-auto">
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
