import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, clientName, clientEmail, clientPhone, clientCompany, responses } = body;

        if (!token || !clientName || !clientEmail) {
            return NextResponse.json(
                { error: 'Missing required fields: token, clientName, clientEmail' },
                { status: 400 }
            );
        }

        // Use service role key to bypass RLS since this is a public endpoint
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify the form exists and is active
        const { data: form, error: formError } = await supabase
            .from('intake_forms')
            .select('id, user_id, status, title')
            .eq('share_token', token)
            .eq('status', 'active')
            .single();

        if (formError || !form) {
            return NextResponse.json(
                { error: 'Form not found or no longer active' },
                { status: 404 }
            );
        }

        // Get client IP and user agent
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Insert the submission
        const { data: submission, error: insertError } = await supabase
            .from('intake_submissions')
            .insert({
                form_id: form.id,
                user_id: form.user_id,
                client_name: clientName.trim(),
                client_email: clientEmail.trim(),
                client_phone: clientPhone || null,
                client_company: clientCompany || null,
                responses: responses || {},
                status: 'new',
                submitted_at: new Date().toISOString(),
                ip_address: ip,
                user_agent: userAgent,
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Error saving intake submission:', insertError);
            return NextResponse.json(
                { error: 'Failed to save submission' },
                { status: 500 }
            );
        }

        // Create notification for the freelancer
        await supabase.from('notifications').insert({
            user_id: form.user_id,
            title: 'New Intake Submission! 📋',
            message: `${clientName} submitted a response to "${form.title}"`,
            type: 'intake_submission',
            payload: {
                formId: form.id,
                submissionId: submission.id,
                clientName,
                clientEmail
            },
            read: false
        });

        return NextResponse.json({
            success: true,
            message: 'Form submitted successfully'
        });

    } catch (error) {
        console.error('Intake submit API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
