import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, signerName, signerEmail, signatureData } = body;

        if (!token || !signerName || !signatureData) {
            return NextResponse.json(
                { error: 'Missing required fields: token, signerName, signatureData' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get the contract by signing token
        const { data: contract, error: fetchError } = await supabase
            .from('contracts')
            .select('id, status, signing_token, title, user_id')
            .eq('signing_token', token)
            .single();

        if (fetchError || !contract) {
            return NextResponse.json(
                { error: 'Contract not found or invalid token' },
                { status: 404 }
            );
        }

        if (contract.status === 'Signed') {
            return NextResponse.json(
                { error: 'Contract is already signed' },
                { status: 400 }
            );
        }

        if (contract.status !== 'Sent') {
            return NextResponse.json(
                { error: 'Contract is not available for signing' },
                { status: 400 }
            );
        }

        // Get client IP and user agent
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Update the contract with signature data
        const { error: updateError } = await supabase
            .from('contracts')
            .update({
                status: 'Signed',
                signed_at: new Date().toISOString(),
                signer_name: signerName,
                signer_email: signerEmail || null,
                signature_data: signatureData,
                signer_ip: ip,
                signer_user_agent: userAgent,
            })
            .eq('id', contract.id)
            .eq('signing_token', token);

        if (updateError) {
            console.error('Error signing contract:', updateError);
            return NextResponse.json(
                { error: 'Failed to sign contract' },
                { status: 500 }
            );
        }

        // Create notification for the freelancer
        await supabase.from('notifications').insert({
            user_id: contract.user_id,
            title: 'Contract Signed! ✍️',
            message: `${signerName} has signed the contract: ${contract.title}`,
            type: 'contract_signed', // System helps identify this type
            payload: {
                contractId: contract.id,
                signerName,
                signerEmail: signerEmail || null
            },
            read: false
        });

        // Revalidate paths to update freelancer's view
        revalidatePath('/contracts');
        revalidatePath(`/contracts/${contract.id}`);
        revalidatePath('/dashboard');

        return NextResponse.json({ success: true, message: 'Contract signed successfully' });
    } catch (error) {
        console.error('Sign contract API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

