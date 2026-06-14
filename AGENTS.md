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

## Scan workflow

1. Load `data/accounts.json`.
2. For Tier 1 accounts, use X search to inspect recent authored posts, replies, quotes, and visible interactions.
3. When a Tier 1 account thoughtfully replies to or quotes someone, add an interaction record with `from`, `to`, `to_kind`, `type`, `date`, `url`, `summary`, and `quality`.
4. If the interacted-with account is worth following, add it to `data/accounts.json` as `tier: 2`, `kind: individual` or `project`, `status: tracked`, and a short reason.
5. Add notable authored posts/themes to `data/posts.json` when useful for understanding what the network is talking about.
6. Copy canonical data to `docs/data/`, validate JSON, inspect diffs, commit, and push.
7. Dashboard only at first: do not send Discord alerts unless the user explicitly changes this.

## Output policy

Routine cron output should be concise: accounts scanned, new interactions, new Tier 2 additions, notable topics, and commit SHA if changed.
