# Arabic MSA: first conversation release

The immediate outcome is a short spoken introduction, not CIMA preparation. The first usable path has five authored lessons: greeting, name, origin, learning Arabic, and a combined exchange. Each lesson includes phrases, a worked dialogue, an original prompt requiring the learner's own response, written answer storage, personal notes, and an explicit record of spoken rehearsal. Meta does not record or assess speech. Completion means the learner saved an answer and attested to practicing aloud; it is not a language score.

The [recursive skill tree](arabic-speaking-tree.json) maps the wider course goal to 16 contexts, five conversational beats in each context, and four kinds of evidence for each beat: listening, production, follow-up, recovery. These 320 leaves are an authoring plan. The 15 contexts after introductions are shown as planned, with no fabricated lessons or completions. Original audio and review by a qualified Arabic speaker are prerequisites before listening or pronunciation assessment is published.

The beginner-first approach is consistent with [Al Jazeera Learning Arabic's advice](https://learning.aljazeera.net/es/node/21866) to learn reusable greeting and introduction patterns and practice speaking. Phrases in the first release are short MSA examples authored for Meta, not copied dialogues. Formal CIMA alignment is a later track.

## Deployment

1. Review and run `supabase/migrations/20261104090000_arabic_first_conversation.sql` in the existing Supabase project. It inserts one course and five lessons, plus an enrollment-checked completion function. The one necessary schema change extends the existing `verification_method` check with `self_practice`: reusing `self_ai_review` would mislabel a rehearsal as AI reviewed. Existing values stay valid. The migration does not alter Auth, RLS policies, existing course assignments, or historical progress.
2. Deploy the static files to GitHub Pages.
3. An administrator can assign `arabic` to a learner through existing course management. The catalog keeps “Request” for accounts without access. Do not call it live until both migration and static deploy succeed.

The five frontend lessons are intentionally keyed to the five migration lesson IDs. If the frontend is deployed before the migration, Arabic remains a catalog preview. If a learner is enrolled but the lesson rows are missing, the course shows a visible loading error rather than invented content.
