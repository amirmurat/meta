-- Meta public leads, private authenticated messaging, admin-managed course enrollment.
-- Installed on 2026-10-30 via additive migration; this file documents exact server functions.
-- Existing lesson_progress, lesson_attempts, courses and auth.users are never dropped.
create table if not exists public.meta_interest_requests (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check(length(full_name) between 2 and 100),
 email text not null check(length(email) between 5 and 200),
 course_interest text not null check(course_interest in ('ielts','arabic','quran','flutter','other')),
 message text not null check(length(message) between 3 and 2000),
 status text not null default 'new' check(status in ('new','contacted','closed')),
 created_at timestamptz not null default now()
);
create index if not exists meta_interest_email_time on public.meta_interest_requests(lower(email),created_at desc);
alter table public.meta_interest_requests enable row level security;
revoke all on public.meta_interest_requests from public,anon,authenticated;
grant select,update on public.meta_interest_requests to authenticated;
create policy "Meta admin reads leads" on public.meta_interest_requests for select to authenticated using((select public.meta_admin_access()));
create policy "Meta admin updates lead status" on public.meta_interest_requests for update to authenticated using((select public.meta_admin_access())) with check((select public.meta_admin_access()));

create table if not exists public.meta_support_threads (
 user_id uuid primary key references auth.users(id) on delete cascade,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table if not exists public.meta_support_messages (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.meta_support_threads(user_id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(length(body) between 1 and 3000),
 created_at timestamptz not null default now()
);
create index if not exists meta_support_recent_messages_idx on public.meta_support_messages(user_id,created_at desc);
alter table public.meta_support_threads enable row level security;
alter table public.meta_support_messages enable row level security;
revoke all on public.meta_support_threads,public.meta_support_messages from public,anon,authenticated;
grant select on public.meta_support_threads,public.meta_support_messages to authenticated;
create policy "Support threads visible to owner and admin" on public.meta_support_threads for select to authenticated using(user_id=(select auth.uid()) or (select public.meta_admin_access()));
create policy "Support messages visible to owner and admin" on public.meta_support_messages for select to authenticated using(user_id=(select auth.uid()) or (select public.meta_admin_access()));

create table if not exists meta_internal.enrollment_audit (
 id uuid primary key default gen_random_uuid(),
 admin_id uuid not null references auth.users(id),
 user_id uuid not null references auth.users(id),
 course_slug text not null,
 action text not null check(action in ('assign','revoke')),
 changed_at timestamptz not null default now()
);
revoke all on meta_internal.enrollment_audit from public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.meta_admin_reply(p_user uuid, p_body text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_admin uuid:=(select auth.uid());v_body text:=pg_catalog.btrim(p_body);v_id uuid;
begin
 if v_admin is null or not public.meta_admin_access() then
  raise exception 'Not authorized' using errcode='42501';
 end if;
 if v_body is null or pg_catalog.length(v_body) not between 1 and 3000 then
  raise exception 'Invalid message length';
 end if;
 if not exists(select 1 from public.meta_support_threads where user_id=p_user) then
  raise exception 'Conversation does not exist';
 end if;
 insert into public.meta_support_messages(user_id,sender_id,body) values (p_user,v_admin,v_body)
 returning id into v_id;
 update public.meta_support_threads set updated_at=now() where user_id=p_user;
 return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.meta_admin_set_enrollment(p_user uuid, p_course text, p_enabled boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_admin uuid:=(select auth.uid());v_current boolean;
begin
 if v_admin is null or not public.meta_admin_access() then
  raise exception 'Not authorized' using errcode='42501';
 end if;
 if p_user is null or p_course is null or p_enabled is null
  or not exists(select 1 from auth.users where id=p_user)
  or not exists(select 1 from public.courses where slug=p_course) then
  raise exception 'Unknown user or course';
 end if;
 select exists(select 1 from public.course_enrollments where user_id=p_user and course_slug=p_course)
 into v_current;
 if v_current=p_enabled then return false;end if;
 if p_enabled then
  insert into public.course_enrollments(user_id,course_slug) values(p_user,p_course)
  on conflict(user_id,course_slug) do nothing;
 else
  delete from public.course_enrollments where user_id=p_user and course_slug=p_course;
  -- Do NOT delete the student's completed lessons, drafts, test attempts or chat.
 end if;
 insert into meta_internal.enrollment_audit(admin_id,user_id,course_slug,action)
 values(v_admin,p_user,p_course,case when p_enabled then 'assign' else 'revoke' end);
 return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.meta_submit_interest(p_name text, p_email text, p_course text, p_message text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_name text:=pg_catalog.btrim(p_name);
 v_email text:=pg_catalog.lower(pg_catalog.btrim(p_email));
 v_message text:=pg_catalog.btrim(p_message);
begin
 if v_name is null or pg_catalog.length(v_name) not between 2 and 100
  or v_email is null or pg_catalog.length(v_email) not between 5 and 200
  or v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  or p_course not in ('ielts','arabic','quran','flutter','other')
  or v_message is null or pg_catalog.length(v_message) not between 3 and 2000 then
  raise exception 'Invalid contact request';
 end if;
 if (select count(*) from public.meta_interest_requests
     where email=v_email and created_at>now()-interval '1 hour')>=2
   or (select count(*) from public.meta_interest_requests
     where created_at>now()-interval '1 day')>=150 then
  raise exception 'Contact form temporarily rate limited';
 end if;
 insert into public.meta_interest_requests(full_name,email,course_interest,message)
 values (v_name,v_email,p_course,v_message);
 return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.meta_support_send(p_body text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=(select auth.uid());v_body text:=pg_catalog.btrim(p_body);v_id uuid;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501';end if;
 if v_body is null or pg_catalog.length(v_body) not between 1 and 3000 then
  raise exception 'Message must have 1 to 3000 characters';
 end if;
 if (select count(*) from public.meta_support_messages
     where sender_id=v_user and created_at>now()-interval '1 hour')>=15 then
  raise exception 'Message rate limit reached';
 end if;
 insert into public.meta_support_threads(user_id) values(v_user) on conflict (user_id) do nothing;
 insert into public.meta_support_messages(user_id,sender_id,body)
 values(v_user,v_user,v_body) returning id into v_id;
 update public.meta_support_threads set updated_at=now() where user_id=v_user;
 return v_id;
end;
$function$;

revoke all on function public.meta_submit_interest(text,text,text,text) from public,anon,authenticated;
grant execute on function public.meta_submit_interest(text,text,text,text) to anon,authenticated;
revoke all on function public.meta_support_send(text) from public,anon,authenticated;
grant execute on function public.meta_support_send(text) to authenticated;
revoke all on function public.meta_admin_reply(uuid,text) from public,anon,authenticated;
grant execute on function public.meta_admin_reply(uuid,text) to authenticated;
revoke all on function public.meta_admin_set_enrollment(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.meta_admin_set_enrollment(uuid,text,boolean) to authenticated;
