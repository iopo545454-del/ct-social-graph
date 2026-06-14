# CT Social Graph

Private social-first dashboard for tracking a core circle of CT accounts, their thoughtful interactions, and the accounts/projects that emerge from those interactions.

## Model

- **Tier 1**: user-supplied seed accounts.
- **Tier 2**: accounts/projects discovered from thoughtful Tier 1 interactions.
- **kind**: every account is labeled as `individual` or `project`.
- **Dashboard first**: no Discord alerts by default.

## Data files

- `data/accounts.json` — canonical account registry.
- `data/interactions.json` — evidence log of replies/quotes/reposts/interactions.
- `data/posts.json` — notable authored posts/themes from tracked accounts.
- `data/candidates.json` — accounts/projects proposed for Tier 2 before/when added.
- `docs/data/*.json` — static copies rendered by GitHub Pages.

## Promotion rule v1

When a Tier 1 account replies to, quotes, or otherwise thoughtfully interacts with another account, log the interaction. If the other account is worth tracking, add it as Tier 2 with `kind: individual` or `kind: project`.

Ignore shallow banter, memes, generic price calls, engagement farming, and low-context replies.
