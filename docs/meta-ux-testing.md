# Meta UX and Testing Engine — implementation status

## Purpose and boundary
Meta is a learner-centred platform for personalised recursive courses. The learning cycle is
**diagnostic test → identify weak skills → practise targeted lessons → reassess on independent items**.
Existing IELTS, Flutter and **free** Quran Study remain distinct learning domains. Amir's possible paid business is the service of interviewing, diagnosing and assembling personal learning programmes; Quran Study remains free.

## Shipped: first UI foundation and diagnostic (2026-10-30)

- `meta-ui.css`: **classic design correction**. Amir prefers the original black-and-white, square-corner, minimal Meta UI. A first styling pass imposed blue accents, rounded cards, shadows, new page widths and smaller progress bars, and was rejected. CSS v2 restores the original page geometry and visual hierarchy and only makes unobtrusive consistency changes. The new IELTS diagnostic uses the same old minimal vocabulary. Later UX adjustments should target only inconsistent alignment, spacing, ordering or sizes without changing visual language.
- \`assessment.html\` is the first on-site testing interface, linked prominently from \`ielts.html\`.
- \`assessment-bank.js\`: 12 **original** non-copyrighted sample items over 3 short authored passages, four Reading skills (detail, paraphrase, inference, Not Given), each mapped to a real existing IELTS micro-lesson.
- \`assessment-app.js\`: auth and enrolment guard; accessible question inputs and validation; skill analysis, per-question rationale, internal lesson links, per-account private attempt history; local unsent draft recovery.
- \`assessment_attempts\` RLS table: immutable submitted date, versioned JSON answers, per-user SELECT, enrolment-checked INSERT and owner DELETE; no public read, no API key in browser. Score is derived from the versioned authored answer key for **informal training feedback**, not accepted as certified/proctored test evidence.
- Russian and English interface labels. Passages and questions remain in English because they test IELTS reading skills.
- Test **is not** official IELTS Academic Reading mock, not calibrated as an IELTS band score, and does not assess Listening, Speaking or Writing. The exact same bank is used for now, so repeat results are practice only and cannot demonstrate independent improvement.

## Explicit limitations / next steps

1. Perform authenticated cross-browser and mobile visual QA on all 9 pages, fix overflow, interactive sizing and navigation hierarchy. GitHub Actions deployment success is necessary but not a substitute for user-authenticated testing.
2. Add additional **independent authored/appropriately licensed** question sets, calibrated and tagged by skills, for genuine pre-/post-comparisons. Introduce passage-level timing, persisted study recommendations, and spaced review; compare only like-for-like assessment formats.
3. Build a configurable reusable assessment bank and scoring engine for IELTS sections, then SAT and Kazakhstan's ЕНТ with separate question types, scoring and rules. Never confuse in-house estimates with official exams.
4. Protect minors' personal data, verify Kazakhstan localisation/retention requirements and the current Supabase region before onboarding commercial clients. Current Meta Supabase project is in \`eu-central-1\`, which requires legal/data architecture review.
5. A later profile theme reward can reuse UI tokens, but should follow verified learning goals (not clicks). A meaningful certificate must state that it is Meta's own programme completion and never an externally accredited qualification unless authorised.
6. Product piloting at an **experimental** 5,000 KZT price requires a tightly scoped personalised programme and a small user sample, not unlimited custom curriculum work.

## Test checks performed
- JS syntax checked; all assessment UI IDs referenced by the controller exist; exactly 12 unique question IDs with 3 per tested skill, 4 mapped course lessons confirmed.
- DB migration succeeded. Authenticated enrolled-user INSERT/SELECT test succeeded inside a rolled-back transaction. Anonymous SELECT has no table privilege; RLS is on.
- No historical Flutter/IELTS/Quran lesson progress was rewritten. No artificial assessment attempts were persisted.
- Supabase project security advisor notes leaked-password protection is not enabled. This issue predates the new assessment feature and must be considered before external public rollout.

## Classic UX consistency pass — 2026-10-30

- Retained the original minimalist black/white Meta visual language and existing page widths. **No new visual redesign, rounded cards, blue palette or shadows.**
- IELTS course overview: moved the first not-yet-completed micro-lesson link to just below the heading, before the long hierarchy; changed label to simple "Continue learning" (EN/RU). The hierarchy and original test entry remain.
- Flutter course overview: added the same first not-yet-completed lesson shortcut in the same position. Both use existing enrolled-user `lesson_progress` without marking anything completed.
- Harmonised back-navigation wording for Flutter with IELTS, and English/Russian labels for course summary/module headings where available.
- Shared `meta-ui.css?v=3` changes only top-level IELTS module spacing/track to align with the Flutter module controls. Nested IELTS skills retain their smaller density; original course/page visual identity is preserved.
- Checked JS syntax of both course listings and checked that both next-lesson links resolve through the existing lesson route. Full signed-in device/browser visual QA still pending.

## Control geometry pass — 2026-10-30

- Fixed a reported distorted EN/RU language switcher on Profile. Root cause: the floating language control had an explicit 31px height but *did not reset padding*, inheriting large page-level button padding (e.g., Profile `button{padding:12px 18px}`). Changed the shared `meta-language.js` component to fixed 40×34px flat controls with zero padding, centred text, explicit box sizing and safe-area-aware offset. Applies across every page, without changing the classic monochrome visual design or language persistence.
- Account: tab modes now reserve the same 2px bottom-border space whether active or inactive; no vertical jitter during switching.
- Quran Study: fixed an erroneous mobile selector (`.nav-top` instead of `nav.top`), allowing the header links to wrap at ≤760px.
- IELTS skills diagnostic: skill-result rows now wrap rather than squashing long multilingual titles and study links on narrow devices.
- Verified all 10 HTML pages, both inline and externally loaded JavaScript, static DOM ID references and duplicate IDs by source checks. **Browser-based signed-in pixel/layout QA remains pending.** GitHub Pages caches can delay publication of the common language script; refresh the browser when checking.
