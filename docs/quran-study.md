# Quran Study in Meta — first web implementation (2026-10-30)

## Intent and separation

Quran Study is Amir's personal in-depth reading and lexical research inside Meta. It is not a replacement for the separate mobile `amirmurat/quran-app`, which belongs to a distinct father-first product concept. The existing Quran App architecture informed the nested tags model only; no source code or private tag taxonomy was copied from that repository, and it was not modified.

Canonical learning history remains Amir's `Quran Study — Journal` in his Google Drive until an explicit migration/synchronization agreement changes that. The Quran App's canonical product state stays in `01 — Состояние Quran App`.

## Working user flow

- Authenticated course enrollment is required. Go from Meta's private dashboard to `quran.html`, with optional deep links `?s=2&a=40`.
- Browse the 114 surahs / 6236 verses, navigate to the previous or next verse, and view the text in the QuranBench reading API.
- Select any token for morphological segmentation, Arabic root, lemma, part of speech, grammatical features, QAC gloss, and external citations.
- Read Pickthall's English translation (public domain) or the Russian Rowwad translation from QuranEnc, with original translator and provider identified. The full Russian footnotes are rendered unchanged when the API makes them available.
- Click Quran.com, Quranic Arabic Corpus, QuranBench, and original tafsir pages at King Saud University. Lexical analysis does not constitute a contextual interpretation or a religious verdict.
- Create, rename, move, and delete custom tags with unlimited hierarchy depth; a verse may have many tags, and a parent topic collects all references under descendants. Related verses display brief original-text excerpts for comparison.
- Save private questions, analysis and citation links per ayah, without copying them into the public educational catalog.
- Mark study as completed intentionally, recording the real local study date. Previously imported Quran completions (`historical_import`) are protected from accidental removal.
- Start and end study sessions manually to create verifiable timestamps and duration. Leaving a tab open does not count as study time.

## Data and authoritative sources

- **Arabic:** QuranBench public API, Quranic text from Tanzil Uthmani 1.1; source is verbatim, published with attribution and a link to Tanzil. QuranBench corpus used for implementation is 0.8.0 at time of verification.
- **Morphology:** Leeds Quranic Arabic Corpus through QuranBench's versioned API. QAC derivative content is credited and carries GPL licensing. The original word morphology data, not model-generated morphology, is rendered.
- **English meaning:** Marmaduke Pickthall, 1930 (public domain) via QuranBench; shown as a translation of meaning, not as the Arabic Quran itself.
- **Russian meaning:** Rowwad Translation Center through QuranEnc (`russian_rwwad`), with author/source and provider footnotes retained. The Quran App previously recorded Rowwad v1.0.1 dated 2026-03-29, but the web API's current version should be rechecked before claiming it is still the newest.
- **Tafsir:** primary links to At-Tabari, Ibn Kathir and As-Sa'di at quran.ksu.edu.sa; these are links, not locally republished text.
- **Lexical follow-up:** Quranic Arabic Corpus, QuranBench roots and Lane's Lexicon (linked externally).

Source reference documents:
- https://tanzil.net/docs/Text_License
- https://quranbench.com/api
- https://quranenc.com/ar/home/api/
- https://corpus.quran.com/
- https://quran.ksu.edu.sa/

## Backend and privacy

Supabase project `munmvexfrtqwmwptafkf`:
- Existing `lessons` contains precisely 6236 Quran verse identities as well as IELTS/Flutter course identities. Identifiers are `surah:ayah`; initial progress of 39 retained.
- `quran_tags`: per-user hierarchical tags, composite foreign key prevents cross-account parenting, unique sibling names, trigger rejects ancestry cycles.
- `quran_ayah_tags`: per-user many-to-many relationships between tags and verse identities.
- `quran_research_notes`: one private research record per user and verse, including questions, analysis and sources.
- `lesson_progress`: existing course-independent completion history, Quran's established manual completion policy.
- `learning_sessions`: timestamps and duration of explicitly started and ended sessions.
- RLS enabled on all three new Quran tables, with no anonymous SQL access. Existing personal table policies stay intact.

## Current limitations

- Full Arabic script and word morphology depend on QuranBench's read-only cross-origin API; Russian translation depends on QuranEnc. If a provider fails, show a failure/source link and never invent Arabic or interpretive text. There is no offline bundled Quran data in the Meta website; local-first offline Quran App remains a separate project.
- The tool is a study reader, not a certified tafsir or religious ruling engine. Word glosses are not one-to-one final interpretations. Public sources must be opened before concluding a contested question.
- Tags and research notes sync by Supabase account, but Quran App's SQLite tags are not automatically shared with Meta and father's private tag taxonomy was not imported.
- No religious content has been generated into a mass lesson bank. All 6236 `lessons` rows are **stable verse IDs**, not fabricated lesson explanations.
- The public web and database structure were checked, with a successful transactional RLS write/read smoke test; a full end-to-end signed-in browser test remains to be performed.
- The service depends on the cited external providers' published APIs and availability. Provider CORS behavior in the actual GitHub Pages browser should be verified.

## Verified checkpoint

- 114 surah metadata records and chapter verse counts sum to 6236 (Hafs/Kufan numbering).
- Meta Quran catalog: 6236; Flutter: 56; IELTS: 332.
- Personal Quran historical completions: 39; Flutter: 16; IELTS: 3.
- Transactional test successfully inserted, linked and read private nested tags and a research note as an authenticated enrolled user, then rolled back the test data.
- No modification was made to `amirmurat/quran-app`.

## Russian word-level meanings and morphology (2026-10-30)

- The Arabic word, root, lemma, segmented morphemes and English gloss are cited to the Leeds Quranic Arabic Corpus via QuranBench. QAC does not supply independently verified Russian word glosses in this integration.
- The Russian UI localizes grammatical labels and codes such as `N`, `ACC`, `F`, `stem`, `suffix`; these are Meta's translations of linguistic terminology, **not religious translations from QAC**.
- A narrowly sourced contextual Russian phrase for verse **2:40:4** (`نِعْمَتِىَ`) is taken from the Rowwad Translation Center's QuranEnc *verse* translation: `Моё благодеяние`. It is labeled contextual and explicitly not treated as an independent Arabic–Russian lexicon entry.
- Other tokens clearly say that a separately verified Russian word gloss is not yet available, rather than silently auto-translating QAC's English gloss or misattributing an AI translation.
- Quran Foundation announced removal of Russian word-by-word translation from its API at the rightsholder's request: https://qf-api-docs.pages.dev/docs/updates/ . Do not copy or republish the removed dataset without permission.
- For scaling, source-licensed, independently reviewable per-word glosses will be needed, with explicit distinction between lexical possibilities, grammatical form, contextual translator choice and classical tafsir. Preserve an English source gloss where licensed and avoid automatic theological translation.

## Current completion work — 2026-10-30

- Added the owner-protected `quran_word_research` table: per-user, per-verse, per-token notes for contextual Russian meaning, alternative lexical senses, source title, HTTPS source URL, type of source, and updated timestamp. Existing sourced QAC word gloss is not overwritten.
- Quran word panel now allows editing/deleting these private interpretations; titles clearly distinguish learner research from officially sourced morphology.
- Authenticated insert/read smoke test succeeded for token 4 of 2:40 inside a ROLLBACK transaction; no permanent test record or completion was created.
- Prepared the owner-private `quran_study_archive` table to retain journal snapshots with date, origin document and source line. Automatic bulk import of the Quran Study Journal was **blocked**, and the table currently contains **zero** entries. The Google Drive Journal remains authoritative; never represent this as a completed migration.
- Source links to named classical tafsirs and Lane's Lexicon remain primary-source links because the rights to bulk republish full interpretive text have not been confirmed. Do not present them as in-app licensed reproductions.
- Commercial warning: the Quranic Arabic Corpus FAQ explicitly limits its distributed morphological research data to noncommercial research. Before reselling Quran Study with QAC-derived material, obtain adequate permission or replace the integration with commercially licensed equivalents. https://corpus.quran.com/faq.jsp
- Front-end syntax and database RLS write permissions were checked, but a real signed-in browser workflow has not been end-to-end validated on the user's device.

## Quran Study product and archive boundary (confirmed 2026-10-30)

- Quran Study access and Quran-specific learning resources in Meta are **free**. Amir's possible paid offering is a separate service: interviewing a client, diagnosing learning needs, and creating a bespoke recursive study course (e.g., Arabic language certificate preparation). Do not represent Quran access as a paid course, tier, or subscription.
- The `quran_study_archive` database now supports private, per-verse user-managed historical entries with a known/unknown original study date and kind; `source_document` keeps the original Google Drive Journal link. Original journal remains canonical and is not deleted or overwritten.
- An on-page **Previous studies** section supports reading, selective copy/paste import, and deletion of imported copies. Import does not update `lesson_progress` or fabricate dates/times.
- Direct mass import of private journal content was blocked by the connected data access workflow. Archive count remains zero until the user imports selected entries, or a separately authorized migration succeeds. Do not call the archive complete.
- Primary tafsir and dictionary texts remain at their attributed sites, not copied wholesale. Users can add an original source URL to their personal research with a one-click citation action; they should explain how it supports a claim before saving.
- Word-level Russian meanings remain **personal sourced research** unless independently verified and appropriately licensed. The QAC English corpus gloss is retained with attribution and never rebranded as a verified Russian dictionary translation.
- The manual archive editor and policies were tested transactionally as a signed-in course-enrolled user; the test transaction was rolled back, leaving real history and completion records unchanged.
