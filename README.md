# دوري الخيمة — Tent League

A bilingual (Arabic/English) Saudi Pro League prediction game, built for a real friend group and actively running the current season.

**🔴 This is not a demo.** This is a live, in-use application — a group of friends and family log in every round, submit real predictions before real kickoffs, and track a real leaderboard. As of this write-up there are 22 registered players, 4 admins running the league, and 3 completed/in-progress rounds of the season.

**Live site:** https://8alubaid.github.io/5PL/

---

## What this is

Every round of the Saudi Pro League, players pick win/draw/loss for each match and can flag one match per round for a bonus exact-score guess. Points are tiered (more correct picks = more points), predictions stay private until a match kicks off, and an admin panel handles adding rounds, entering results, and managing players — all from the same lightweight interface, in Arabic or English.

There's no company, no monetization, and no formal team behind it — just an organizer, a handful of co-admins, and a group chat full of friends arguing about who's actually good at picking football results.

## Features

- **Bilingual UI** — Arabic (default, RTL) and English (LTR), toggled per device, including translated team names and stadium names
- **Win/draw/loss predictions** for every match in a round, plus an optional exact-score bonus pick (one per round)
- **Tiered scoring** — 5–7 correct picks = 3 points, 8–9 correct = 5 points, fewer than 5 = 0, plus a separate +1 for nailing an exact score
- **Per-match prediction switch** — an admin can hold a specific match back from predictions (e.g. one scheduled well after the rest of its round) and open it independently, closer to kickoff, without affecting the rest of the round
- **Saved-predictions summary** — after saving, players see a clear read-only confirmation of what they picked, with an explicit edit option, instead of the same editable form
- **Admin live feed** — a real-time-ish view of exactly who has and hasn't predicted the current round, so admins know who to nudge before a deadline
- **Round management** — paste a fixture list from any source and it's parsed into matches automatically, or add/edit them by hand; team and stadium pickers instead of free text
- **Player management** — add players with an auto-generated PIN, suspend/reactivate, edit details
- **Excel backup export** — full data dump (players, matches, predictions, standings) on demand
- **Custom crest badges** — a two-tone gradient + short code per club, in the app's own visual language rather than a reproduction of official club logos

## Tech stack

This is intentionally a "no build step, no framework" project:

- **Frontend:** Vanilla JavaScript, loaded as native ES modules (`<script type="module">`) — no bundler, no transpilation, no npm install
- **Styling:** Plain CSS with custom properties for the whole visual system (theme colors, spacing, RTL/LTR mirroring, mobile breakpoints)
- **Backend:** [Google Apps Script](https://developers.google.com/apps-script), deployed as a public web app — a small key/value HTTP API, not a general-purpose server
- **Database:** A Google Sheet (one tab, two columns: `key`/`value`), storing four JSON blobs — `config`, `players`, `rounds`, `predictions`
- **Hosting:** [GitHub Pages](https://pages.github.com/), serving the repo's static files directly from `main`
- **Excel export:** [SheetJS](https://sheetjs.com/) (`xlsx`), lazy-loaded from a CDN only when a backup is actually requested

No server framework, no database engine, no CI/CD pipeline — the entire backend is one `.gs` file, and the entire frontend is plain files a browser can run unmodified.

## Architecture

```
Browser (18 ES modules, main.js orchestrates)
   │
   ├──▶ GitHub Pages ── serves index.html, style.css, js/*.js, logo.png (static only)
   │
   └──▶ Google Apps Script Web App ── doGet / doPost ──▶ Google Sheet ("KV" tab)
```

The browser is the only thing that talks to both sides — GitHub Pages and the Apps Script backend never communicate with each other. On load, the app makes a single `?key=all` request that returns every stored key in one round trip; every user action after that (saving a prediction, editing a round, adding a player) is one targeted write.

Predictions are the one piece of data multiple people write concurrently, so saving a prediction doesn't overwrite the whole predictions blob from a client-side snapshot — it calls a dedicated `savePrediction` backend action that merges just that player's picks into the current data under a script lock, so two players saving around the same time (common right before a deadline) can't silently overwrite each other.

## Project structure

```
index.html                 Static shell — loads style.css and js/main.js
style.css                  The entire visual system (CSS custom properties)
logo.png                   App logo
apps-script-Code.gs        Backend source of truth — paste into the Apps
                            Script project bound to the data Sheet and deploy
js/
  main.js                  Boots the app, owns render() and tab routing
  state.js                 Shared app state + the Apps Script API_URL
  api.js                   All reads/writes to the backend
  i18n.js                  Arabic/English strings and formatting helpers
  data.js                  Team roster, crest colors, stadium names
  scoring.js               Points calculation, standings, predictability rules
  utils.js                 Small shared helpers (escaping, IDs, toasts)
  dom.js                   The single root DOM node every screen renders into
  ui-common.js             Shared UI bits (language toggle, RTL/LTR)
  ui-login.js              Login screen (player + organizer)
  ui-predict.js            The predictions screen
  ui-leaderboard.js        Standings table
  ui-history.js            Player round history / admin live feed
  ui-admin.js              Admin panel shell + sub-tab routing
  ui-admin-rounds.js       Round and match management
  ui-admin-players.js      Player management
  ui-admin-settings.js     Competition settings, admin PIN rotation
  export-excel.js          Excel backup generation
```

## Local development

No install step — this is plain static files plus one small Python server used only to disable browser caching during development (so you always see your latest edit):

```bash
python .claude/nocache_server.py
```

Then open `http://localhost:8000`. It talks to the same live Google Sheet as production, so treat local testing with the same care you would the real site — there's no separate sandbox environment.

## Deploying changes

- **Frontend:** GitHub Pages serves whatever's on `main`, with no build step — pushing to `main` is the deploy.
- **Backend:** `apps-script-Code.gs` is checked in for reference and history, but Google Apps Script doesn't deploy from git. After changing it, open the Sheet → **Extensions → Apps Script**, paste the updated code, and **Deploy → Manage deployments → New version → Deploy**. Pushing the file to GitHub does *not* update the running backend — these are two separate steps.

The `dev` branch exists as a look-before-you-leap step: changes land there first, get tested against the live data, and only then get fast-forwarded into `main`.

## Data model

Everything lives in one Google Sheet tab as four JSON blobs:

| Key | Shape |
|---|---|
| `config` | Competition title, points rules, and the admin PIN (never returned by any read — verified server-side only) |
| `players` | `[{ id, name, email, pin, suspended, createdAt }]` |
| `rounds` | `[{ id, name, matches: [{ id, home, away, kickoff, stadium, predictOpen, homeScore, awayScore, finished }] }]` |
| `predictions` | `{ playerId: { matchId: { outcome, exact } } }` |

## Known limitations

Worth being upfront about, since this runs on real people's data:

- **Player PINs are plain text.** They're stored unhashed and used only as a lightweight "the organizer gave you this" gate — not a real security boundary. (The admin PIN got this treatment already: verified server-side, never exposed via any read.)
- **Most backend writes have no authorization check.** Anyone with the Apps Script URL could, in principle, write directly to the data store without going through the app's login at all. The PIN screens protect against casual misuse, not a determined actor.
- **One Google Apps Script project is a single point of failure**, with the free tier's usual quotas and occasional cold-start latency.
- **The repository is public**, which means its commit history (including contributor emails) and full client-side source are visible to anyone.

None of these have caused real problems for a friend-group game, but they're the reason this isn't the pattern to copy for anything handling sensitive data.

## Credits

Built and maintained by the organizer and co-admins of دوري الخيمة, with help from Claude (Anthropic).
