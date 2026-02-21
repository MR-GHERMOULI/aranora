'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Contract, ContractTemplate } from "@/types";
import { v4 as uuidv4 } from 'uuid';

// ============================================
// CONTRACT CRUD
// ============================================

export async function getContracts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('contracts')
        .select('*, client:clients(name, email)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contracts:', error);
        return [];
    }

    return data as Contract[];
}

export async function getContract(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('contracts')
        .select('*, client:clients(*), project:projects(title)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching contract:', error);
        return null;
    }

    return data as Contract;
}

export async function createContract(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string || null;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    const { error } = await supabase
        .from('contracts')
        .insert({
            user_id: user.id,
            client_id: clientId,
            project_id: projectId,
            title,
            content,
            status: 'Draft'
        });

    if (error) {
        console.error('Error creating contract:', error);
        throw new Error('Failed to create contract');
    }

    revalidatePath('/contracts');
}

export async function updateContract(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const id = formData.get('id') as string;
    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string || null;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    const { error } = await supabase
        .from('contracts')
        .update({
            client_id: clientId,
            project_id: projectId,
            title,
            content
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating contract:', error);
        throw new Error('Failed to update contract');
    }

    revalidatePath('/contracts');
    revalidatePath(`/contracts/${id}`);
}

export async function deleteContract(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting contract:', error);
        throw new Error('Failed to delete contract');
    }

    revalidatePath('/contracts');
}

// ============================================
// SEND CONTRACT — إرسال العقد للعميل
// ============================================

export async function sendContract(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if contract already has a signing token
    const { data: existing } = await supabase
        .from('contracts')
        .select('signing_token, status')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (existing?.signing_token && existing.status === 'Sent') {
        return existing.signing_token;
    }

    const signingToken = uuidv4();

    const { error } = await supabase
        .from('contracts')
        .update({
            signing_token: signingToken,
            status: 'Sent',
            sent_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error sending contract:', error);
        throw new Error('Failed to send contract');
    }

    revalidatePath(`/contracts/${id}`);
    return signingToken;
}

// ============================================
// PUBLIC: Get contract by signing token (no auth)
// ============================================

export async function getContractByToken(token: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('contracts')
        .select('id, title, content, status, signed_at, signer_name, created_at, user_id, client:clients(name, email), project:projects(title)')
        .eq('signing_token', token)
        .single();

    if (error) {
        console.error('Error fetching contract by token:', error);
        return null;
    }

    // Normalize the joined data (Supabase may return objects or arrays depending on the relation)
    const clientData = Array.isArray(data.client) ? data.client[0] : data.client;
    const projectData = Array.isArray(data.project) ? data.project[0] : data.project;

    // Get the freelancer's profile info for display
    let profile = null;
    if (data?.user_id) {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, company_name, logo_url')
            .eq('id', data.user_id)
            .single();
        profile = profileData;
    }

    return {
        id: data.id as string,
        title: data.title as string,
        content: data.content as string,
        status: data.status as string,
        signed_at: data.signed_at as string | null,
        signer_name: data.signer_name as string | null,
        created_at: data.created_at as string,
        client: clientData as { name: string; email?: string | null } | null,
        project: projectData as { title: string } | null,
        profile,
    };
}

// ============================================
// TEMPLATE CRUD — قوالب العقود
// ============================================

export async function getTemplates() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }

    return data as ContractTemplate[];
}

export async function createTemplate(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const name = formData.get('name') as string;
    const content = formData.get('content') as string;

    const { error } = await supabase
        .from('contract_templates')
        .insert({
            user_id: user.id,
            name,
            content
        });

    if (error) {
        console.error('Error creating template:', error);
        throw new Error('Failed to create template');
    }

    revalidatePath('/contracts/templates');
}

export async function updateTemplate(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;

    const { error } = await supabase
        .from('contract_templates')
        .update({
            name,
            content,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating template:', error);
        throw new Error('Failed to update template');
    }

    revalidatePath('/contracts/templates');
}

export async function deleteTemplate(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting template:', error);
        throw new Error('Failed to delete template');
    }

    revalidatePath('/contracts/templates');
}
