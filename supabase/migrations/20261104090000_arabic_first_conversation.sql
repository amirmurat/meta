-- First authored MSA conversation path. Existing users and courses are untouched.
begin;
-- A distinct completion method is required so rehearsal cannot be mistaken for
-- the existing IELTS/Flutter self_ai_review workflow. Preserve all old values.
alter table public.lesson_progress drop constraint lesson_progress_verification_method_check;
alter table public.lesson_progress add constraint lesson_progress_verification_method_check
  check (verification_method in ('manual_quran','self_ai_review','historical_import','self_practice'));
insert into public.courses (slug,title,title_en,unit_type,total_units)
values ('arabic','Арабский язык (MSA)','Arabic (MSA)','task',5)
on conflict (slug) do update set title=excluded.title,title_en=excluded.title_en,total_units=excluded.total_units;

insert into public.lessons (course_slug,external_id,title,title_en,sort_order,task_type)
values
 ('arabic','AR.01.01','Поздороваться и ответить','Greet and respond',1,'practical'),
 ('arabic','AR.01.02','Назвать имя и спросить имя','Give and ask a name',2,'practical'),
 ('arabic','AR.01.03','Сказать, откуда ты','Say where you are from',3,'practical'),
 ('arabic','AR.01.04','Объяснить, что учишь арабский','Say you are learning Arabic',4,'practical'),
 ('arabic','AR.01.05','Провести первое знакомство','Hold a first introduction',5,'practical')
on conflict (course_slug,external_id) do update set
 title=excluded.title,title_en=excluded.title_en,sort_order=excluded.sort_order,task_type=excluded.task_type;

-- Only a signed-in learner enrolled in Arabic may record a rehearsed lesson.
-- This does not claim independent verification of spoken Arabic.
create or replace function public.meta_complete_arabic_lesson(p_lesson_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
 if v_user is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if not exists (select 1 from public.lessons l join public.course_enrollments e
   on e.course_slug=l.course_slug and e.user_id=v_user
   where l.id=p_lesson_id and l.course_slug='arabic') then
   raise exception 'Arabic lesson access required' using errcode='42501';
 end if;
 if not exists (select 1 from public.lesson_attempts a
   where a.user_id=v_user and a.lesson_id=p_lesson_id
   and length(trim(a.answer_text))>=12) then
   raise exception 'Save a practice answer first' using errcode='22023';
 end if;
 insert into public.lesson_progress(user_id,lesson_id,verification_method)
 values(v_user,p_lesson_id,'self_practice') on conflict (user_id,lesson_id) do nothing;
end $$;
revoke all on function public.meta_complete_arabic_lesson(uuid) from public, anon;
grant execute on function public.meta_complete_arabic_lesson(uuid) to authenticated;
commit;
