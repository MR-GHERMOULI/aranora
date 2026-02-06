-- ============================================
-- ARANORA PERFORMANCE OPTIMIZATION INDEXES
-- ============================================

-- Invoices Table Optimization
CREATE INDEX IF NOT EXISTS idx_invoices_status_issue_date ON invoices(status, issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Tasks Table Optimization
CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date ON tasks(status, due_date);

-- Projects Table Optimization
CREATE INDEX IF NOT EXISTS idx_projects_status_created_at ON projects(status, created_at);

-- Clients Table Optimization
CREATE INDEX IF NOT EXISTS idx_clients_name_created_at ON clients(name, created_at);

-- Combined Indexes for common dashboard filters (User Specific)
CREATE INDEX IF NOT EXISTS idx_invoices_user_status_date ON invoices(user_id, status, issue_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due ON tasks(user_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_projects_user_status_created ON projects(user_id, status, created_at);
