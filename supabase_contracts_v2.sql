-- ============================================
-- CONTRACT TEMPLATES — قوالب العقود
-- ============================================
create table public.contract_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.contract_templates enable row level security;

create policy "Users can view own templates" on public.contract_templates
  for select using (auth.uid() = user_id);

create policy "Users can insert own templates" on public.contract_templates
  for insert with check (auth.uid() = user_id);

create policy "Users can update own templates" on public.contract_templates
  for update using (auth.uid() = user_id);

create policy "Users can delete own templates" on public.contract_templates
  for delete using (auth.uid() = user_id);

-- ============================================
-- CONTRACTS — إضافة أعمدة التوقيع الإلكتروني
-- ============================================
alter table public.contracts
  add column if not exists signing_token text unique,
  add column if not exists signer_name text,
  add column if not exists signer_email text,
  add column if not exists signature_data text,
  add column if not exists signer_ip text,
  add column if not exists signer_user_agent text,
  add column if not exists sent_at timestamp with time zone;

-- ============================================
-- PUBLIC ACCESS — السماح بقراءة العقد بالرمز (بدون تسجيل دخول)
-- ============================================
create policy "Anyone can view contracts by signing token" on public.contracts
  for select using (signing_token is not null);

-- السماح بتحديث العقد عبر الرمز (للتوقيع)
create policy "Anyone can sign contract by token" on public.contracts
  for update using (signing_token is not null AND status = 'Sent');
