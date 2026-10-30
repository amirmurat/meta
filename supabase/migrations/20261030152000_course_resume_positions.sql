create table if not exists public.course_resume_positions (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null references public.courses(slug) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  visited_at timestamptz not null default now(),
  primary key (user_id,course_slug)
);
alter table public.course_resume_positions enable row level security;
revoke all on table public.course_resume_positions from public, anon;
grant select, insert, update, delete on public.course_resume_positions to authenticated;

create policy "Learners read own resume positions"
 on public.course_resume_positions for select to authenticated
 using ((select auth.uid())=user_id);

create policy "Learners record only enrolled course positions"
 on public.course_resume_positions for insert to authenticated
 with check (
  user_id=(select auth.uid())
  and exists(select 1 from public.course_enrollments e
   where e.user_id=(select auth.uid()) and e.course_slug=course_resume_positions.course_slug)
  and exists(select 1 from public.lessons l
   where l.id=course_resume_positions.lesson_id
   and l.course_slug=course_resume_positions.course_slug)
 );

create policy "Learners update only their enrolled course positions"
 on public.course_resume_positions for update to authenticated
 using (user_id=(select auth.uid()))
 with check (
  user_id=(select auth.uid())
  and exists(select 1 from public.course_enrollments e
   where e.user_id=(select auth.uid()) and e.course_slug=course_resume_positions.course_slug)
  and exists(select 1 from public.lessons l
   where l.id=course_resume_positions.lesson_id
   and l.course_slug=course_resume_positions.course_slug)
 );

create policy "Learners can reset their own resume positions"
 on public.course_resume_positions for delete to authenticated
 using (user_id=(select auth.uid()));
