'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Invoice } from "@/types";

export async function getInvoices(clientId?: string, projectId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let query = supabase
    .from('invoices')
    .select('*, client:clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  } else if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return data as Invoice[];
}

export async function getInvoice(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch invoice with relational data
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, client:clients(name), project:projects(title)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (invoiceError) {
    console.error(`Error fetching invoice ${id}:`, invoiceError);
    return { data: null, error: invoiceError };
  }

  if (!invoice) {
    return { data: null, error: { message: 'Invoice not found in database', code: 'NOT_FOUND' } };
  }

  // Fetch invoice items
  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id);

  if (itemsError) {
    console.error('Error fetching invoice items:', itemsError);
  }

  return { data: { ...invoice, items: items || [] } as Invoice & { items: any[] }, error: null };
}


export async function createInvoice(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const clientId = formData.get('clientId') as string;
  const projectId = formData.get('projectId') as string || null;
  const issueDate = formData.get('issueDate') as string;
  const dueDate = formData.get('dueDate') as string;
  const status = 'Draft';

  // Parse items from hidden JSON field (simplified for FormData)
  // In a real app, we might use a more robust data structure, 
  // but for form actions, passing a JSON string is a common workaround.
  const itemsJson = formData.get('items') as string;
  const items = JSON.parse(itemsJson);

  // Generate a random invoice number (simple version)
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  const taxRate = 0; // Default 0 for MVP
  const taxAmount = 0;
  const total = subtotal + taxAmount;

  // Insert Invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: clientId,
      project_id: projectId,
      invoice_number: invoiceNumber,
      status,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      paper_size: formData.get('paperSize') as string || 'A4'
    })
    .select()
    .single();

  if (invoiceError) {
    console.error('Error creating invoice:', invoiceError);
    throw new Error('Failed to create invoice');
  }

  // Insert Items
  const invoiceItems = items.map((item: any) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total: item.quantity * item.unitPrice
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems);

  if (itemsError) {
    console.error('Error creating invoice items:', itemsError);
    // Ideally we would rollback transaction here, but Supabase HTTP API doesn't support transactions easily in client lib yet without RPC.
    // For MVP we assume success.
  }

  revalidatePath('/invoices');
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const id = formData.get('id') as string;
  const clientId = formData.get('clientId') as string;
  const projectId = formData.get('projectId') as string || null;
  const issueDate = formData.get('issueDate') as string;
  const dueDate = formData.get('dueDate') as string;
  const status = formData.get('status') as string;

  const itemsJson = formData.get('items') as string;
  const items = JSON.parse(itemsJson);

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
  const total = subtotal; // Tax placeholder

  // Update Invoice
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      client_id: clientId,
      project_id: projectId,
      status,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal,
      total,
      paper_size: formData.get('paperSize') as string || 'A4'
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (invoiceError) {
    console.error('Error updating invoice:', invoiceError);
    throw new Error('Failed to update invoice');
  }

  // 1. Delete existing items
  const { error: deleteError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', id);

  if (deleteError) {
    console.error('Error deleting old items:', deleteError);
    throw new Error('Failed to update invoice items');
  }

  // 2. Insert new items
  const invoiceItems = items.map((item: any) => ({
    invoice_id: id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total: item.quantity * item.unitPrice
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems);

  if (itemsError) {
    console.error('Error inserting new items:', itemsError);
  }

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}


export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting invoice:', error);
    throw new Error('Failed to delete invoice');
  }

  revalidatePath('/invoices');
}

