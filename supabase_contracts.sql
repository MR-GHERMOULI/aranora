-- CONTRACTS
create table public.contracts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  content text, -- HTML or Markdown content of the contract
  status text check (status in ('Draft', 'Sent', 'Signed')) default 'Draft',
  signed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.contracts enable row level security;

-- Policies
create policy "Users can view own contracts" on public.contracts
  for select using (auth.uid() = user_id);

create policy "Users can insert own contracts" on public.contracts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own contracts" on public.contracts
  for update using (auth.uid() = user_id);

create policy "Users can delete own contracts" on public.contracts
  for delete using (auth.uid() = user_id);
