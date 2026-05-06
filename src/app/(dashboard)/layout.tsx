import { getUpcomingRenewals } from "./subscriptions/actions";
import { TimeTrackerProvider } from "@/components/time-tracking/time-tracker-provider";
import { SubscriptionStatusProvider } from "@/components/providers/subscription-context";
import { SidebarProvider } from "@/components/providers/sidebar-context";
import { getUserBillingInfo } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [upcomingRenewals, billingInfo] = await Promise.all([
    getUpcomingRenewals(),
    user ? getUserBillingInfo(user.id) : null,
  ]);

  const subscriptionValue = {
    isReadOnly: billingInfo ? !billingInfo.isActive : false,
    subscriptionStatus: billingInfo?.status || 'active',
    trialDaysRemaining: billingInfo?.trialDaysRemaining || 0,
    planType: billingInfo?.planType || null,
    currentPeriodEnd: billingInfo?.currentPeriodEnd || null,
    trialEndsAt: billingInfo?.trialEndsAt || null,
  };

  return (
    <SidebarProvider>
      <TimeTrackerProvider>
        <SubscriptionStatusProvider value={subscriptionValue}>
          <DashboardWrapper upcomingRenewals={upcomingRenewals}>
            {children}
          </DashboardWrapper>
        </SubscriptionStatusProvider>
      </TimeTrackerProvider>
    </SidebarProvider>
  );
}
