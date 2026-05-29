-- Phase 1 / Slice 1: roles for CMS editors.
create table public.user_role (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

alter table public.user_role enable row level security;

-- A user can read their own role row.
create policy user_role_self_read on public.user_role
  for select
  using (user_id = auth.uid());

-- Only admins can insert / update / delete role rows.
create policy user_role_admin_write on public.user_role
  for all
  using (
    exists (
      select 1 from public.user_role ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_role ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );
