-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tables

-- USERS / PROFILES (extends default auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  company_name text,
  avatar_url text,
  default_paper_size text check (default_paper_size in ('A4', 'LETTER')) default 'A4',
  default_tax_rate numeric(5, 2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CLIENTS
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  status text check (status in ('Potential', 'Active', 'Completed')) default 'Potential',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROJECTS
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  status text check (status in ('Pending', 'In Progress', 'Completed')) default 'Pending',
  budget numeric(10, 2),
  start_date date,
  end_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVOICES
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null,
  status text check (status in ('Draft', 'Sent', 'Paid', 'Overdue')) default 'Draft',
  issue_date date default CURRENT_DATE,
  due_date date,
  subtotal numeric(10, 2) default 0,
  tax_rate numeric(5, 2) default 0,
  tax_amount numeric(10, 2) default 0,
  total numeric(10, 2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVOICE ITEMS
create table public.invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  quantity integer default 1,
  unit_price numeric(10, 2) default 0,
  total numeric(10, 2) default 0
);

-- Row Level Security (RLS)

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Policies

-- Profiles: Users can only see and edit their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Clients: Users can only see clients they created
create policy "Users can view own clients" on public.clients
  for select using (auth.uid() = user_id);

create policy "Users can insert own clients" on public.clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update own clients" on public.clients
  for update using (auth.uid() = user_id);

create policy "Users can delete own clients" on public.clients
  for delete using (auth.uid() = user_id);

-- Projects: Users can only see projects they created
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Invoices: Users can only see invoices they created
create policy "Users can view own invoices" on public.invoices
  for select using (auth.uid() = user_id);

create policy "Users can insert own invoices" on public.invoices
  for insert with check (auth.uid() = user_id);

create policy "Users can update own invoices" on public.invoices
  for update using (auth.uid() = user_id);

create policy "Users can delete own invoices" on public.invoices
  for delete using (auth.uid() = user_id);

-- Invoice Items: Access via invoice ownership
create policy "Users can view own invoice items" on public.invoice_items
  for select using (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.invoice_items.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

create policy "Users can insert own invoice items" on public.invoice_items
  for insert with check (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.invoice_items.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

create policy "Users can update own invoice items" on public.invoice_items
  for update using (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.invoice_items.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

create policy "Users can delete own invoice items" on public.invoice_items
  for delete using (
    exists (
      select 1 from public.invoices
      where public.invoices.id = public.invoice_items.invoice_id
      and public.invoices.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, default_paper_size, default_tax_rate)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'A4', 0);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
