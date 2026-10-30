create schema if not exists meta_internal;
revoke all on schema meta_internal from public, anon, authenticated;
create table if not exists meta_internal.admin_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
revoke all on table meta_internal.admin_accounts from public, anon, authenticated;
-- Verified Meta owner, not a user-editable profile flag.
insert into meta_internal.admin_accounts(user_id)
select id from auth.users
where id='c2a58c97-3c89-4ab2-bbbe-81391dd27a15'::uuid
and email='murat.amir.olzhasuly@gmail.com' and email_confirmed_at is not null
on conflict do nothing;
create or replace function public.meta_admin_access()
returns boolean language sql stable security definer set search_path=''
as $body$
select auth.uid() is not null and exists (
 select 1 from meta_internal.admin_accounts a where a.user_id=auth.uid()
);
$body$;
revoke all on function public.meta_admin_access() from public, anon;
grant execute on function public.meta_admin_access() to authenticated;
