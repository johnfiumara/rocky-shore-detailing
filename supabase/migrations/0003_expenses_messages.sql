-- Phase 1 / Slice 3: expense tracking + customer communication log.
--
-- Two Prisma-owned tables. Like the existing booking/customer tables, these
-- use PascalCase identifiers because Prisma maps model names to table names
-- verbatim. RLS is staff-only (admin/editor) for both.

-- 1) Expense ------------------------------------------------------------------
create table if not exists public."Expense" (
  id text primary key,
  date date not null,
  category text not null,
  description text not null,
  amount double precision not null,
  vendor text,
  notes text,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null
);

create index if not exists "Expense_date_idx" on public."Expense" (date);

alter table public."Expense" enable row level security;

do $$ begin
  create policy expense_staff_read on public."Expense"
    for select
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy expense_staff_insert on public."Expense"
    for insert
    with check (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy expense_staff_update on public."Expense"
    for update
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    )
    with check (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy expense_staff_delete on public."Expense"
    for delete
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role = 'admin'
      )
    );
exception when duplicate_object then null; end $$;

-- 2) CustomerMessage ----------------------------------------------------------
create table if not exists public."CustomerMessage" (
  id text primary key,
  "customerId" text not null references public."Customer"(id) on delete cascade,
  "bookingId" text,
  channel text not null,
  direction text not null,
  body text not null,
  "createdAt" timestamp(3) not null default now()
);

create index if not exists "CustomerMessage_customerId_createdAt_idx"
  on public."CustomerMessage" ("customerId", "createdAt");

alter table public."CustomerMessage" enable row level security;

do $$ begin
  create policy customer_message_staff_read on public."CustomerMessage"
    for select
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy customer_message_staff_insert on public."CustomerMessage"
    for insert
    with check (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy customer_message_staff_delete on public."CustomerMessage"
    for delete
    using (
      exists (
        select 1 from public.user_role ur
        where ur.user_id = auth.uid() and ur.role in ('admin','editor')
      )
    );
exception when duplicate_object then null; end $$;
