# Meta IELTS — assessment expansion (2026-10-30)

## Shipped / proposed for release

The Meta IELTS course now links to:

- `reading-mock.html`: existing original 40-item Reading practice; raw score and skill-based weekly priorities.
- `listening-practice.html`: original 4-part, 40-item browser-generated synthetic-speech listening lab (10 questions per part). Browser Web Speech API, **not** authentic recorded speech, accents, pacing, genuine exam difficulty or official IELTS band. One playback per part is best-effort local state, **not** tamper-proof proctoring.
- `writing-mock.html`: original Academic Writing Task 1 (fictional Northport table) and Task 2 essay prompt, shared 60-minute timer, word counts, local draft, user-private immutable submissions, objective checks and rubric checklist. No AI grading, examiner score, or IELTS band.
- `ielts-dashboard.html`: personal Reading/Listening raw scores, Writing word counts, weak-skill ranking and proposed 7-day plan with existing micro-lesson links.

## Data and privacy

- A separate Supabase `public.ielts_writing_attempts` table was created by migration `ielts_writing_attempts_private_submissions` and source SQL is tracked under `supabase/migrations/20261030062000_ielts_writing_attempts_private_submissions.sql`.
- RLS on; `SELECT` owner-only, `INSERT` owner-only and enrolled in IELTS, no user update/delete. Personal essays up to 12,000 / 20,000 characters. No audio recordings uploaded or persisted.
- Reading and Listening only use existing `assessment_attempts` RLS/private history. Dashboard reads user-scoped rows. Source bank versions must remain immutable after actual test attempts exist.
- Local drafts (essays, listening answers, start times) are saved in browser `localStorage`. This is **not encrypted at rest by Meta**, and anyone with the same browser profile may be able to view it. In UI, advise users not to enter sensitive information. Device/browser loss can lose unsent drafts. For clients, introduce server-side draft synchronization with user controls and deletion.

## Assessments and honesty

- Listening synthetic voices may be absent, unsupported, robotic or platform-mediated; manual QA across Chrome/Edge/iOS required. Real IELTS recordings use natural accents and are heard once; this lab does not simulate accents or speaking pace faithfully.
- Listening item types here are multiple choice only; future versions need matching, form/note completion, sentence and short answer, map labeling, actual copyrighted-or-original **recorded** sound. Do not call this a genuine mock until audio and difficulty have been checked.
- Writing Task 1/2 format and word guidance follow IELTS (150+ / 250+ words, Task 2 weighted twice as heavily by real examiners). Meta does not assign scores without appropriately reviewed marking. Task response/achievement, coherence, lexical resource, grammar need qualified human review or clearly experimental audio/text feedback.
- Analytics rank latest relevant skill error rates but are provisional. Categories have differing numbers of questions; one single test never proves skill mastery. Use independent additional test forms, confidence estimates and reviewed item-level tagging before claiming validated diagnosis.
- Plan is **not** written to user's Google Calendar or personal Planner. Users decide which proposed lessons to study.
- Do not scrape, mirror or redistribute free IELTS/British Council/IDP/Cambridge mock questions without license. Original content and verified external official resource links only.

## QA and verification

- Static JavaScript syntax checks, DOM ID checks, 4 × 10 Listening inventory, exact answer index checks, original Reading bank unchanged.
- Supabase table owner RLS and grants verification; security advisor warns that leaked-password protection remains off (pre-existing).
- **Live authenticated 60-minute timer, browser speech playback, mobile UX and multi-user negative RLS testing have not been completed**. These are required before commercial release.

## Next engineering work

1. Record/license true human-spoken 4-part audio and design a realistic diversity of item types; independently edit questions and verify transcripts.
2. Independent Reading/Listening test versions to assess real learning progress.
3. Writing assessment by qualified reviewers, explicitly differentiated from word-count checks.
4. Optional Speaking voice recording (Part 1/2/3) only after consent, deletion/retention rules, private audio storage and careful, non-certified feedback. Do not give numeric band score from transcript alone.

## Official format references
- https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening
- https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing
- https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test
