# CT Social Graph Deep Trader Backfill Plan

> **For Hermes:** Use this plan before expanding the dashboard beyond simple account/interactions lists.

**Goal:** Build a month-deep profile of each Tier 1 trader: what they like, what they avoid, what projects/narratives they repeatedly engage with, and how their taste propagates through CT.

**Architecture:** Keep the repo simple: canonical JSON under `data/`, mirrored JSON under `docs/data/`, static GitHub-style dashboard under `docs/`. Do one initial 30-day backfill, then let the 4h scan maintain a rolling history.

**Tech Stack:** X search, JSON files, static HTML/CSS/JS, git commits.

---

## North Star

This should not become a generic tweet archive. The product is a **taste map** of high-signal CT investors.

For every Tier 1 account, we want to answer:

1. What do they seem to like?
2. What do they seem to dislike / avoid / fade?
3. Which projects do they repeatedly mention or interact with?
4. Which people/projects do they treat as credible?
5. Which narratives are gaining or losing intensity across the group?
6. Where do high-signal accounts overlap before the broader market notices?

---

## Data model additions — minimal complexity

Create only two new canonical files at first:

```txt
data/account-profiles.json
data/theme-map.json
```

Mirror them to:

```txt
docs/data/account-profiles.json
docs/data/theme-map.json
```

### `account-profiles.json`

One object per Tier 1 account.

```json
{
  "handle": "coin_casanova",
  "period_start": "2026-05-14",
  "period_end": "2026-06-14",
  "profile_updated_at": "2026-06-14T03:46:59Z",
  "taste_summary": "Concise synthesis of what this account appears to value.",
  "likes": [
    {
      "theme": "example theme",
      "summary": "Why we think they like this.",
      "evidence_urls": [],
      "confidence": "low|medium|high"
    }
  ],
  "dislikes": [
    {
      "theme": "example theme",
      "summary": "What they criticize, avoid, or fade.",
      "evidence_urls": [],
      "confidence": "low|medium|high"
    }
  ],
  "projects_mentioned": [
    {
      "name": "Project",
      "handle": "ProjectHandleOrNull",
      "stance": "positive|negative|watching|neutral|unclear",
      "summary": "What they said or implied.",
      "evidence_urls": []
    }
  ],
  "people_respected": [
    {
      "handle": "other_handle",
      "why": "Repeated thoughtful replies, quotes, endorsement, disagreement-with-respect, etc.",
      "evidence_urls": []
    }
  ],
  "style": {
    "time_horizon": "short-term|medium-term|long-term|mixed|unclear",
    "risk_preference": "early/illiquid|liquid majors|infra|memetic|mixed|unclear",
    "research_style": "fundamental|onchain|narrative|technical|network-led|mixed|unclear"
  },
  "open_questions": []
}
```

### `theme-map.json`

Aggregated cross-account narrative map.

```json
{
  "period_start": "2026-05-14",
  "period_end": "2026-06-14",
  "themes": [
    {
      "theme": "AI agents / compute / DePIN",
      "accounts_positive": ["handle1"],
      "accounts_negative": [],
      "projects": [],
      "summary": "Cross-account synthesis.",
      "evidence_urls": [],
      "momentum": "emerging|rising|stable|cooling|unclear"
    }
  ]
}
```

---

## Initial 30-day deep-search process

For each Tier 1 account:

1. Search authored posts over the last 30 days.
2. Search replies and quote interactions visible through X search.
3. Pull out repeated projects, tickers, protocols, people, concepts, and negative comments.
4. Classify evidence into:
   - likes
   - dislikes/fades
   - projects mentioned
   - people respected
   - notable posts
   - interaction edges
5. Ignore:
   - pure price calls without reasoning
   - low-context memes
   - generic engagement farming
   - repeated reposts with no new view
6. Write a compact profile for each account.
7. Build a cross-account theme map.
8. Mirror JSON to `docs/data/`.
9. Validate JSON.
10. Commit and push.

---

## Dashboard display — visibility first, not abstraction

The user is already on Twitter every day and already knows the live discourse. The dashboard should not hide that information behind too much synthesis yet. The near-term goal is to show the same information in a cleaner, more persistent, easier-to-review format.

For now, prefer these direct views:

### 1. Chronological Evidence Feed

A simple feed of high-signal posts/interactions sorted by date.

Show:

- date
- source account
- post/interaction type
- project/person/theme mentioned
- short note
- direct X URL
- why it was logged

### 2. Per-Account Evidence Stream

One page/section per Tier 1 trader showing what was observed in the last 30 days.

Show the raw-ish record first:

- notable posts
- thoughtful replies/quotes
- repeated people/projects mentioned
- explicit positive/negative statements
- open uncertainty

Keep synthesis short and clearly labeled as interpretation.

### 3. Mention Ledger

A table/list of projects, tickers, people, and protocols mentioned by the tracked accounts.

Show:

- mentioned entity
- who mentioned it
- count / rough recurrence
- stance if explicit
- source links

This is useful without becoming a heatmap yet.

### 4. Interaction Evidence Log

A direct list of meaningful replies, quotes, and conversations.

Show:

- from account
- to account/project
- interaction type
- context
- source URL
- whether it created a Tier 2 candidate

### 5. Light Theme Buckets

Loose buckets like AI infra, TAO/Bittensor, DePIN, agents, robotics, consumer crypto, perps, etc.

Each bucket should show example evidence, not just a derived score.

### 6. Open Questions / Needs Review

A list of ambiguous signals that need human review:

- unclear stance
- repeated mentions with no explicit take
- possible sarcasm
- accounts/projects that might be Tier 2 but need more evidence

Future abstract views — heatmaps, graphs, contrarian maps, narrative drift — are explicitly deferred until the raw evidence layer is useful.
---

## Display philosophy

Make the page feel like a **clean research tape** rather than a tweet list or over-abstracted intelligence product.

Design principles:

- evidence is always one click away
- raw evidence first, synthesis second
- show uncertainty instead of fake precision
- highlight changes over time
- preserve isolated mentions when they may become important later
- avoid noisy metrics unless they help decision-making

---

## Implementation tasks

### Task 1: Add profile/theme JSON files

Create empty canonical and mirrored files:

```txt
data/account-profiles.json
data/theme-map.json
docs/data/account-profiles.json
docs/data/theme-map.json
```

### Task 2: Update dashboard loader

Modify `docs/app.js` to load the two new data files while tolerating them being empty.

### Task 3: Add simple visibility sections

Modify `docs/index.html`, `docs/style.css`, and `docs/app.js` only enough to show direct evidence-oriented sections:

1. Chronological evidence feed
2. Per-account evidence stream
3. Mention ledger
4. Interaction evidence log
5. Light theme buckets
6. Open questions / needs review

Do not build heatmaps, graph visualizations, or contrarian maps yet.

### Task 4: Run initial 30-day backfill

Use X search in batches across the 9 Tier 1 accounts. Save only synthesis + evidence URLs, not every tweet.

### Task 5: Update recurring cron prompt

After the initial backfill, update the 4h cron to maintain the profile/theme files incrementally.

### Task 6: Validate and commit

Run:

```bash
python3 -m json.tool data/account-profiles.json >/dev/null
python3 -m json.tool data/theme-map.json >/dev/null
python3 -m json.tool docs/data/account-profiles.json >/dev/null
python3 -m json.tool docs/data/theme-map.json >/dev/null
git status --short
```

Commit only real changes.

---

## Recommendation

Do the initial 30-day backfill into a direct evidence layer first. Keep abstraction low: evidence feed, per-account streams, mention ledger, interactions, light buckets, and open questions. More futuristic views can come later once the raw evidence layer is actually useful.
