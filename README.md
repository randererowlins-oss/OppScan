# 🔭 OppScan — Scan less. Win more.

**OppScan is a full-stack opportunity discovery & tracking platform.** It aggregates
jobs, grants, tenders, freelance gigs, funding rounds and scholarships into one
searchable, scored, bookmarkable dashboard — with simulated scanner runs, community
submissions, and an admin curation console.

> **New here?** → Read [`docs/SETUP.md`](docs/SETUP.md) (5-minute quickstart),
> then the [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) tour.

---

## ✨ Feature tour

| Area | What you get |
|------|--------------|
| 🔍 **Browse & search** | Full-text search, filter by type / category / remote / min-score, sort by newest · score · deadline · value, pagination |
| ★ **Transparent scoring** | Every listing gets a 0–100 score (completeness 30 + freshness 25 + demand 20 + comp clarity 15 + curation 10). Formula in code: `backend/src/utils/scoring.ts` |
| 📡 **Scanner simulation** | One click runs a scan across 6 sources; fresh listings drop into Browse instantly |
| 🔖 **Bookmarks** | Save contenders, manage your shortlist on `/saved` |
| 📊 **Dashboard** | Headline totals, per-type chart, score-distribution chart, 14-day deadline watch, freshest finds |
| ✍️ **Community submit** | Post your own opportunity in < 1 minute; edit/delete your posts |
| 🛡️ **Admin console** | User overview, feature/unfeature homepage listings, source health, scan history |
| 🔐 **Auth** | JWT (7-day) + bcrypt passwords, protected routes, role-based admin guard |

---

## 🧱 Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | **React 18 + Vite 5 + TypeScript + Tailwind 3 + React Router 6 + Recharts** | Fast dev loop, typed, utility-first styling, real charts |
| Backend | **Node 20 + Express 4 + TypeScript + Zod + JWT + bcryptjs** | Boring, readable, production-shaped REST API |
| Database | **Zero-dependency JSON document store** (`backend/data/db.json`) | Works instantly with no services; repository isolated in one file so Postgres can replace it later (see [`docs/DATABASE.md`](docs/DATABASE.md)) |
| DevOps | **Docker Compose** (API + Nginx-served SPA) | One-command production-shaped deploy |

**Repository layout** (monorepo):

```
OppScan/
├── README.md              ← you are here
├── docs/                  ← intense documentation (start with SETUP.md)
├── backend/               ← Express REST API (port 4000)
│   ├── src/
│   │   ├── index.ts       ← entry: boot + listen
│   │   ├── app.ts         ← middleware + route wiring
│   │   ├── config.ts      ← validated env config
│   │   ├── db.ts          ← JSON document store (atomic writes)
│   │   ├── seed.ts        ← 3 users · 6 sources · 28 opportunities
│   │   ├── routes/        ← auth · opportunities · saved · dashboard · scan · admin
│   │   ├── middleware/auth.ts  ← requireAuth / optionalAuth / requireAdmin
│   │   └── utils/         ← jwt+bcrypt helpers · scoring algorithm
│   └── data/db.json       ← auto-created database (gitignored)
├── frontend/              ← React SPA (port 5173, proxies /api → :4000)
│   └── src/
│       ├── api/client.ts  ← typed Axios client for every endpoint
│       ├── context/AuthContext.tsx ← user + token lifecycle
│       ├── components/    ← Navbar · Layout · OpportunityCard · guards · …
│       └── pages/         ← Landing · Browse · Detail · Dashboard · Saved ·
│                             Submit · Profile · Admin · Auth · 404
└── docker-compose.yml     ← api + web services
```

---

## 🚀 Quickstart (local dev)

**Prerequisites:** Node.js ≥ 18 (check: `node -v`).

```bash
# 1 · Install everything
npm run install:all          # or: cd backend && npm i  ·  cd frontend && npm i

# 2 · Start the API (terminal 1) → http://localhost:4000
npm run dev:backend          # seeds demo data on first boot

# 3 · Start the web app (terminal 2) → http://localhost:5173
npm run dev:frontend
```

Open **http://localhost:5173** — done. 🎉

**Demo logins** (seeded automatically):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@oppscan.io` | `admin123` |
| Member | `demo@oppscan.io` | `demo1234` |

> Full setup variants (Docker, production env, troubleshooting) live in
> [`docs/SETUP.md`](docs/SETUP.md).

---

## 🐳 Quickstart (Docker)

```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))") \
docker compose up --build
# web → http://localhost:5173   api → http://localhost:4000/api/health
```

---

## 📚 Documentation index

Every question you have is answered somewhere in `docs/` — in this order:

| # | Doc | Read it when… |
|---|-----|---------------|
| 1 | [`docs/SETUP.md`](docs/SETUP.md) | …you want to install, run, or fix your environment |
| 2 | [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | …you want a click-by-click tour of every screen |
| 3 | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | …you want the big picture: diagrams, request flows, key decisions |
| 4 | [`docs/API.md`](docs/API.md) | …you want every endpoint, shape and `curl` example |
| 5 | [`docs/DATABASE.md`](docs/DATABASE.md) | …you want the schema, seed data and the Postgres migration path |
| 6 | [`docs/BACKEND.md`](docs/BACKEND.md) | …you're working on the API (routes, auth, scoring, conventions) |
| 7 | [`docs/FRONTEND.md`](docs/FRONTEND.md) | …you're working on the SPA (pages, state, styling, conventions) |
| 8 | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | …you're shipping to a server / VPS / cloud |
| 9 | [`docs/TESTING.md`](docs/TESTING.md) | …you want to verify changes (smoke suite + manual checklist) |
| 10 | [`docs/SECURITY.md`](docs/SECURITY.md) | …you want the threat model and hardening checklist |
| 11 | [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | …you want to contribute code or docs |

---

## 🔌 API at a glance

Base URL (dev): `http://localhost:4000/api` — full reference in [`docs/API.md`](docs/API.md).

```
GET    /api/health                        health check
POST   /api/auth/register  /login         { user, token }
GET    /api/auth/me                       current user (auth)
GET    /api/opportunities?q=&type=&…      paginated browse + facets
GET    /api/opportunities/featured        top featured
GET    /api/opportunities/:id             detail (+ similar)
POST   /api/opportunities                 submit (auth)
PUT    /api/opportunities/:id             edit owner/admin (auth)
DELETE /api/opportunities/:id             delete owner/admin (auth)
POST   /api/opportunities/:id/apply       track application (auth)
GET    /api/saved                         bookmarks (auth)
POST   /api/saved/:id  ·  DELETE …        save / unsave (auth)
GET    /api/dashboard/stats               dashboard bundle (auth)
GET    /api/sources  ·  GET /api/scans    sources + history
POST   /api/scan                          run scanner (auth)
GET    /api/admin/overview                admin totals (admin)
PATCH  /api/admin/opportunities/:id/feature   feature toggle (admin)
```

**Try it in 30 seconds:**

```bash
# health
curl localhost:4000/api/health

# log in as demo user, keep the token
TOKEN=$(curl -s -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@oppscan.io","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# browse top-scored grants, then run a scan
curl "localhost:4000/api/opportunities?type=Grant&sort=score&limit=3"
curl -X POST localhost:4000/api/scan -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Verify your checkout

```bash
cd backend  && npx tsc --noEmit   # typecheck API
cd frontend && npx tsc --noEmit   # typecheck SPA
```

Then follow the scripted smoke suite in [`docs/TESTING.md`](docs/TESTING.md)
(health → register → login → browse → save → scan → dashboard).

---

## 🗺️ Roadmap (next up)

- [ ] Postgres + Prisma (drop-in for the JSON store — migration recipe already in `docs/DATABASE.md`)
- [ ] Email deadline reminders + saved-search alerts
- [ ] Real source connectors (RSS / Greenhouse / Ashby / ReliefWeb…)
- [ ] ML re-ranking on top of the heuristic score (same API shape)
- [ ] Playwright E2E suite + CI workflow

Ideas welcome — see [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

---

## 📄 License

MIT — do anything, just keep the notice. See `LICENSE` (to be added by maintainers).
