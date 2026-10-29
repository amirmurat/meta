-- Prepared schema for the Meta learning backend.
-- Apply only to a NEW dedicated Supabase project; no data is migrated here.
-- Public GitHub Pages may use the publishable key, NEVER a secret/service_role key.

create table if not exists public.courses (
  slug text primary key,
  title text not null,
  unit_type text not null check (unit_type in ('task', 'ayah')),
  total_units integer not null check (total_units > 0)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null references public.courses(slug) on delete cascade,
  external_id text not null,
  title text not null,
  task_text text,
  sort_order integer not null default 0,
  unique (course_slug, external_id)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null references public.courses(slug) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_course_order_idx
  on public.lessons (course_slug, sort_order);
create index if not exists lesson_progress_user_idx
  on public.lesson_progress (user_id);
create index if not exists notes_user_course_idx
  on public.notes (user_id, course_slug);

insert into public.courses (slug, title, unit_type, total_units)
values
  ('ielts', 'IELTS', 'task', 332),
  ('flutter', 'Flutter', 'task', 56),
  ('quran', 'Коран', 'ayah', 6236)
on conflict (slug) do nothing;

-- Catalog is readable by signed-in users, editable only from admin/server.
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.notes enable row level security;

-- Defaults on new Supabase projects can grant more permissions than intended.
-- Revoke privileges for BOTH browser roles before granting the exact minimum.
revoke all on table public.courses, public.lessons,
  public.lesson_progress, public.notes from anon, authenticated;
grant select on table public.courses, public.lessons to authenticated;
-- Task-based progress is written by trusted server-side validation only.
-- Browser-side completion is permitted for Quran ayahs, which have no tasks.
grant select, insert, delete on table public.lesson_progress to authenticated;
grant select, insert, update, delete on table public.notes to authenticated;

create policy "signed_in_users_read_courses"
  on public.courses for select to authenticated using (true);
create policy "signed_in_users_read_lessons"
  on public.lessons for select to authenticated using (true);

create policy "users_read_own_progress"
  on public.lesson_progress for select to authenticated
  using ((select auth.uid()) = user_id);
-- Do not trust client-side IELTS/Flutter completion:
-- the application must validate their exercises on the server first.
create policy "users_insert_own_quran_progress"
  on public.lesson_progress for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.lessons l
      where l.id = lesson_id and l.course_slug = 'quran'
    )
  );
create policy "users_delete_own_quran_progress"
  on public.lesson_progress for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.lessons l
      where l.id = lesson_id and l.course_slug = 'quran'
    )
  );

create policy "users_read_own_notes"
  on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users_insert_own_notes"
  on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users_update_own_notes"
  on public.notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users_delete_own_notes"
  on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);
