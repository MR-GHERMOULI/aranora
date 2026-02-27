"use server"

import { redirect } from 'next/navigation';

export async function createTeam(formData: FormData) {
  return { error: 'Team features have been removed from this version of the platform.' };
}

export async function inviteTeamMember(formData: FormData) {
  return { error: 'Team features have been removed from this version of the platform.' };
}

export async function removeTeamMember(teamId: string, memberId: string) {
  return { error: 'Team features have been removed from this version of the platform.' };
}

export async function changeMemberRole(teamId: string, memberId: string, newRole: 'admin' | 'member') {
  return { error: 'Team features have been removed from this version of the platform.' };
}

export async function acceptInvitation(token: string) {
  return { error: 'Invitation system is no longer active.' };
}
