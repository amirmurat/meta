# Meta — comprehensive personal and admin analytics

Updated: 2026-10-30. Code: `statistics.html`, `statistics-app.js`, `admin-statistics.html`, `admin-statistics-app.js`, `analytics-ui.css`.

## Personal dashboard (all signed-in users)

- Account-scoped queries only, under existing Supabase RLS. Stable pagination (1,000 rows per page, capped at 20,000 per source; errors rather than silently truncating).
- KPI overview for 7/30/90/365 days: saved completions, actual dated completions in period, active days, streaks, assignment submissions, AI reviews confirmed by user, tests, writing submissions, measured study time, sessions, note count, enrolled courses.
- Course completion against actual `courses.total_units`; IELTS section detail uses all 332 lesson records, Flutter groups use all 56 lessons. Quran surah counts are completed only (no misleading denominator from sparse loaded records).
- 13-week activity calendar, daily/weekly/monthly event chart, test raw-score history, recent Writing word-count history, timeline of up to 120 actual dated events, data precision metrics and client CSV export.
- Source rules: `lesson_progress` historical imports are included in overall completion counts, but only verified exact dates or newly created Meta completion timestamps become activity days. A bound `on_or_before_day` is not treated as a day of achievement. `learning_sessions.minutes` counts recorded completed session time; unknown/unrecorded time is not estimated.
- A test score is calculated only for the matching original bank key and version; no IELTS band is fabricated, no independent learning gain is assumed from repeating a test.
- Personal CSV export is local to the browser, not uploaded to another service.

## Admin dashboard

- The verified owner Meta Auth user is granted access by a record in **private**, revoked `meta_internal.admin_accounts`; authorization is not based on user-editable `user_metadata`, `profiles` or a browser flag.
- `public.meta_admin_access()` checks `auth.uid()` in a SECURITY DEFINER read of the private table. `public.meta_admin_report(p_days)` checks authorization **before reading any cross-account rows** and returns JSON for 7/30/90/365 days. Both functions revoke access from `PUBLIC` and `anon`, grant execute only to `authenticated`. Every RPC is server-enforced.
- Metrics: registered accounts, confirmed emails, period signups, Auth last sign-ins, active learners by actually recorded learning events, enrollments, total and period completions, lesson submissions, assessment submissions, Writing, recorded study sessions and duration.
- Breakdown: time series, activation steps, per-period activity frequency, per-course uptake, historical attempts by assessment key, roster with confirmed status, courses, last Auth sign-in, aggregate submissions and active days, searchable/filterable roster and on-device CSV.
- No raw answers, essays, personal notes or private calendar, health or financial information are returned by the admin RPC.
- A learner's `active_days` denotes distinct days **with saved learning events**, not page visits. Aggregating daily active users across weeks/months produces **user-days**, not distinct users; chart copy labels this explicitly.
- No page-views, clicks, paid subscriptions, revenue, purchases or actual daily session durations are invented. Those require future privacy review and separate instrumentation.

## Security validation

- Performed an explicit authorized simulation using Meta owner's confirmed Auth UID; `meta_admin_access=true` and RPC returned expected 7/30/365 daily rows.
- Performed an unauthorized simulation for a different registered account under `SET LOCAL ROLE authenticated`; access check returned `false`, and calling the privileged report raised PostgreSQL 42501.
- `meta_internal.admin_accounts` has RLS on and no policies, intentionally deny-all for normal database roles. The SECURITY DEFINER functions are intentionally callable by authenticated roles but internally authorize using the private table and the JWT user's UUID. These warnings are expected from the Supabase security advisor and were reviewed; changes must retain denial tests.
- Existing security advisor warning: leaked-password protection disabled. This predates analytics: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Limits and next validation

- Static JS syntax and DOM ID checks are necessary but **not** authenticated browser/device QA. Check 2 accounts with different privileges, 7/30/90/365 filtering, CSV injection safety, large account histories and mobile layout before commercial release.
- Tests show product actions are recorded, not that they were independently graded. Learning streaks should not become a high-stakes measure.
- Make small-purpose releases for changes to admin membership, RLS and report SQL; never grant admin via editable profiles.
- Personal UI wording currently primarily Russian in the new analytics sections; a complete EN translation pass is still required for parity with site language preferences.

## Related sources

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Existing Meta IELTS roadmap: `docs/ielts-assessment-roadmap.md` and `docs/ielts-assessments-expansion.md`.
