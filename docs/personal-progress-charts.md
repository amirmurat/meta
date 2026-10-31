# Personal progress charts

The previous first section repeated the assigned course cards from Home and Courses, including navigation to each course. The Progress page now answers two different questions:

- **How much was confirmed complete in each assigned course?** One comparison chart shows completed lessons against each course total across all time. Historical imported marks count here, as they did in the previous total. The heading says completed lessons rather than mastery or a knowledge score.
- **What happened in the selected period?** The daily chart and 13-week calendar remain. A new chart breaks recorded events down into lesson completions, submitted answers, tests, Writing, confirmed reviews and recorded learning sessions. Types with no recorded events are omitted. If the period has no dated events, all activity charts stay hidden and the existing empty explanation is shown.

The event breakdown uses the existing personal tables and date logic in `statistics-app.js`. Page opens and unsent drafts do not become events. No external analytics, schema, permission or RLS changes were needed.

Verification: `node tests/check.mjs` passed. Isolated browser QA passed 319 checks with no failures, including historical progress and a completion with an exact timestamp. Mobile visual inspection at 390 px confirmed the comparison chart and navigation layout.
