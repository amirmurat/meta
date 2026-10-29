# Meta learning backend

This directory contains the prepared, **not yet deployed** Supabase schema.

## Frontend

The existing GitHub Pages page stays at https://amirmurat.github.io/meta/.
No change to `index.html` is needed until a dedicated Supabase project exists.

## Planned data model

- `courses`: IELTS (332 micro-lessons), Flutter (56 micro-lessons), Quran (6236 ayahs).
- `lessons`: lesson content / tasks and Quran ayahs, to be imported from approved sources.
- `lesson_progress`: completion records for an authenticated user.
- `notes`: private notes linked to a course and optionally a lesson.

## Security

- Login will use Supabase Auth.
- Database Row Level Security (RLS) restricts progress and notes to their owner.
- Catalog reading requires login; catalog editing stays administrative.
- No private Google Drive document data has been copied.
- Never commit Supabase secret/service_role keys to this public repository.
- Use only a **publishable** key in a browser app.

## Next deployment step

1. Create a dedicated Supabase project in the account/organization selected by Amir.
2. Apply `schema.sql` **once** to that new project and test RLS.
3. Set up Auth and connect the publishable project URL/key to the frontend.
4. Only then implement lesson pages, task verification, manual Quran completion and notes.
5. Decide the source-of-truth synchronization policy before mirroring progress from Google Drive.

The existing daily 21:00 update automation still reads Drive and edits the static homepage; it is not a Supabase sync.
