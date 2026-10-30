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
