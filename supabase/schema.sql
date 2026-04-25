-- EMI Tracker schema (run in Supabase SQL editor)

create extension if not exists "pgcrypto";

create table if not exists public.owner_profile (
  id boolean primary key default true,
  owner_user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (id = true)
);

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.owner_profile op
    where op.owner_user_id = auth.uid()
  );
$$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date not null,
  method text not null check (method in ('Bank Transfer', 'bKash', 'Rocket', 'Cash')),
  proof_url text not null,
  installment_no integer not null unique,
  status text not null default 'Pending' check (status in ('Pending', 'Approved')),
  security_code text not null,
  created_at timestamptz not null default now()
);

-- Ensure old installs stop using DB sequence/default auto-fill.
alter table public.payments alter column installment_no drop default;
drop sequence if exists public.payments_installment_seq;

alter table public.payments enable row level security;

drop policy if exists "owner can select payments" on public.payments;
create policy "owner can select payments"
on public.payments
for select
to authenticated
using (public.is_owner());

drop policy if exists "owner can insert payments" on public.payments;
create policy "owner can insert payments"
on public.payments
for insert
to authenticated
with check (public.is_owner());

drop policy if exists "owner can update payments" on public.payments;
create policy "owner can update payments"
on public.payments
for update
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists "owner can delete payments" on public.payments;
create policy "owner can delete payments"
on public.payments
for delete
to authenticated
using (public.is_owner());

create or replace view public.public_payment_status as
select
  id,
  amount,
  payment_date,
  method,
  proof_url,
  installment_no,
  status,
  created_at
from public.payments
order by installment_no asc;

grant select on public.public_payment_status to anon, authenticated;

create or replace function public.get_payment_for_approval(payment_id_input uuid)
returns table (
  id uuid,
  amount numeric,
  payment_date date,
  method text,
  proof_url text,
  installment_no integer,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.amount,
    p.payment_date,
    p.method,
    p.proof_url,
    p.installment_no,
    p.status,
    p.created_at
  from public.payments p
  where p.id = payment_id_input;
$$;

grant execute on function public.get_payment_for_approval(uuid) to anon, authenticated;

create or replace function public.approve_payment_with_code(
  payment_id_input uuid,
  security_code_input text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.payments
  set status = 'Approved'
  where id = payment_id_input
    and status = 'Pending'
    and upper(security_code) = upper(security_code_input);

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

grant execute on function public.approve_payment_with_code(uuid, text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read proofs" on storage.objects;
create policy "public can read proofs"
on storage.objects
for select
to public
using (bucket_id = 'payment-proofs');

drop policy if exists "owner can upload proofs" on storage.objects;
create policy "owner can upload proofs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'payment-proofs' and public.is_owner());

drop policy if exists "owner can update proofs" on storage.objects;
create policy "owner can update proofs"
on storage.objects
for update
to authenticated
using (bucket_id = 'payment-proofs' and public.is_owner())
with check (bucket_id = 'payment-proofs' and public.is_owner());

drop policy if exists "owner can delete proofs" on storage.objects;
create policy "owner can delete proofs"
on storage.objects
for delete
to authenticated
using (bucket_id = 'payment-proofs' and public.is_owner());

-- After creating your auth user, set owner mapping once:
-- insert into public.owner_profile (id, owner_user_id) values (true, '<YOUR_AUTH_USER_UUID>');
