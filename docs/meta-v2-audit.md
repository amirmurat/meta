# Meta v2: audit, implementation and release evidence

## Scope and confirmed findings

The baseline is `main` as cloned on 31 October 2026. All root HTML, JS and CSS files were inventoried and parsed where applicable. Existing IELTS, Flutter and Quran controllers, assessment banks, personal statistics, admin operations, localization, resume tracking and SQL contracts were inspected. No framework migration, dependency upgrade, database write, schema/Auth/RLS change, or tracking integration is included.

| Source evidence | Confirmed behavior before this PR | Change |
|---|---|---|
| `account.html: current → showSignedIn` | Existing sessions remain on an intermediate account screen | Home redirect, except password recovery; no login-form flash |
| `welcome.html: authenticatedUser` | Signed-in visitors only get one changed header link; signup flow remains | Redirect to Home; separate authenticated `about.html` |
| `account.html: safeDestination` | Origin and path checked, but account/welcome loops still accepted | Explicit in-app route allowlist; reject credentials, backslashes, external and protocol-relative targets |
| `index.html: renderResume` | Equal-weight continuation link for every course; completed last-opened lesson can be recommended again | One priority action; skip completed saved positions; IELTS first for a new account |
| Root page navigation markup | Each page independently chooses global links | Four shared sections, profile shortcut, separate admin disclosure after positive `meta_admin_access` RPC |
| `ielts.html: .ielts-guide` | Diagnostic instruction competes with first lesson | Start/continue first, optional diagnostics in a disclosure |
| `ielts-lesson-app.js: showTaskMode` | Entire editor toolbar hidden, including manual save | Preserve save/copy; hide only irrelevant DartPad link |
| `flutter-lesson-app.js: showTaskMode` | Same hidden save button on written/practical lessons | Same correction |
| Both lesson controllers: `updateButton` | Completion disabled with no list of missing requirements | Live checklist of missing actions; original gates retained and rechecked on click |
| Both lesson controllers: `completeLesson` | Success feedback distant from next-lesson action | Next link alongside confirmed save success |
| `support.html: lastSignature` | Initial empty array and empty signature compare equal; empty state never renders | Initial signature is `null` |
| Dashboard catch after enrollment load | Loading indicator already hidden when a later query fails | Re-show actionable error as an alert |

No claim that opening a lesson is completing it. Historical progress remains counted from the original records and historical date semantics remain unchanged. Course labels distinguish saved attempts, confirmed completion, no attempt, and unknown attempt state on request failure.

## Route map and target navigation

| Route | Access / purpose | Main navigation |
|---|---|---|
| `welcome.html` | Public introduction, promotion, interest form; signed-in → Home | Public |
| `account.html` | Login, signup, email confirmation, recovery; ready session → safe next or Home | Public / recovery |
| `index.html` or `./` | Assigned courses, one suggested next action, actual progress; guest → welcome | Home |
| `courses.html` | Same enrollment-aware catalog renderer, no competing continuation section | Courses |
| `about.html` | Product information without signup funnel | Shared + More |
| `privacy.html` | Public privacy information; shared chrome only when authenticated | Shared for sessions |
| `profile.html` | Optional profile information and assignments | Profile button |
| `support.html` | Private administrator conversation | Messages |
| `statistics.html` | Personal learning history, dates, tests | Progress |
| `ielts.html`, `flutter.html` | Course summary, start/continue, collapsed modules | Courses |
| `ielts-lesson.html?id=…`, `flutter-lesson.html?id=…` | Protected lesson, answer, criteria, review, save, next | Courses + contextual back |
| `quran.html?s=…&a=…` | Existing Quran reader and private research features | Courses |
| `assessment.html` | Optional Reading diagnostic | Courses + IELTS back |
| `ielts-dashboard.html` | IELTS priorities and recommendations | Courses + IELTS back |
| `reading-mock.html`, `listening-practice.html`, `writing-mock.html` | Existing practice tools, unchanged scoring semantics | Courses + contextual links |
| `admin-statistics.html`, `admin-operations.html` | Existing server-confirmed admin authorization and operations | Separate More menu |

Successful login and ready-session signup already used Home as default before this change: this PR does not misreport that as a previous profile redirect bug. Signup without a session shows an email-confirmation instruction without claiming successful login. Same-tab signup can retain a validated `next` in session storage; a new tab/device can safely fall back to Home. Configured Supabase callback URL is unchanged. Password recovery remains a separate event-driven screen.

First lesson after successful authentication: **one click from Home**. No required profile-completion detour. Desktop has one compact top navigation; below 768px the same four sections become bottom navigation. Page widths, bar heights and square corners remain owned by the existing pages. Header space is reserved during loading. RU/EN continue to use the existing language preference and reload behavior.

## Data and promotion protection

Read-only production metadata checks on 31 October confirmed:

- `ielts_open_week_20261030` enabled; registration trigger enabled (`O`).
- Expiry: `2026-11-06 20:33:24.686863` in `Asia/Almaty`, matching the existing frontend timestamp to millisecond precision.
- RLS enabled on enrollments, lessons, lesson progress, lesson attempts, notes, profiles and resume positions.
- No production rows were inserted, updated or deleted. No policy, role, trigger or migration changed.

The promotion still grants through the existing database trigger. The frontend neither assigns courses nor assumes a grant succeeded: it displays returned enrollments. Existing access survives campaign expiry as before.

## What existing analytics can actually show

| Question | Existing source | Limit |
|---|---|---|
| Registered | Auth registrations / admin report | Already available |
| Signed in | `last_sign_in_at` / admin report | Latest sign-in, not a complete login-event history |
| Opened first lesson | `course_resume_positions` | Only last position per course; cannot reconstruct everyone who previously opened lesson 1 |
| Saved an answer | `lesson_attempts`, keyed by learner and lesson | Current saved answer state, not every autosave event |
| Completed first lesson | `lesson_progress` joined to first lesson | Completion record; keep historical date accuracy |
| Returned | Existing dated learning events / active days | Learning return proxy; not exact visit retention |

Therefore an exact full onboarding funnel cannot be reconstructed from current snapshots alone. This PR does not invent missing numbers or add external analytics, device identifiers or new data collection. Existing admin metrics stay honest. Improving historical first-open/return measurement would require a separately justified data design.

## Verification and limits

Run `node tests/check.mjs` for parsing, duplicate DOM IDs, local links, safe redirect attacks and all completion gate combinations. Run `node tests/serve.mjs`, open `http://127.0.0.1:4173/`, and click **Run scenario checks** for the browser suite. The server replaces the Supabase module only under `/qa/<scenario>/`; no production API is used there. Fixtures are localhost-only and excluded from GitHub Pages by `_config.yml`.

The browser suite covers new, existing, historical and multi-course learners; guest and signed-in route rules; admin-menu visibility; empty enrollments; email-confirmation and password-recovery states; explicit answer save; completion gates; persistence and next-link success; network/save failures; sign-out; and English/Russian shared navigation and horizontal overflow at 375, 390, 768 and 1440 pixels. Full results and screenshots are recorded alongside this PR.

These are actual Chromium DOM/layout and interaction checks with isolated backend fixtures, **not** a real email-delivery or production-account E2E test. Real SMTP/PKCE callbacks on another device, enrolled Quran reader content, and full admin operational mutations have not been exercised against production. RLS metadata inspection is not an adversarial authenticated RLS test. No production accounts or artificial activity were created for testing.

Before merging, complete a controlled real-account signup/email callback and first-lesson save/completion smoke test in a non-production environment (or explicitly approved disposable account), and confirm Quran reader and admin report with real authorized sessions. Until those checks pass, treat the PR as a reviewable implementation, not a verified production rollout.

## Recorded QA result
On 31 October 2026, browser access was restored after restarting the desktop application. The full suite was rerun against implementation commit e9bf8bc, including the final SVG actions, focus spacing and dirty-state protection: **197 checks, 0 failures**. Static checks also passed: 21 HTML routes and 34 JS blocks/modules. Screenshots cover 375, 390, 768 and 1440px. The browser-access blocker is resolved; the real-account/email and full Quran/admin verification limits above remain.
