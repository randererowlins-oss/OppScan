# 🛠️ SETUP — install, run & troubleshoot OppScan

> Goal: from zero to a working app in **under 5 minutes**.
> Assumes a Unix-like shell (Linux / macOS / WSL2). Windows PowerShell works too —
> replace `cp` with `copy` and use two separate terminals.

---

## 1 · Prerequisites

| Requirement | Version | Check | Install |
|-------------|---------|-------|---------|
| Node.js | ≥ 18 (20 LTS recommended) | `node -v` | https://nodejs.org |
| npm | ≥ 9 (ships with Node) | `npm -v` | ships with Node |
| Git | any recent | `git --version` | https://git-scm.com |
| Docker *(optional)* | ≥ 24 | `docker --version` | https://docs.docker.com |

No database, no Redis, no external services — the API persists to a local JSON
file that is created and seeded automatically on first boot.

---

## 2 · Clone & install (2 min)

```bash
git clone https://github.com/randererowlins-oss/OppScan.git
cd OppScan

# Install backend + frontend dependencies:
npm run install:all
# Equivalent manual steps:
#   cd backend  && npm install
#   cd ../frontend && npm install
```

Expected: both installs finish with `added N packages` and no `npm error`.

---

## 3 · Run in development (1 min)

You need **two terminals** (API + web):

**Terminal 1 — API** (http://localhost:4000)

```bash
npm run dev:backend
# → ▓▓ OppScan API listening on http://localhost:4000
# → ▓▓ DB: /…/backend/data/db.json
# → ▓▓ Seeded: 3 users · 28 opportunities
```

First boot creates `backend/data/db.json` and seeds demo content
(see [`DATABASE.md`](DATABASE.md) § Seed data). Leave it running —
`tsx watch` restarts on every save.

**Terminal 2 — Web** (http://localhost:5173)

```bash
npm run dev:frontend
# → VITE ready in ~200 ms → http://localhost:5173/
```

Vite proxies all `/api/*` requests to `localhost:4000`, so the browser only
ever talks to `:5173` (no CORS setup needed). Open it and log in:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@oppscan.io` | `admin123` |
| Member | `demo@oppscan.io` | `demo1234` |

---

## 4 · Environment variables (optional in dev)

Both apps run with **zero config** — every variable has a dev default.
Override only when you need to:

**`backend/.env`** (copy from `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4000` | API listen port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed browser origins |
| `JWT_SECRET` | `dev-only-secret-change-me` | Token signing key — **must change in prod** (the API refuses to boot in `NODE_ENV=production` with the default) |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime (`jsonwebtoken` format) |
| `DB_FILE` | `./data/db.json` | Database file path |

**`frontend/.env`** (copy from `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | *(empty → use `/api` proxy)* | Set to the public API origin **only** for production builds (e.g. `https://api.oppscan.io`) |

Generate a production secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 5 · Useful commands

| Command | Where | What it does |
|---------|-------|--------------|
| `npm run dev` | `backend/` | Start API with hot-reload |
| `npm run build` → `npm start` | `backend/` | Compile to `dist/` and run production JS |
| `npm run seed` | `backend/` | **Wipe + reseed** the database (dev only!) |
| `npx tsc --noEmit` | `backend/` or `frontend/` | Typecheck without emitting |
| `npm run dev` | `frontend/` | Start Vite dev server |
| `npm run build` | `frontend/` | Typecheck + production build to `dist/` |
| `npm run preview` | `frontend/` | Serve the production build locally |
| `docker compose up --build` | repo root | Run API + web in containers |

---

## 6 · Docker (production-shaped)

```bash
# From the repo root:
JWT_SECRET=<long-random-secret> docker compose up --build

# Web → http://localhost:5173   (Nginx serves the SPA, proxies /api → api:4000)
# API → http://localhost:4000/api/health
```

Notes:

- Data persists in the `oppscan-data` Docker volume (`/app/data/db.json`).
- To start from scratch: `docker compose down -v` (deletes the volume).
- See [`DEPLOYMENT.md`](DEPLOYMENT.md) for VPS/cloud instructions.

---

## 7 · Troubleshooting

<details>
<summary><strong><code>EADDRINUSE: port 4000/5173 already in use</code></strong></summary>

Another process owns the port. Find and stop it:

```bash
lsof -ti:4000 | xargs kill   # macOS/Linux
# or change ports: backend → PORT=4001 npm run dev (and update Vite proxy target)
```

</details>

<details>
<summary><strong>Frontend shows “Cannot reach the API”</strong></summary>

1. Is the backend running? `curl localhost:4000/api/health` should return `{"ok":true,…}`.
2. Did you open the app via the Vite URL (`:5173`), not by opening files directly?
3. If you set `VITE_API_URL`, unset it in dev (empty = use the proxy) and restart Vite.

</details>

<details>
<summary><strong><code>401 Invalid or expired token</code> after code changes</strong></summary>

Your saved JWT was signed with a different `JWT_SECRET`, or it expired.
Log out and log back in (the app clears bad tokens automatically on boot).

</details>

<details>
<summary><strong>Database looks wrong / I want fresh demo data</strong></summary>

```bash
# Stop the API first (it holds the DB in memory), then:
cd backend && npm run seed
# → prints the demo logins when done. Restart the API.
```

Never run `npm run seed` against production data — it wipes everything.

</details>

<details>
<summary><strong><code>npm install` fails with ETARGET / version errors</code></strong></summary>

Your npm registry mirror may lag behind. Retry, or pin to an available version:

```bash
npm view <package> versions   # see what your registry offers
```

Then update `package.json` accordingly.

</details>

<details>
<summary><strong>TypeScript errors in the editor but `tsc --noEmit` passes</strong></summary>

Your editor is likely using a different TS version. Point it at the workspace
one: `frontend/node_modules/typescript` / `backend/node_modules/typescript`.

</details>

---

## 8 · Next steps

- 🖱️ Take the click-by-click tour: [`USER_GUIDE.md`](USER_GUIDE.md)
- 🏗️ Understand the system: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- 🔌 Call the API directly: [`API.md`](API.md)
