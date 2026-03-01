'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CollaboratorCRM, CollaboratorPayment } from "@/types";

export async function getCollaborators() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('collaborators_crm')
        .select('*')
        .eq('user_id', user.id)
        .order('full_name');

    if (error) {
        console.error('Error fetching collaborators:', error);
        return [];
    }

    return data as CollaboratorCRM[];
}

export async function getCollaborator(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('collaborators_crm')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching collaborator:', error);
        return null;
    }

    return data as CollaboratorCRM;
}

export async function createCollaborator(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const collaboratorData = {
        user_id: user.id,
        full_name: formData.get('fullName') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        whatsapp: formData.get('whatsapp') as string || null,
        platform_profile_link: formData.get('platformLink') as string || null,
        country: formData.get('country') as string || null,
        date_of_birth: formData.get('dob') as string || null,
        rating: formData.get('rating') ? parseInt(formData.get('rating') as string) : null,
        notes: formData.get('notes') as string || null,
    };

    const { data, error } = await supabase
        .from('collaborators_crm')
        .insert(collaboratorData)
        .select()
        .single();

    if (error) {
        console.error('Error creating collaborator:', error);
        throw new Error('Failed to create collaborator');
    }

    revalidatePath('/collaborators');
    return data;
}

export async function updateCollaborator(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const collaboratorData = {
        full_name: formData.get('fullName') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        whatsapp: formData.get('whatsapp') as string || null,
        platform_profile_link: formData.get('platformLink') as string || null,
        country: formData.get('country') as string || null,
        date_of_birth: formData.get('dob') as string || null,
        rating: formData.get('rating') ? parseInt(formData.get('rating') as string) : null,
        notes: formData.get('notes') as string || null,
    };

    const { error } = await supabase
        .from('collaborators_crm')
        .update(collaboratorData)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating collaborator:', error);
        throw new Error('Failed to update collaborator');
    }

    revalidatePath('/collaborators');
    revalidatePath(`/collaborators/${id}`);
}

export async function deleteCollaborator(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('collaborators_crm')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting collaborator:', error);
        throw new Error('Failed to delete collaborator');
    }

    revalidatePath('/collaborators');
}

export async function getCollaboratorProjects(email: string) {
    const supabase = await createClient();

    // Fetch projects where this email is a collaborator
    const { data, error } = await supabase
        .from('project_collaborators')
        .select('*, projects(title, id, status)')
        .eq('collaborator_email', email);

    if (error) {
        console.error('Error fetching collaborator projects:', error);
        return [];
    }

    return data;
}

export async function getCollaboratorPayments(collaboratorId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('collaborator_payments')
        .select('*')
        .eq('collaborator_id', collaboratorId)
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return data as CollaboratorPayment[];
}

export async function addCollaboratorPayment(collaboratorId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const paymentData = {
        user_id: user.id,
        collaborator_id: collaboratorId,
        amount: parseFloat(formData.get('amount') as string),
        currency: formData.get('currency') as string || 'USD',
        payment_date: formData.get('paymentDate') as string || new Date().toISOString().split('T')[0],
        description: formData.get('description') as string || null,
    };

    const { error } = await supabase
        .from('collaborator_payments')
        .insert(paymentData);

    if (error) {
        console.error('Error adding payment:', error);
        throw new Error('Failed to add payment');
    }

    revalidatePath(`/collaborators/${collaboratorId}`);
}
