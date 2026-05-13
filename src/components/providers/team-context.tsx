'use client'

import { createContext, useContext, ReactNode } from 'react';
import { TeamRole, AccountType } from '@/types';

export interface TeamContextValue {
    accountType: AccountType;
    activeTeamId: string | null;
    teamRole: TeamRole | null;
    isOwner: boolean;
    isManager: boolean;
    isMember: boolean;
    isTeamMember: boolean; // true if account_type === 'team_member'
}

const TeamContext = createContext<TeamContextValue>({
    accountType: 'freelancer',
    activeTeamId: null,
    teamRole: null,
    isOwner: true,
    isManager: false,
    isMember: false,
    isTeamMember: false,
});

export function TeamProvider({
    children,
    value,
}: {
    children: ReactNode;
    value: TeamContextValue;
}) {
    return (
        <TeamContext.Provider value={value}>
            {children}
        </TeamContext.Provider>
    );
}

export function useTeam() {
    return useContext(TeamContext);
}
