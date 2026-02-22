// ── Team / Workspace Types ─────────────────────────────

export interface Team {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
    profiles?: { id: string; full_name: string; email: string; avatar_url?: string };
}

export interface TeamInvitation {
    id: string;
    team_id: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    expires_at: string;
    created_at: string;
}

// ── Core Entity Types ─────────────────────────────────

export interface ContactMessage {
    id: string
    name: string
    email: string
    subject: string | null
    message: string
    is_read: boolean
    created_at: string
}

export interface Client {
    id: string
    user_id: string
    team_id?: string | null
    name: string
    email?: string | null
    phone?: string | null
    company?: string | null
    status: string
    notes?: string | null
    created_at: string
}

export interface Project {
    id: string
    user_id: string
    team_id?: string | null
    client_id: string
    title: string
    slug: string
    description?: string | null
    status: string
    budget?: number | null
    start_date?: string | null
    end_date?: string | null
    hourly_rate?: number | null
    share_token?: string | null
    created_at: string
    client?: { name: string }
}

export interface Invoice {
    id: string
    user_id: string
    team_id?: string | null
    client_id: string
    project_id?: string | null
    invoice_number: string
    status: string
    issue_date: string
    due_date: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    paper_size?: 'A4' | 'LETTER'
    created_at: string
    client?: { name: string }
    project?: { title: string }
    items?: any[]
}

export interface ContractStructuredData {
    currency?: string
    total_amount?: number
    payment_type?: 'Fixed' | 'Hourly'
    payment_schedule?: 'Upfront' | 'Milestones' | 'On Completion' | 'Custom'
    start_date?: string
    end_date?: string | null
    is_open_ended?: boolean
    revisions_included?: number
    termination_notice_days?: number
    deliverables?: string[]
    governing_law?: string
    nda_included?: boolean
    ip_ownership?: 'Full' | 'License' | 'After Payment'
    paper_size?: 'A4' | 'LETTER'
    tax_rate?: number
}

export interface Contract {
    id: string
    user_id: string
    client_id: string
    project_id?: string | null
    title: string
    content: string
    status: string
    contract_data?: ContractStructuredData | null
    signing_token?: string | null
    signer_name?: string | null
    signer_email?: string | null
    signature_data?: string | null
    signer_ip?: string | null
    signer_user_agent?: string | null
    signed_at?: string | null
    sent_at?: string | null
    created_at: string
    client?: { name: string; email?: string | null }
    project?: { title: string }
}

export interface ContractTemplate {
    id: string
    user_id: string
    name: string
    content: string
    contract_data?: ContractStructuredData | null
    created_at: string
    updated_at: string
}


export interface Task {
    id: string
    user_id: string
    team_id?: string | null
    project_id?: string | null
    assigned_to?: string | null
    title: string
    description?: string | null
    status: string
    priority: string
    due_date?: string | null
    is_personal: boolean
    recurrence?: any
    category: string
    estimated_hours?: number | null
    created_at: string
    project?: { title: string }
    assignee?: { full_name: string; username?: string; avatar_url?: string }
    creator?: { full_name: string; username?: string }
}

export interface Subscription {
    id: string;
    user_id: string;
    name: string;
    price: number;
    currency: string;
    billing_cycle: 'monthly' | 'yearly';
    start_date: string;
    next_renewal_date: string;
    status: 'active' | 'cancelled' | 'expired';
    icon?: string;
    category?: string;
    created_at: string;
    updated_at: string;
}

export interface TimeEntry {
    id: string;
    user_id: string;
    team_id?: string | null;
    project_id?: string | null;
    task_id?: string | null;
    description?: string | null;
    start_time: string;
    end_time?: string | null;
    is_billable: boolean;
    hourly_rate?: number | null;
    invoice_id?: string | null;
    created_at: string;
    updated_at: string;
    project?: { title: string };
    task?: { title: string };
    profiles?: { full_name: string; avatar_url: string; email: string };
}

export interface CollaboratorCRM {
    id: string;
    user_id: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    platform_profile_link?: string | null;
    country?: string | null;
    date_of_birth?: string | null;
    rating?: number | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CollaboratorPayment {
    id: string;
    user_id: string;
    collaborator_id: string;
    amount: number;
    currency: string;
    payment_date: string;
    description?: string | null;
    created_at: string;
}
