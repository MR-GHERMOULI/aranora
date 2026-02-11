-- Create the invoice_downloads table
create table if not exists invoice_downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  invoice_id uuid references invoices(id) on delete cascade not null,
  downloaded_at timestamptz default now() not null
);

-- Enable RLS
alter table invoice_downloads enable row level security;

-- Policies
create policy "Users can insert their own download logs"
  on invoice_downloads for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own download logs"
  on invoice_downloads for select
  using (auth.uid() = user_id);
