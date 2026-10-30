# IELTS Assessment Engine — implementation and next phases
Updated 2026-10-30. Scope: Meta website, GitHub repo amirmurat/meta, Supabase project munmvexfrtqwmwptafkf.

## Implemented in this release

- Original Academic Reading Practice Test 1: 3 newly authored passages, 40 original questions and a 60-minute wall-clock timer. The text spans approximately 2,313 words; 14 + 13 + 13 items per passage. Types included: multiple choice, TRUE/FALSE/NOT GIVEN, selecting paragraph headings and limited short answers. Missing answers score zero.
- Question bank and context are original practice material, **not official IELTS questions**, and the test is **not professionally calibrated**. Do not publish an IELTS band estimate. Raw score out of 40 and per-skill correct/total are valid only for this set. A 40-question count and official passage length alone do not prove realistic test difficulty or equivalence.
- Results save to existing user-private `assessment_attempts` table using stable `assessment_key` and `version=1`. A local draft and start timestamp enable interruption recovery without resetting the timer. No new database tables needed. Original answers are shown after submission only.
- Six diagnostic skill categories link to existing micro-lessons in the 332-lesson IELTS catalogue: detailed evidence, paraphrase, inference, TFNG, paragraph headings, short answers. Priority is sorted by error rate for this specific sample, with caution about uneven sample sizes.
- Seven-day *suggested* learning plan maps weaker skills to practice days, repeats at spaced intervals and links to official practice sources for independent tasks. The plan is derived from stored answers, not a separately persisted timetable, and should not automatically write into the user's Planner.
- After reload, recent private test history and recommendations from the latest compatible attempt are available. Repeating the identical bank **does not** demonstrate independent progress. When editing question content after real attempts exist, increment the immutable bank version and preserve the old evaluator.

## Not implemented yet / not ready to claim

- Full Listening mock: requires four parts, 40 items, *newly recorded or licensed* audio, proper playback constraints, transcripts, answer keys, question tagging and timed scoring.
- Academic Writing mock: requires one Task 1 with original chart/process/map/table and one Task 2 essay (60 min); word counts, reliable drafts, rubric feedback and explicit uncertainty about AI judgements. The official assessment weights Task 2 twice as heavily. No automated official band.
- Full Speaking: implement as a separate optional practice with browser microphone consent, MediaRecorder, Part 1 interview, Part 2 topic card and preparation timer, Part 3 discussion. Store recordings privately with per-user permissions and clear retention/deletion rules, and provide transcription. Pronunciation/fluency must be assessed from **audio**, not only a transcript; LLM-only numeric predictions are experimental, not certified scores. Real IELTS speaking is assessed in a human interview.
- Additional independent Reading banks for reliable pre/post tests; editorial review for ambiguity, question difficulty, exact answer evidence, spelling/word limits, accessibility and mobile/authenticated QA.
- Coverage of all official Reading task styles: Yes/No/Not Given, matching information/features/endings, summary/note/table/flow chart and diagram completion, multiple-response items, etc. This first practice set covers only some styles.
- Browser/device testing of a 60-minute interrupted attempt and a truly sent/saved result; code and content static checks do not replace this.

## Rights and content sourcing

**Free to access is not the same as free to copy, redistribute or bulk import.** Do not scrape, republish or embed entire official IELTS, British Council, IDP or Cambridge question banks without a licence or explicit permission. Do not disguise copied exam questions through superficial rewording. Provide external links to official sample experiences and create/commission independently original equivalent-style questions. Respect audio, image and transcript rights separately.

Official and widely available samples:

- IELTS official Academic sample questions: https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test
- British Council Academic Reading practice: https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/academic/reading
- IDP free sample tests: https://ielts.idp.com/prepare/article-free-practice-tests

Official format and rubric:
- Reading: https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading
- Listening: https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening
- Writing: https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing
- Speaking: https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking

## Technical scoring safeguards and future analytics

Record per-question question_type, skill_id, answer, difficulty/version, passage_id, time spent, omitted answer, correct answer, explanation and immutable source rights. Do not infer skill mastery from one or two responses. Under-sampled skills should be marked "uncertain"; compare across *independent* equivalent practice forms and track change in both accuracy and time. Aggregate sections only when their measures are comparable. Prioritise skills and learning prerequisites (not the surface topic of an essay or passage), then schedule short targeted lessons and new practice. Allow a learner to accept/change the schedule; do not change a personal calendar automatically.

For future commercial release, run rights audit, assessment editorial validation, per-user isolation tests, consent and privacy review, and language/UX QA. IELTS is a trademark; Meta is not affiliated with IELTS owners.
