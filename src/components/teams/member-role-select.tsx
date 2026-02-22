'use client';

import { useState, useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { changeMemberRole } from '@/app/actions/team-actions';
import { toast } from 'sonner';

interface MemberRoleSelectProps {
    teamId: string;
    memberId: string;
    currentRole: string;
    disabled?: boolean;
}

export function MemberRoleSelect({ teamId, memberId, currentRole, disabled }: MemberRoleSelectProps) {
    const [isPending, startTransition] = useTransition();
    const [role, setRole] = useState(currentRole);

    const handleRoleChange = (newRole: string) => {
        setRole(newRole);
        startTransition(async () => {
            const result = await changeMemberRole(teamId, memberId, newRole as 'admin' | 'member');
            if (result?.error) {
                toast.error(result.error);
                setRole(currentRole); // revert on error
            } else {
                toast.success('Role updated successfully');
            }
        });
    };

    return (
        <Select value={role} onValueChange={handleRoleChange} disabled={disabled || isPending}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
            </SelectContent>
        </Select>
    );
}
