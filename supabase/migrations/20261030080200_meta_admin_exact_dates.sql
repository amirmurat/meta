-- Updated original RPC; prevents historical fallback dates from appearing as daily events.
CREATE OR REPLACE FUNCTION public.meta_admin_report(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_start date;
 v_end date;
 v_report jsonb;
begin
 if not public.meta_admin_access() then
  raise exception 'Not authorized to view Meta administration statistics' using errcode='42501';
 end if;
 if p_days not in (7,30,90,365) then
  raise exception 'Unsupported statistics period';
 end if;
 v_end := (now() at time zone 'Asia/Almaty')::date;
 v_start := v_end - (p_days-1);
 with events as (
  select p.user_id,case
    when p.date_accuracy='exact_day' then p.achieved_on
    when p.verification_method<>'historical_import' then (p.completed_at at time zone 'Asia/Almaty')::date
    else null::date end as day,'completion'::text as kind,l.course_slug,0::integer as minutes
  from public.lesson_progress p join public.lessons l on l.id=p.lesson_id
  where p.date_accuracy='exact_day'
     or (p.verification_method<>'historical_import' and p.completed_at is not null)
  union all
  select user_id,(submitted_at at time zone 'Asia/Almaty')::date,'submission',null::text,0
  from public.lesson_attempts where submitted_at is not null
  union all
  select user_id,(submitted_at at time zone 'Asia/Almaty')::date,'assessment',course_slug,0
  from public.assessment_attempts
  union all
  select user_id,(submitted_at at time zone 'Asia/Almaty')::date,'writing','ielts',0
  from public.ielts_writing_attempts
  union all
  select user_id,session_date,'session',course_slug,coalesce(minutes,0)
  from public.learning_sessions
 ),
 bounded as (select * from events where day between v_start and v_end),
 daily as (
  select d::date as day,
    (select count(*) from auth.users u where (u.created_at at time zone 'Asia/Almaty')::date=d::date) as signups,
    (select count(*) from bounded e where e.day=d::date and kind='completion') as completions,
    (select count(*) from bounded e where e.day=d::date and kind='submission') as submissions,
    (select count(*) from bounded e where e.day=d::date and kind='assessment') as assessments,
    (select count(*) from bounded e where e.day=d::date and kind='writing') as writing,
    (select count(distinct user_id) from bounded e where e.day=d::date) as active_learners,
    (select coalesce(sum(minutes),0) from bounded e where e.day=d::date and kind='session') as minutes
  from generate_series(v_start,v_end,interval '1 day') d
 )
 select pg_catalog.jsonb_build_object(
  'days',p_days,'start_date',v_start,'end_date',v_end,'timezone','Asia/Almaty',
  'overview',pg_catalog.jsonb_build_object(
   'registered',(select count(*) from auth.users),
   'confirmed',(select count(*) from auth.users where email_confirmed_at is not null),
   'new_users',(select count(*) from auth.users where (created_at at time zone 'Asia/Almaty')::date between v_start and v_end),
   'recent_signins',(select count(*) from auth.users where (last_sign_in_at at time zone 'Asia/Almaty')::date between v_start and v_end),
   'active_learners',(select count(distinct user_id) from bounded),
   'enrollments',(select count(*) from public.course_enrollments),
   'completions_total',(select count(*) from public.lesson_progress),
   'completions_period',(select count(*) from bounded where kind='completion'),
   'submissions_period',(select count(*) from bounded where kind='submission'),
   'assessments_period',(select count(*) from bounded where kind='assessment'),
   'writing_period',(select count(*) from bounded where kind='writing'),
   'session_minutes_period',(select coalesce(sum(minutes),0) from bounded where kind='session'),
   'recorded_sessions_period',(select count(*) from bounded where kind='session'),
   'historical_imports',(select count(*) from public.lesson_progress where verification_method='historical_import'),
   'imprecise_dates',(select count(*) from public.lesson_progress where verification_method='historical_import' and date_accuracy<>'exact_day')
  ),
  'daily',(select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(d) order by d.day),'[]'::jsonb) from daily d),
  'courses',(select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'slug',c.slug,'title',c.title,'total_units',c.total_units,
    'learners',(select count(*) from public.course_enrollments e where e.course_slug=c.slug),
    'completions',(select count(*) from public.lesson_progress p join public.lessons l on l.id=p.lesson_id where l.course_slug=c.slug),
    'active_learners',(select count(distinct e.user_id) from bounded e where e.course_slug=c.slug),
    'assessments',(select count(*) from public.assessment_attempts a where a.course_slug=c.slug)
   ) order by c.slug),'[]'::jsonb) from public.courses c),
  'assessment_types',(select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'key',x.assessment_key,'course',x.course_slug,'attempts',x.attempts,'learners',x.learners,'last',x.last_at
   ) order by x.attempts desc),'[]'::jsonb)
   from (select assessment_key,course_slug,count(*) attempts,count(distinct user_id) learners,max(submitted_at) last_at
     from public.assessment_attempts group by assessment_key,course_slug) x),
  'learners',(
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id',u.id,'email',u.email,'name',coalesce(nullif(p.display_name,''),'—'),
      'registered',u.created_at,'confirmed',u.email_confirmed_at is not null,
      'last_signin',u.last_sign_in_at,
      'courses',(select coalesce(pg_catalog.jsonb_agg(e.course_slug order by e.course_slug),'[]'::jsonb) from public.course_enrollments e where e.user_id=u.id),
      'completed',(select count(*) from public.lesson_progress x where x.user_id=u.id),
      'submissions',(select count(*) from public.lesson_attempts x where x.user_id=u.id and x.submitted_at is not null),
      'assessments',(select count(*) from public.assessment_attempts x where x.user_id=u.id),
      'writing',(select count(*) from public.ielts_writing_attempts x where x.user_id=u.id),
      'active_days',(select count(distinct e.day) from bounded e where e.user_id=u.id),
      'last_activity',(select max(e.day) from events e where e.user_id=u.id)
    ) order by u.created_at desc),'[]'::jsonb)
    from auth.users u left join public.profiles p on p.id=u.id
  )
 ) into v_report;
 return v_report;
end;
$function$
