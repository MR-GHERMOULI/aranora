import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/dashboard?error=Missing+invitation+token', request.url));
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        // Redirect to login, passing the token so they can accept after logging in/signing up
        return NextResponse.redirect(new URL(`/login?redirect=/api/invitations/accept?token=${token}`, request.url));
    }

    // Find invitation
    const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*, teams(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

    if (inviteError || !invitation) {
        return NextResponse.redirect(new URL('/dashboard?error=Invalid+or+expired+invitation', request.url));
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
        await supabase.from('team_invitations').update({ status: 'expired' }).eq('id', invitation.id);
        return NextResponse.redirect(new URL('/dashboard?error=Invitation+has+expired', request.url));
    }

    // Verify email matches (Optional: you might want to allow them to accept with a different email if they are logged in)
    if (invitation.email.toLowerCase() !== userData.user.email?.toLowerCase()) {
        return NextResponse.redirect(new URL('/dashboard?error=This+invitation+was+sent+to+a+different+email+address', request.url));
    }

    // Add to team
    const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
            team_id: invitation.team_id,
            user_id: userData.user.id,
            role: invitation.role
        }]);

    if (memberError) {
        console.error("Error adding to team:", memberError);
        return NextResponse.redirect(new URL('/dashboard?error=Failed+to+join+team', request.url));
    }

    // Update invitation status
    await supabase.from('team_invitations').update({ status: 'accepted' }).eq('id', invitation.id);

    // Redirect to the team's dashboard
    return NextResponse.redirect(new URL(`/dashboard?success=Successfully+joined+${encodeURIComponent(invitation.teams.name)}`, request.url));
}
