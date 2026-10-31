# Meta v2 follow-up: navigation, course identity and progress

## Confirmed issues

- The shared CSS explicitly changed the RU/EN control to `position: static` after sign-in, so it moved with page content outside the landing page.
- Opening More changed its flex item to an absolutely positioned panel and changed the header padding. The main links shifted. The menu did not close after clicking elsewhere.
- The administrator's learner conversations lived in Manage access, while the main Messages page showed only the administrator's personal chat.
- Personal statistics placed 13 metrics ahead of course progress. Empty activity charts took space without explaining the absence of dated events. The course panels used the same monochrome treatment.
- The landing page led with ready-made programs instead of Meta's custom-course service. Home and Courses displayed almost the same assigned-course list. The landing header wrapped awkwardly at mobile widths.

## Changes

- Keep RU/EN fixed on private pages, above the mobile navigation. More keeps its place in the header, opens a separate anchored panel, and closes on outside click or Escape.
- Give IELTS, Flutter and Quran Study distinct restrained blue, teal and ochre accents on course cards and course pages. Counts and labels remain visible without relying on color.
- Put assigned course progress first on the statistics page, with direct links to the next unfinished IELTS/Flutter lesson. Show four useful figures first: completed units, learning days, submitted tasks and notes. Keep other metrics and detailed history in disclosures. Empty dated activity has an explicit explanation instead of an empty chart.
- Put the authorized administrator's learner inbox in Messages, with searchable conversations and replies. Manage access links there. The inbox is shown only after a positive `meta_admin_access` response and continues using the existing `meta_support_threads`, `meta_support_messages` and `meta_admin_reply` permissions. No RLS, table or role change was made.
- Version the shared CSS and JS URLs used by the changed pages so GitHub Pages does not mix a newly published menu with stale cached styles or translation code.
- Lead the landing page with a request for a custom course built with a recursive learning approach. Explain iteration from real progress and team-assisted promotion, and state that the service is free for now. The existing interest form sends these requests as `other`, a value already allowed by its RPC. No new backend capability is claimed.
- Keep Home focused on the first or next lesson, with a route to all courses. Courses now focuses on assigned programs and a request path for another topic.
- Use a burger labeled Menu in narrow private headers and on the mobile landing. Both menus close outside and on Escape. The private bottom navigation remains the main route at phone widths.

There is no inferred unread count, fabricated completion, new analytics identifier or external tracker. Historical marks without an exact date still contribute to total progress without becoming daily activity.

## Verification

- `node tests/check.mjs`: passed; 21 HTML routes, 34 JS blocks/modules, internal links, duplicate IDs and completion gates.
- Isolated Chromium QA: **316 checks, 0 failures** across RU/EN, 375/390/768/1440 px, navigation, Home/Courses separation, custom-course landing, admin visibility and reply, progress, save/completion, and errors. The backend fixture is localhost-only.
- Visual inspection: admin Messages at 390 px and 375 px; statistics with three assigned courses at desktop and 390 px; mobile landing and its open menu at 390 px; Courses at 390 px. No production messages or course data were changed for this follow-up.
