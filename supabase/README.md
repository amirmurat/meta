# Meta platform — backend and account status

Supabase project: munmvexfrtqwmwptafkf (Frankfurt).
Public frontend: https://amirmurat.github.io/meta/
Repository: https://github.com/amirmurat/meta

## Live database
- courses, lessons, lesson_progress, notes
- profiles (one per Supabase Auth user)
- lesson_attempts (one attempt draft per user and lesson)
- RLS enabled on all six public tables
- each profile, attempt, note, and completion is private to its authenticated owner
- course catalog and lessons are private to explicitly enrolled accounts; no guest access

## Accounts
- account.html: email/password registration, sign-in/out, email reset link
- profile.html: private name, username, learning goal, and bio
- meta-supabase.js: pinned Supabase JS client (2.102.0), browser publishable key only
- email confirmation and password reset redirects require Supabase Auth URL Configuration:
  Site URL: https://amirmurat.github.io/meta/
  Additional Redirect URL: https://amirmurat.github.io/meta/account.html
- Do NOT disable email confirmation for public use merely to skip configuring redirects.
- The built-in email service is rate limited. Configure a trusted custom SMTP provider before inviting many people.
- Frontend sign-up/password-reset flows have NOT been end-to-end tested with a real email and a login.

## Per-user Flutter learning
- index.html: login-first dashboard; only courses assigned via private course_enrollments are shown, no hardcoded Amir study blocks
- flutter.html: protected 7 module bars, 56 lesson links, green lessons and counts from signed-in enrolled user's own completion records
- flutter-lesson.html?id=U06: lesson theory, sample, task, typed answer, self-check, notes
- flutter-lesson-app.js: cloud autosave for registered users, browser-only drafts for guests
- User can copy an AI-review request with task, answer and criteria, paste it into ChatGPT, and then attest:
  (a) reviewed with AI, and (b) meets the criteria
- A self-attested completion is identified by verification_method='self_ai_review'. This is NOT an automatic AI judgment and does NOT run Dart, Flutter, SQL, or tests.
- Flutter code must still be run/tested in the user's IDE, DartPad or a suitable test environment.
- For a future automated evaluator, build an authenticated server-side assessment service and do not expose API secrets to GitHub Pages.

## Private course assignment
- `course_enrollments(user_id, course_slug)` is created by a trusted administrator, not self-service. Login does not enroll someone automatically.
- Currently there are no Auth users or course assignments; after Amir registers his own Meta account, explicitly link it to `ielts`, `flutter`, and `quran` only after verifying account ownership.
- Friends and relatives see an empty personal dashboard and can enter their own learning goal in Profile; a personalized curriculum builder is not yet implemented.
- Direct Flutter URLs and Supabase Data API lessons require both authentication and assigned enrollment.
- The 21:00 progress monitoring automation is retained in read-only form and must NOT overwrite login-first index.html or assign courses without owner confirmation.

## Personal progress and source-of-truth caveat
- The original confirmed Amir Flutter checkpoint is 16/56 (D01-D12 and U02-U05), held in Amir's canonical Google Drive Flutter START HERE.
- These old completions have NOT been assigned to an app account yet. A fresh account begins with zero and must be reconciled and migrated deliberately, only for Amir.
- IELTS and Quran browser learning experiences are not built yet.
- The existing nightly 21:00 automation still adjusts static homepage values based on Drive. A signed-in user's homepage counters use Supabase and override static values.

## Future platform expansion
Each user should own goals, preferences, attempts, notes and progress. Shared educational course material can be reused as a template. Custom AI-generated courses for relatives/friends should be a separate, reviewable, authenticated workflow; it is not implemented yet.

## Production safety
- Do not commit secret/service_role keys. Browser receives a publishable key only.
- Keep RLS policies under review; security advisor was clean after schema migration.
- Implement data export/deletion, rate limits, error monitoring, verified email delivery and account recovery before large-scale release.
- The original supabase/schema.sql is a historical baseline; do not reapply to this live project. Use the live migration history and current schema.

## Historical progress and statistics

- Historical study evidence is stored ONLY in authenticated, private rows, not committed to this public repository.
- All three courses are assigned via course_enrollments. There is a one-profile, three-enrollment safety guard in the separate, user-delivered SQL import file.
- The restored baseline is expected to be IELTS 3, Flutter 16 and Quran 39. The historical import must be run by the project owner in the Supabase SQL Editor and verified; it has NOT been run by ChatGPT.
- lesson_progress.achieved_on is DATE; date_accuracy distinguishes exact_day from on_or_before_day and unknown. verified_on records the source evidence/checkpoint date, not necessarily submission. imported_at records when the legacy row was migrated.
- lesson_attempts.submitted_at is set only by an explicit "Зафиксировать сдачу ответа" action, not autosave. ai_review_confirmed_at records the user's own AI-review confirmation.
- learning_sessions stores source-confirmed start and end times separately from submission and achievement. An Oct 9 Quran study session at 05:30–06:00 Asia/Almaty is staged in the manual import as one verified session, not 2:38 completion.
- statistics.html displays assigned course progress, actual recorded submission counts, review confirmations, confirmed study minutes and exact-date learning history. Approximate/bound-only dates are not plotted as exact events.
- The 21:00 monitor only reviews canonical Drive milestones; it must never overwrite the login-first homepage or create speculative progress in Supabase.

## Account security

Supabase security advisor currently reports leaked-password protection disabled. Check the Supabase Auth password security settings and enable where available before public signup at scale.

## IELTS Academic course (2026-10-30)
- 332 leaf-level skill records imported from Amir's IELTS Academic competency tree (not official IELTS scoring descriptors); 71 Listening / 76 Reading / 103 Writing / 82 Speaking.
- Full private module browser: `ielts.html` with expandable four-level skill tree and completion bars; unique lesson links at `ielts-lesson.html?id=A.1.1.2.1`.
- Every lesson has a short author-generated explanation, example, task and three criterion-based self-checks. These are teaching drafts adapted from the skill names, NOT 332 authentic IELTS test questions or independently examiner-validated lesson plans.
- For Listening and Reading the answer task uses authentic external material. For Speaking learners should make an actual spoken recording outside the site; transcript alone cannot validate pronunciation. No audio upload, automatic listening check, band score or browser audio player is implemented.
- Existing 3 IELTS historical completions have retained their original UUIDs and dates. No personal IELTS source documents are linked in the course catalog.
- New attempts, notes, explicit submission times and self-attested AI reviews use the same private Supabase tables and RLS as Flutter.
- An official preparation source (not a claim of affiliation): https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test

## Site-wide bilingual experience (RU/EN)

- One shared language switch in `meta-language.js` is included on every Meta HTML page: homepage, account, profile, statistics, IELTS/Flutter catalogs and individual lessons.
- Selection persists in browser localStorage using `meta-language` and survives page navigation. English is the default for new browsers to match the English-only IELTS practice preference.
- Course titles use `courses.title_en`; lesson names use `lessons.title_en`; lesson bodies use `lessons.lesson_content_en` when EN is selected.
- 332 IELTS and 56 Flutter lesson records have translated titles, explanations, examples, tasks, prerequisite text and criteria. IELTS module titles are translated via English ancestor metadata. Russian originals are retained.
- Quran's existing 39 completion placeholder records have English titles (`Al-Baqarah 2:n`); there are no actual full verse lessons or translations of scripture in the database yet. Do not present this as an English Quran translation.
- Translations are an initial machine-assisted educational localization. Preserve technical code syntax and review instructions before using material as a graded exam.
- Lesson IDs, per-user notes, attempts, timestamps and progress are language-independent. A language change must not create new completion records.
- No external translation API key is present in the browser. The translation staging sheet in Amir's Google Drive was deleted after successful import.
