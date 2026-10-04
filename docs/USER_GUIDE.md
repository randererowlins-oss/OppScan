# 🖱️ USER GUIDE — a tour of every screen

> Start the app ([`SETUP.md`](SETUP.md)), open http://localhost:5173, and follow
> along. Demo logins: `demo@oppscan.io / demo1234` (member),
> `admin@oppscan.io / admin123` (admin).

---

## 1 · Landing (`/`) — public

The front door: hero, **Featured this week** (top admin-curated listings by
score), feature grid, and a 3-step “How it works”. CTAs lead to `/register`
and `/browse`. No login needed to look around.

## 2 · Browse (`/browse`) — public

The heart of OppScan. Everything here composes:

- **Search** — type ahead; matches titles, organisations, descriptions,
  categories and tags (try `solar`, `react`, `grant`). Debounced, instant.
- **Type rails** — All / Jobs / Grants / Tenders / Freelance / Funding /
  Scholarships, each with live counts.
- **Category dropdown** — populated from real data (`Engineering`, `Climate`…).
- **Min-score slider** — floor from 0 to 90; only listings scoring above show.
- **Remote-only checkbox.**
- **Sort** — Newest · Highest score · Closing soonest · Highest value.
- **Pagination** — 12 per page with Prev/Next.

Each card shows type, featured/closing-soon flags, ★ score, title, org,
2-line description, location + remote, money range, tags, views/applicants,
age, deadline countdown — and (when logged in) a **bookmark toggle**.

## 3 · Detail (`/opportunities/:id`) — public

Click any card: full description, deadline + countdown, money, tags, view/
applicant counters, **Apply now** (opens the canonical URL; logged-in clicks
are tracked once per visit), **Save for later**, similar listings, and a
**“Why this score?”** card explaining the 0–100 weights. Owners/admins get
**Edit** (→ `/submit?id=…`) and **Delete** (with confirm).

## 4 · Dashboard (`/dashboard`) — login required

Your mission control, from one API call:

- 4 stat cards: Open · Closing soon · My saved · Posted by me.
- **Run scan** — triggers the scanner; new listings land in Browse instantly.
- Charts: opportunities by type · score distribution.
- **Closing within 14 days** watchlist.
- **Fresh on the radar** — the 5 newest listings.

## 5 · Saved (`/saved`) — login required

Your bookmark shortlist. Unbookmarking removes cards instantly. Empty state
guides you back to Browse.

## 6 · Submit (`/submit`) — login required

Publish a listing in under a minute: title, organisation, type, category,
location (+ remote toggle), deadline, comp range + currency, tags, apply URL,
and a ≥60-char description (live counter; detail boosts your score).
Posting as `?id=…` switches to **edit mode** (owner/admin only).

## 7 · Profile (`/profile`) — login required

Avatar, role badge, saved/posted counts, and display-name editing.

## 8 · Admin (`/admin`) — admin only

- Totals: users · opportunities · bookmarks · scans.
- **Feature top listings** — toggle homepage featuring (updates Landing live).
- **Scan sources** — health + last-scan + lifetime finds per source.
- **Users** — every account with roles.
- **Scan history** — every run with sources scanned + new finds.

Non-admins are redirected to `/dashboard`; anonymous visitors to `/login`.

---

## 9 · Everyday workflows

**“Find a remote grant over $50k closing this month”**
Browse → Type=Grants → Remote-only → Sort=Closing soonest → scan countdowns →
bookmark finalists → apply from Detail.

**“Never miss a deadline”**
Dashboard → Closing-within-14-days → open each → Apply now (tracked).

**“Share an opportunity with the community”**
Submit → fill the form → Publish → it appears in Browse, scored instantly.

**“Refresh the feed” (any logged-in user)**
Dashboard → Run scan → banner reports new finds → Browse → Sort=Newest.

**“Curate the homepage” (admin)**
Admin → Feature/Unfeature → verify on Landing.

---

## 10 · Scores, demystified

Every ★ score is `computeScore()` (see `backend/src/utils/scoring.ts`):

- Completeness /30 · Freshness /25 · Demand /20 · Comp clarity /15 · Featured /10
- Closed listings cap at 25. Views + applications nudge scores up over time.

There is no hidden ML — the number on the card is exactly what the formula says.
