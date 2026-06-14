# CT Social Graph Agent Framework

This repo is a private, social-driven CT tracking dashboard. It is not project-first; it is people/network-first.

## Canonical data

- `data/accounts.json` is the canonical account registry.
- `data/interactions.json` is the canonical interaction/evidence log.
- `data/posts.json` stores notable authored posts/themes from tracked accounts.
- `data/candidates.json` stores discovered accounts/projects that may become Tier 2.
- `docs/data/*.json` should mirror the canonical data for the static dashboard.

## Account rules

- Tier 1 accounts are user-supplied seeds.
- All newly added accounts/projects start as Tier 2.
- Every added node must have `kind: individual` or `kind: project`.
- Do not add accounts from shallow banter, memes, generic price calls, engagement farming, or low-context replies.
- Add/log accounts when a tracked account has a thoughtful/substantive reply, quote, or interaction with them.

## Deep trader profile layer

The dashboard should become a people/network-first taste map, not a tweet archive.

Add and maintain these optional-but-preferred files when doing deeper scans:

- `data/account-profiles.json` — one synthesized profile per Tier 1 account covering likes, dislikes/fades, projects mentioned, respected people, style, and open questions.
- `data/theme-map.json` — cross-account narrative/theme map showing consensus, disagreement, momentum, and evidence.
- `docs/data/account-profiles.json` and `docs/data/theme-map.json` mirror the canonical files.

Initial deep-search target: compile at least the last 30 days of evidence for each Tier 1 account. Store concise synthesis plus evidence URLs; do not store every tweet.

Current dashboard priority: visibility first, not abstraction.

For now, present the information close to the underlying X evidence so a user who already reads Twitter daily can see the same information in a clearer structure:

1. Chronological evidence feed by account/date.
2. Per-account recent evidence stream.
3. Project/people mention list with source posts.
4. Interaction evidence log for replies/quotes/mentions.
5. Light theme buckets with direct examples.
6. Open questions / uncertain reads.

Do not overfit into heatmaps, graphs, or contrarian maps yet. Those can come later after enough clean evidence accumulates.

## Scan workflow

1. Load `data/accounts.json`.
2. For Tier 1 accounts, use X search to inspect recent authored posts, replies, quotes, and visible interactions.
3. When a Tier 1 account thoughtfully replies to or quotes someone, add an interaction record with `from`, `to`, `to_kind`, `type`, `date`, `url`, `summary`, and `quality`.
4. If the interacted-with account is worth following, add it to `data/accounts.json` as `tier: 2`, `kind: individual` or `project`, `status: tracked`, and a short reason.
5. Add notable authored posts/themes to `data/posts.json` when useful for understanding what the network is talking about.
6. For profile scans, update `data/account-profiles.json` and `data/theme-map.json` with likes, dislikes/fades, repeated project mentions, respected people, style, and cross-account themes.
7. Copy canonical data to `docs/data/`, validate JSON, inspect diffs, commit, and push.
8. Dashboard only at first: do not send Discord alerts unless the user explicitly changes this.

## Output policy

Routine cron output should be concise: accounts scanned, new interactions, new Tier 2 additions, notable topics, and commit SHA if changed.
