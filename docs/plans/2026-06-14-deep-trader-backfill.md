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

## Dashboard views — minimum 5, preferably 6

### 1. Trader Dossier View

A profile card for each Tier 1 account:

- taste summary
- top likes
- top dislikes/fades
- preferred time horizon
- research style
- repeated project mentions
- respected people/projects
- open questions

This is the main “who is this person as an investor?” view.

### 2. Narrative Heatmap

Rows = themes/narratives.
Columns = Tier 1 accounts.
Cells = positive / negative / watching / unclear.

Use this to spot:

- crowded consensus
- early cluster formation
- narratives one account likes before others catch up
- narratives multiple accounts fade

### 3. Project Affinity Matrix

Rows = projects/tickers.
Columns = accounts.
Cells = stance + evidence count.

Useful for answering:

- “Who among our best accounts has noticed this project?”
- “Is this project liked by one person or by a cluster?”
- “Is attention broadening or isolated?”

### 4. Interaction Graph

Network view:

- Tier 1 accounts as large nodes
- Tier 2 people/projects as smaller nodes
- edge thickness = interaction quality/frequency
- edge color = reply / quote / mention / endorsement / disagreement

The goal is not social graph vanity; it is finding **who introduces signal into the network**.

### 5. Taste Overlap / Contrarian Map

Pairwise comparison of accounts:

- overlapping likes
- shared fades
- divergent takes
- accounts that consistently discover different corners of CT

This is the “portfolio construction of brains” view: who gives redundant signal vs orthogonal signal.

### 6. Timeline / Narrative Drift View

Rolling timeline of when themes/projects first appear and whether they intensify or fade.

This helps answer:

- “Is this theme actually accelerating?”
- “Who was early?”
- “Did attention persist after the first tweet?”

---

## Display philosophy

Make the page feel like a **Bloomberg terminal for taste** rather than a tweet list.

Design principles:

- evidence is always one click away
- synthesis first, raw posts second
- show uncertainty instead of fake precision
- highlight changes over time
- prioritize clusters over isolated mentions
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

### Task 3: Add view tabs

Modify `docs/index.html`, `docs/style.css`, and `docs/app.js` to support at least five views:

1. Dossiers
2. Narrative Heatmap
3. Project Affinity
4. Interaction Graph
5. Contrarian Map
6. Timeline

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

Build the new display layer before trying to ingest too much data. The data we collect should be shaped by the questions the dashboard must answer. Start with the six views above, then do the initial 30-day backfill into that structure.
