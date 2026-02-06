-- TASKS
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status text check (status in ('Todo', 'In Progress', 'Done')) default 'Todo',
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.tasks enable row level security;

-- Policies
create policy "Users can view own tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on public.tasks
  for delete using (auth.uid() = user_id);
