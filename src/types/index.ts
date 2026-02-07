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
    name: string
    email?: string | null
    phone?: string | null
    status: string
    notes?: string | null
    created_at: string
}

export interface Project {
    id: string
    user_id: string
    client_id: string
    title: string
    slug: string
    description?: string | null
    status: string
    budget?: number | null
    start_date?: string | null
    end_date?: string | null
    created_at: string
    client?: { name: string }
}

export interface Invoice {
    id: string
    user_id: string
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
    created_at: string
    client?: { name: string }
    project?: { title: string }
    items?: any[]
}

export interface Contract {
    id: string
    user_id: string
    client_id: string
    project_id?: string | null
    title: string
    content: string
    status: string
    signed_at?: string | null
    created_at: string
    client?: { name: string }
    project?: { title: string }
}

export interface Task {
    id: string
    user_id: string
    project_id?: string | null
    title: string
    description?: string | null
    status: string
    priority: string
    due_date?: string | null
    is_personal: boolean
    recurrence?: any
    category: string
    created_at: string
    project?: { title: string }
}
