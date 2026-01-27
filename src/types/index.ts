export type ClientStatus = 'Potential' | 'Active' | 'Completed';

export interface Client {
    id: string;
    user_id: string;
    name: string;
    email?: string;
    phone?: string;
    status: ClientStatus;
    notes?: string;
    created_at: string;
    // Computed fields
    total_projects?: number;
    total_revenue?: number;
}

export interface Project {
    id: string;
    user_id: string;
    client_id: string;
    title: string;
    slug: string;
    description?: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    budget?: number;
    start_date?: string;
    end_date?: string;
    created_at: string;
    client?: Client;
}

export interface Invoice {
    id: string;
    user_id: string;
    project_id?: string;
    client_id?: string;
    invoice_number: string;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
    issue_date: string;
    due_date?: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    created_at: string;
    client?: Client;
    project?: Project;
}

export interface Contract {
    id: string;
    user_id: string;
    client_id: string;
    project_id?: string;
    title: string;
    content?: string;
    status: 'Draft' | 'Sent' | 'Signed';
    signed_at?: string;
    created_at: string;
    client?: Client;
    project?: Project;
}
