import { Sidebar } from "@/components/layout/sidebar";
import { getUpcomingRenewals } from "./subscriptions/actions";
import { SubscriptionNotifier } from "@/components/subscriptions/subscription-notifier";
import { TimeTrackerProvider } from "@/components/time-tracking/time-tracker-provider";
import { TimerBar } from "@/components/time-tracking/timer-bar";
import { SubscriptionStatusProvider } from "@/components/providers/subscription-context";
import { ReadOnlyBanner } from "@/components/billing/read-only-banner";
import { getUserBillingInfo } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch billing info and upcoming renewals in parallel
  const [upcomingRenewals, billingInfo] = await Promise.all([
    getUpcomingRenewals(),
    user ? getUserBillingInfo(user.id) : null,
  ]);

  // Determine read-only status for the subscription context
  const subscriptionValue = {
    isReadOnly: billingInfo ? !billingInfo.isActive : false,
    subscriptionStatus: billingInfo?.status || 'active',
    trialDaysRemaining: billingInfo?.trialDaysRemaining || 0,
  };

  return (
    <TimeTrackerProvider>
      <SubscriptionStatusProvider value={subscriptionValue}>
        <div className="h-full relative">
          <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-40 bg-gray-900">
            <Sidebar />
          </div>
          <main className="md:pl-72 pb-10">
            <ReadOnlyBanner />
            {children}
          </main>
          <SubscriptionNotifier renewingSubs={upcomingRenewals} />
          <TimerBar />
        </div>
      </SubscriptionStatusProvider>
    </TimeTrackerProvider>
  );
}
