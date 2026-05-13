'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTeam } from './team-context';

export interface PresenceState {
    [userId: string]: {
        online_at: string;
        user_id: string;
        team_id: string | null;
        [key: string]: any;
    };
}

interface PresenceContextValue {
    onlineUsers: PresenceState;
    isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue>({
    onlineUsers: {},
    isOnline: () => false,
});

export function PresenceProvider({ children, userId }: { children: ReactNode; userId: string | undefined }) {
    const [onlineUsers, setOnlineUsers] = useState<PresenceState>({});
    const { activeTeamId } = useTeam();
    const supabase = createClient();

    useEffect(() => {
        if (!userId) return;

        // Create a channel specifically for the current team, or a global workspace fallback
        const channelName = activeTeamId ? `team:${activeTeamId}:presence` : `workspace:${userId}:presence`;
        const presenceChannel = supabase.channel(channelName);

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const flattenedState: PresenceState = {};
                
                // Supabase presence state comes as an object where values are arrays of presence objects for each key (user_id)
                Object.keys(newState).forEach((key) => {
                    const presences = newState[key];
                    if (presences && presences.length > 0) {
                        flattenedState[key] = presences[0] as any;
                    }
                });
                
                setOnlineUsers(flattenedState);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                setOnlineUsers((prev) => ({
                    ...prev,
                    [key]: newPresences[0] as any,
                }));
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                setOnlineUsers((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        user_id: userId,
                        online_at: new Date().toISOString(),
                        team_id: activeTeamId,
                    });
                }
            });

        return () => {
            presenceChannel.untrack();
            supabase.removeChannel(presenceChannel);
        };
    }, [userId, activeTeamId, supabase]);

    const isOnline = (targetUserId: string) => {
        return !!onlineUsers[targetUserId];
    };

    return (
        <PresenceContext.Provider value={{ onlineUsers, isOnline }}>
            {children}
        </PresenceContext.Provider>
    );
}

export function usePresence() {
    return useContext(PresenceContext);
}
