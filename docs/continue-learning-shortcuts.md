# Meta: Continue Learning shortcuts

Released 2026-10-30.

## Behaviour

- The homepage displays a **Продолжить обучение / Continue learning** section above course cards, with one direct link per enrolled course (Flutter, IELTS, Quran).
- When the learner has opened a micro-lesson or Quran verse, the exact lesson/verse is saved for that course and shown as **Последняя открытая тема / Last opened**.
- Positions are stored per user in Supabase `public.course_resume_positions`, not in a global browser preference, and therefore work across signed-in devices.
- Until a position has been recorded by the new code, the homepage offers the first unmarked lesson in the course. This is explicitly labelled **Следующий неотмеченный / Next unmarked**, not a last-opened position. For Quran, the first 400 verses are inspected for an unmarked fallback; this is a suggestion, not proof of study progress.
- If no target can be resolved, the shortcut opens the course start page. The ordinary course cards and progress counters remain unchanged.
- The link to the Quran is `quran.html?s=<surah>&a=<ayah>`, while Flutter and IELTS use the verified course-specific lesson external ID.
- Position tracking occurs only after the authenticated student has opened a valid visible lesson or Quran verse with verified source content. It is separate from marked completion and does **not** record study time or add a completion event. Quick navigation updates are serialized per course.

## Security

- PK `(user_id,course_slug)` and FKs to `auth.users`, `courses`, `lessons`.
- RLS is enabled; anonymous role has no privileges. Authenticated users can read/change only their own positions.
- INSERT/UPDATE require an active user, enrollment in the named course and a lesson belonging to that same course.
- Verification included owner INSERT/UPSERT inside rolled-back transaction, cross-user SELECT returning zero rows, non-enrolled course INSERT denied with 42501, mismatched course/lesson INSERT denied with 42501. No test positions were retained.

## Tests

- JS syntax checks on homepage and three lesson apps; HTML target ID check; deep link tests for Flutter, IELTS, Quran and invalid Quran ID.
- Full authenticated multi-device and mobile browser QA remain necessary. Opening any lesson after publishing will create a resume position; the homepage can then be used as an exact bookmark.
