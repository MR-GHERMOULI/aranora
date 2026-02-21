import { Sidebar } from "@/components/layout/sidebar";
import { getUpcomingRenewals } from "./subscriptions/actions";
import { SubscriptionNotifier } from "@/components/subscriptions/subscription-notifier";
import { TimeTrackerProvider } from "@/components/time-tracking/time-tracker-provider";
import { TimerBar } from "@/components/time-tracking/timer-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const upcomingRenewals = await getUpcomingRenewals();

  return (
    <TimeTrackerProvider>
      <div className="h-full relative">
        <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-40 bg-gray-900">
          <Sidebar />
        </div>
        <main className="md:pl-72 pb-10">
          {children}
        </main>
        <SubscriptionNotifier renewingSubs={upcomingRenewals} />
        <TimerBar />
      </div>
    </TimeTrackerProvider>
  );
}
