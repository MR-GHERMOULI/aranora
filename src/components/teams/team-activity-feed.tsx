'use client';

import { useState, useEffect } from 'react';
import { getTeamActivity, TeamActivityLog } from '@/app/actions/team-activity-actions';
import { formatDistanceToNow } from 'date-fns';
import {
    CheckCircle2,
    Folder,
    Users,
    UserPlus,
    UserMinus,
    Briefcase,
    Settings,
    Activity,
    Plus,
    Pencil,
    Trash2
} from 'lucide-react';

export function TeamActivityFeed() {
    const [activities, setActivities] = useState<TeamActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadActivity() {
            try {
                const data = await getTeamActivity(50);
                setActivities(data);
            } catch (error) {
                console.error("Failed to load team activity", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadActivity();
    }, []);

    const getActivityDetails = (log: TeamActivityLog) => {
        let icon = <Activity className="h-4 w-4 text-muted-foreground" />;
        let colorClass = "bg-muted";

        // Entity Type Icon
        switch (log.entity_type) {
            case 'tasks':
                icon = <CheckCircle2 className="h-4 w-4 text-blue-500" />;
                colorClass = "bg-blue-500/10";
                break;
            case 'projects':
                icon = <Folder className="h-4 w-4 text-emerald-500" />;
                colorClass = "bg-emerald-500/10";
                break;
            case 'team_members':
                if (log.action === 'INSERT') {
                    icon = <UserPlus className="h-4 w-4 text-emerald-500" />;
                    colorClass = "bg-emerald-500/10";
                } else if (log.action === 'DELETE') {
                    icon = <UserMinus className="h-4 w-4 text-red-500" />;
                    colorClass = "bg-red-500/10";
                } else {
                    icon = <Users className="h-4 w-4 text-purple-500" />;
                    colorClass = "bg-purple-500/10";
                }
                break;
            case 'clients':
                icon = <Briefcase className="h-4 w-4 text-amber-500" />;
                colorClass = "bg-amber-500/10";
                break;
            case 'teams':
                icon = <Settings className="h-4 w-4 text-slate-500" />;
                colorClass = "bg-slate-500/10";
                break;
        }

        // Action verb
        let actionVerb = 'modified';
        if (log.action === 'INSERT') actionVerb = 'created';
        if (log.action === 'DELETE') actionVerb = 'deleted';
        if (log.action === 'UPDATE') actionVerb = 'updated';

        return { icon, colorClass, actionVerb };
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground bg-card border rounded-xl">
                <Activity className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p>No activity recorded yet.</p>
                <p className="text-sm">Workspace changes like creating tasks or adding members will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((log) => {
                const { icon, colorClass, actionVerb } = getActivityDetails(log);

                return (
                    <div key={log.id} className="flex gap-4 p-4 border rounded-xl bg-card hover:bg-accent/20 transition-colors">
                        <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${colorClass}`}>
                            {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm">
                                <span className="font-semibold">{log.user?.full_name || 'System User'}</span>{' '}
                                <span className="text-muted-foreground">{actionVerb}</span>{' '}
                                <span className="font-medium text-foreground capitalize">
                                    {log.entity_type.replace('_', ' ').replace(/s$/, '')}
                                </span>
                                {log.entity_name && (
                                    <>
                                        <span className="text-muted-foreground"> : </span>
                                        <span className="font-medium">"{log.entity_name}"</span>
                                    </>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
