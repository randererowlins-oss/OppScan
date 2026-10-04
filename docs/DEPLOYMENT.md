# 🚢 DEPLOYMENT — ship OppScan to the world

> Three supported paths, simplest first: **Docker Compose** (any VPS),
> **manual Node + static host**, and **platform PaaS**. All assume the repo is
> already cloned/checked out on the target.

---

## 0 · Production checklist (all paths)

- [ ] `JWT_SECRET` is a long random string (generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- [ ] `NODE_ENV=production` on the API (enables the secret fail-fast + quiet error messages).
- [ ] `CORS_ORIGIN` lists your real web origin(s), comma-separated.
- [ ] Frontend built with `VITE_API_URL=https://<your-api-host>` **or** served
      behind the Nginx `/api` proxy (Docker path does this automatically).
- [ ] `backend/data/db.json` lives on a **persistent volume** (else redeploys wipe data).
- [ ] Typecheck + build + smoke suite pass (see [`TESTING.md`](TESTING.md)).
- [ ] You have a backup story for `db.json` (copy the file — it's that simple).

---

## 1 · Path A — Docker Compose (recommended, any VPS)

**Needs:** Docker ≥ 24 on a host with ports 80/443 (or 5173/4000) open.

```bash
# On the server:
git clone https://github.com/randererowlins-oss/OppScan.git && cd OppScan

export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
export CORS_ORIGIN=https://oppscan.example.com   # your real domain

docker compose up -d --build
docker compose ps            # both services "Up"
curl localhost:4000/api/health
```

What you get:

- `api` — Node 20 Alpine, compiled TS, health-checked, data in the
  `oppscan-data` volume.
- `web` — Nginx serving the SPA with SPA-fallback + `/api/` proxy to `api:4000`.

Put a reverse proxy (Caddy/Nginx/Cloudflare Tunnel) in front for TLS:

```
# Caddy example — automatic HTTPS:
oppscan.example.com {
  reverse_proxy localhost:5173
}
```

**Update flow:** `git pull && docker compose up -d --build` (volume keeps data).
**Fresh start:** `docker compose down -v` ⚠️ deletes all data.

---

## 2 · Path B — Manual (Node API + any static host)

**API** (VPS, systemd):

```bash
cd backend && npm ci && npm run build
PORT=4000 NODE_ENV=production JWT_SECRET=<secret> \
  CORS_ORIGIN=https://oppscan.example.com node dist/index.js
```

Keep it alive with systemd / pm2 / tmux per your taste; point a reverse proxy
at `:4000` for `https://api.oppscan.example.com`.

**Web** (Netlify / Vercel / Cloudflare Pages / S3…):

```bash
cd frontend
VITE_API_URL=https://api.oppscan.example.com npm run build
# deploy ./dist as a static site with SPA fallback (/* → /index.html)
```

> ⚠️ If `VITE_API_URL` is empty, the SPA calls relative `/api` — correct only
> when the static host proxies `/api` to the API (as our Nginx does).

---

## 3 · Path C — PaaS (Render / Railway / Fly.io…)

General recipe (names vary by platform):

1. Create a **Web Service** from `backend/` — build `npm ci && npm run build`,
   start `node dist/index.js`, env `NODE_ENV=production`, `JWT_SECRET`,
   `CORS_ORIGIN=https://<your-frontend>`. Attach a **persistent disk** mounted
   at `/app/data` (or set `DB_FILE` to the disk path).
2. Create a **Static Site** from `frontend/` — build
   `VITE_API_URL=https://<your-api> npm run build`, publish `dist/`.
3. Verify: `https://<api>/api/health` → `{"ok":true}`, then log in on the web app.

---

## 4 · Operations cheat-sheet

| Task | Command |
|------|---------|
| View API logs | `docker compose logs -f api` (or `journalctl -u oppscan`) |
| Backup data | `docker cp oppscan-api-1:/app/data/db.json ./db-backup-$(date +%F).json` |
| Restore data | stop api → copy file back to the volume/`data/` → start api |
| Reseed demo data | stop api → `npm run seed` in `backend/` → start api |
| Rotate JWT secret | set new `JWT_SECRET` → restart api (all users re-login) |
| Health probe | `GET /api/health` → 200 `{"ok":true}` (also the Docker `healthcheck`) |

---

## 5 · Scaling notes (when you outgrow one box)

1. **Data first:** migrate the JSON store → Postgres (recipe in
   [`DATABASE.md`](DATABASE.md) § 6) — required before horizontal scaling.
2. **Then:** run N API replicas behind a load balancer (stateless JWTs make
   this trivial) + serve the SPA from a CDN.
3. **Later:** split reads/writes, add Redis caching on `/opportunities`, move
   the scanner to a worker with real connectors.
