'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { IntakeForm, IntakeSubmission, IntakeFormField } from "@/types";

// ============================================
// INTAKE FORM CRUD
// ============================================

export async function getIntakeForms() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching intake forms:', error);
        return [];
    }

    return data as IntakeForm[];
}

export async function getIntakeForm(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching intake form:', error);
        return null;
    }

    return data as IntakeForm;
}

export async function createIntakeForm(formData: {
    title: string;
    description?: string;
    fields: IntakeFormField[];
    settings: Record<string, any>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('intake_forms')
        .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description || null,
            fields: formData.fields,
            settings: formData.settings,
            status: 'active'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating intake form:', error);
        throw new Error('Failed to create intake form');
    }

    revalidatePath('/intake-forms');
    return data as IntakeForm;
}

export async function updateIntakeForm(id: string, formData: {
    title?: string;
    description?: string;
    fields?: IntakeFormField[];
    settings?: Record<string, any>;
    status?: 'active' | 'archived';
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const updatePayload: Record<string, any> = {};
    if (formData.title !== undefined) updatePayload.title = formData.title;
    if (formData.description !== undefined) updatePayload.description = formData.description;
    if (formData.fields !== undefined) updatePayload.fields = formData.fields;
    if (formData.settings !== undefined) updatePayload.settings = formData.settings;
    if (formData.status !== undefined) updatePayload.status = formData.status;

    const { error } = await supabase
        .from('intake_forms')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating intake form:', error);
        throw new Error('Failed to update intake form');
    }

    revalidatePath('/intake-forms');
    revalidatePath(`/intake-forms/${id}`);
}

export async function deleteIntakeForm(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('intake_forms')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting intake form:', error);
        throw new Error('Failed to delete intake form');
    }

    revalidatePath('/intake-forms');
}

// ============================================
// SUBMISSIONS
// ============================================

export async function getSubmissions(formId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    let query = supabase
        .from('intake_submissions')
        .select('*, form:intake_forms(title, fields)')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

    if (formId) {
        query = query.eq('form_id', formId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }

    return data as IntakeSubmission[];
}

export async function getSubmission(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data, error } = await supabase
        .from('intake_submissions')
        .select('*, form:intake_forms(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching submission:', error);
        return null;
    }

    return data as IntakeSubmission;
}

export async function updateSubmissionStatus(id: string, status: 'new' | 'reviewed' | 'converted' | 'archived', notes?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const updatePayload: Record<string, any> = { status };
    if (status === 'reviewed') {
        updatePayload.reviewed_at = new Date().toISOString();
    }
    if (notes !== undefined) {
        updatePayload.notes = notes;
    }

    const { error } = await supabase
        .from('intake_submissions')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating submission status:', error);
        throw new Error('Failed to update submission');
    }

    revalidatePath('/intake-forms');
}

export async function markSubmissionConverted(id: string, projectId?: string, contractId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const updatePayload: Record<string, any> = {
        status: 'converted',
        reviewed_at: new Date().toISOString()
    };
    if (projectId) updatePayload.converted_project_id = projectId;
    if (contractId) updatePayload.converted_contract_id = contractId;

    const { error } = await supabase
        .from('intake_submissions')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error marking submission as converted:', error);
        throw new Error('Failed to convert submission');
    }

    revalidatePath('/intake-forms');
}

export async function linkSubmissionToProject(id: string, projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('intake_submissions')
        .update({
            converted_project_id: projectId,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error linking submission to project:', error);
        throw new Error('Failed to link submission');
    }

    revalidatePath('/intake-forms');
    revalidatePath('/projects');
}

export async function deleteSubmission(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await supabase
        .from('intake_submissions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting submission:', error);
        throw new Error('Failed to delete submission');
    }

    revalidatePath('/intake-forms');
}

// ============================================
// PUBLIC: Get form by share token (no auth)
// ============================================

export async function getIntakeFormByToken(token: string) {
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
        .from('intake_forms')
        .select('id, title, description, fields, settings, user_id, status')
        .eq('share_token', token)
        .eq('status', 'active')
        .single();

    if (error) {
        console.error('Error fetching intake form by token:', error);
        return null;
    }

    // Get the freelancer's profile info for branding
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
        description: data.description as string | null,
        fields: data.fields as IntakeFormField[],
        settings: data.settings as Record<string, any>,
        user_id: data.user_id as string,
        profile,
    };
}
