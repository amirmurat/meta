-- IELTS Academic Writing practice: immutable essays, accessible only to their author.
create table if not exists public.ielts_writing_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 version text not null default '1' check (char_length(version) between 1 and 30),
 task1 text not null check (char_length(task1) <= 12000),
 task2 text not null check (char_length(task2) <= 20000),
 word_count_1 integer not null check (word_count_1 between 0 and 5000),
 word_count_2 integer not null check (word_count_2 between 0 and 7000),
 duration_seconds integer not null check (duration_seconds between 0 and 7200),
 submitted_at timestamptz not null default now()
);
alter table public.ielts_writing_attempts enable row level security;
grant select, insert on public.ielts_writing_attempts to authenticated;
create policy "Writing attempts: owner read" on public.ielts_writing_attempts
 for select to authenticated using ((select auth.uid()) = user_id);
create policy "Writing attempts: enrolled owner insert" on public.ielts_writing_attempts
 for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.course_enrollments e
   where e.user_id=(select auth.uid()) and e.course_slug='ielts')
 );
create index if not exists ielts_writing_attempts_user_date_idx
 on public.ielts_writing_attempts(user_id,submitted_at desc);
