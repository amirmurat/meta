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
- course catalog (only educational materials) readable by visitors

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
- flutter.html: 7 module bars, 56 lesson links, green lessons and counts from signed-in user's own completion records
- flutter-lesson.html?id=U06: lesson theory, sample, task, typed answer, self-check, notes
- flutter-lesson-app.js: cloud autosave for registered users, browser-only drafts for guests
- User can copy an AI-review request with task, answer and criteria, paste it into ChatGPT, and then attest:
  (a) reviewed with AI, and (b) meets the criteria
- A self-attested completion is identified by verification_method='self_ai_review'. This is NOT an automatic AI judgment and does NOT run Dart, Flutter, SQL, or tests.
- Flutter code must still be run/tested in the user's IDE, DartPad or a suitable test environment.
- For a future automated evaluator, build an authenticated server-side assessment service and do not expose API secrets to GitHub Pages.

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
