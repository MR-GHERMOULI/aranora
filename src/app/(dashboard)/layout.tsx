import { getUpcomingRenewals } from "./subscriptions/actions";
import { TimeTrackerProvider } from "@/components/time-tracking/time-tracker-provider";
import { SubscriptionStatusProvider } from "@/components/providers/subscription-context";
import { SidebarProvider } from "@/components/providers/sidebar-context";
import { TeamProvider, TeamContextValue } from "@/components/providers/team-context";
import { PresenceProvider } from "@/components/providers/presence-provider";
import { getUserBillingInfo } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import { AccountType, TeamRole } from "@/types";

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

  // Fetch team context
  let teamContextValue: TeamContextValue = {
    accountType: 'freelancer',
    activeTeamId: null,
    teamRole: null,
    isOwner: true,
    isManager: false,
    isMember: false,
    isTeamMember: false,
  };

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type, active_team_id')
      .eq('id', user.id)
      .single();

    const accountType = (profile?.account_type || 'freelancer') as AccountType;
    const activeTeamId = profile?.active_team_id || null;

    let teamRole: TeamRole | null = null;

    if (activeTeamId) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', activeTeamId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      teamRole = (membership?.role as TeamRole) || null;
    }

    // If no active team but user is a freelancer, check if they own a team
    if (!teamRole && accountType === 'freelancer') {
      const { data: ownerMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

      teamRole = (ownerMembership?.role as TeamRole) || null;
    }

    teamContextValue = {
      accountType,
      activeTeamId,
      teamRole,
      isOwner: accountType === 'freelancer' || teamRole === 'owner',
      isManager: teamRole === 'manager',
      isMember: teamRole === 'member',
      isTeamMember: accountType === 'team_member',
    };
  }

  return (
    <SidebarProvider>
      <TimeTrackerProvider>
        <SubscriptionStatusProvider value={subscriptionValue}>
          <TeamProvider value={teamContextValue}>
            <PresenceProvider userId={user?.id}>
              <DashboardWrapper upcomingRenewals={upcomingRenewals}>
                {children}
              </DashboardWrapper>
            </PresenceProvider>
          </TeamProvider>
        </SubscriptionStatusProvider>
      </TimeTrackerProvider>
    </SidebarProvider>
  );
}
