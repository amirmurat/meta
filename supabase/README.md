# Meta learning backend

Live Supabase project: Meta (ref: munmvexfrtqwmwptafkf).
Frontend: https://amirmurat.github.io/meta/

## Deployed

- Four Postgres tables: courses, lessons, lesson_progress, notes.
- All tables use Row Level Security (RLS).
- Course names and educational lesson material are publicly readable.
- Private progress and notes require an authenticated owner.
- All 56 Flutter micro-lessons are populated from Amir's specialist Flutter course materials in Google Drive.
- Each Flutter lesson has theory, an example, a unique practice task, and measurable self-check criteria.
- Task formats: 34 code, 13 practical reports, and 9 written explanations.

## Frontend

- Module list: https://amirmurat.github.io/meta/flutter.html
- Individual page: https://amirmurat.github.io/meta/flutter-lesson.html?id=U06
- Each lesson has a distinct deep link with the same shared page template.
- Learner responses and notes are drafts stored in localStorage only (per browser/device).
- The text editor does not compile or execute code. DartPad and a local IDE are recommended for actual runs.
- Self-check is NOT trusted grading. It does not change server progress.

## Important boundaries

- The 16/56 completion display is a confirmed historical snapshot from Amir's canonical Flutter START HERE, not imported database completion records.
- The 21:00 monitoring automation still checks Google Drive and updates homepage counters. It does not update Supabase.
- Do not copy personal journals, private source code, or credentials into the public catalog.
- Only Supabase publishable keys belong in browser code, never secret/service role keys.
- Task evaluation and durable cloud notes require later authentication and a trusted assessment service.
- schema.sql is the original baseline and may be behind the deployed schema. Always inspect the live project and its migrations before relying on or reapplying it.
