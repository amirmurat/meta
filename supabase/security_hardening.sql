-- Re-apply least privilege on the deployed Meta project.
revoke all on table public.courses, public.lessons,
  public.lesson_progress, public.notes from anon, authenticated;

grant select on table public.courses, public.lessons to authenticated;
grant select, insert, delete on table public.lesson_progress to authenticated;
grant select, insert, update, delete on table public.notes to authenticated;