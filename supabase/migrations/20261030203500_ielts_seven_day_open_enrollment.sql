-- Seven-day IELTS welcome access for all existing registered learners and new signups.
-- This migration is additive: no DELETE/UPDATE of prior learning data or enrollments.
-- Campaign expiry stops NEW automatic grants; previously granted course access remains.
-- Private campaign metadata cannot be accessed by anon/authenticated client roles.

create table if not exists meta_internal.course_access_campaigns (
 campaign_key text primary key,
 course_slug text not null references public.courses(slug),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 enabled boolean not null default true,
 created_at timestamptz not null default now(),
 constraint course_access_campaign_dates_valid check (ends_at > starts_at)
);

alter table meta_internal.course_access_campaigns enable row level security;
revoke all on meta_internal.course_access_campaigns from public, anon, authenticated;

-- Set the seven-day interval once at initial application, not upon redeploy.
with campaign_start as (
 select clock_timestamp() as started
)
insert into meta_internal.course_access_campaigns
 (campaign_key,course_slug,starts_at,ends_at,enabled)
select 'ielts_open_week_20261030','ielts',started,started + interval '7 days',true
from campaign_start
on conflict (campaign_key) do nothing;

-- Supabase Auth inserts are performed by an internal Auth role.
-- A tightly scoped trigger grants the single existing IELTS course without
-- giving visitors or students INSERT privileges on course_enrollments.
create or replace function meta_internal.grant_ielts_on_new_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if coalesce(new.is_anonymous,false) = false
    and exists (
      select 1
      from meta_internal.course_access_campaigns c
      where c.campaign_key = 'ielts_open_week_20261030'
        and c.course_slug = 'ielts'
        and c.enabled
        and clock_timestamp() >= c.starts_at
        and clock_timestamp() < c.ends_at
    )
  then
    insert into public.course_enrollments (user_id,course_slug)
    values (new.id,'ielts')
    on conflict (user_id,course_slug) do nothing;
  end if;
  return new;
exception when others then
  -- A promotional enrollment must never block a person's signup.
  raise warning 'IELTS auto-enrollment failed during signup: %', SQLERRM;
  return new;
end;
$function$;

revoke all on function meta_internal.grant_ielts_on_new_registration()
 from public, anon, authenticated;

do $migration$
begin
  if not exists(
    select 1
    from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'meta_ielts_open_week_new_user'
      and not tgisinternal
  ) then
    create trigger meta_ielts_open_week_new_user
    after insert on auth.users
    for each row
    execute function meta_internal.grant_ielts_on_new_registration();
  end if;
end
$migration$;

-- Backfill all regular accounts. ON CONFLICT protects prior assignments and metadata.
insert into public.course_enrollments (user_id,course_slug)
select u.id,'ielts'
from auth.users u
where coalesce(u.is_anonymous,false)=false
on conflict (user_id,course_slug) do nothing;
