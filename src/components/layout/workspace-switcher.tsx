'use client'

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Building2, Check, Loader2 } from "lucide-react";
import { getMyWorkspaces, switchWorkspace } from "@/app/(dashboard)/team/actions";
import { useRouter } from "next/navigation";
import { useTeam } from "@/components/providers/team-context";

interface Workspace {
    teamId: string;
    teamName: string;
    role: string;
    ownerName: string;
    ownerAvatar: string | null;
}

export function WorkspaceSwitcher() {
    const { isTeamMember, activeTeamId } = useTeam();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        if (isTeamMember) {
            getMyWorkspaces().then(setWorkspaces);
        }
    }, [isTeamMember]);

    if (!isTeamMember || workspaces.length <= 1) return null;

    const currentWorkspace = workspaces.find(w => w.teamId === activeTeamId);

    function handleSwitch(teamId: string) {
        startTransition(async () => {
            await switchWorkspace(teamId);
            router.refresh();
        });
    }

    return (
        <div className="px-3 mb-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-between text-left h-auto py-2 px-3 text-zinc-300 hover:text-white hover:bg-white/10"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="h-4 w-4 shrink-0 text-blue-400" />
                            <div className="truncate">
                                <p className="text-xs font-semibold truncate">
                                    {currentWorkspace?.teamName || 'Workspace'}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate">
                                    {currentWorkspace?.ownerName}
                                </p>
                            </div>
                        </div>
                        {isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        ) : (
                            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Workspaces</p>
                    <DropdownMenuSeparator />
                    {workspaces.map((ws) => (
                        <DropdownMenuItem
                            key={ws.teamId}
                            onClick={() => handleSwitch(ws.teamId)}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Building2 className="h-4 w-4 shrink-0 text-blue-500" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{ws.teamName}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{ws.ownerName}</p>
                                </div>
                            </div>
                            {ws.teamId === activeTeamId && (
                                <Check className="h-4 w-4 text-green-500 shrink-0" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
