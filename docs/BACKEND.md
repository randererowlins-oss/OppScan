# ⚙️ BACKEND — API conventions & internals

> Stack: Node 20 · Express 4 · TypeScript (strict) · Zod · JWT · bcryptjs ·
> tsx (dev) · tsc (build). Entry: `src/index.ts`. Port: `4000`.

---

## 1 · Tour of `src/`

```
src/
├── index.ts            boot: seed-on-first-run → listen 0.0.0.0:$PORT
├── app.ts              middleware order + router mounting + 404/error handlers
├── config.ts           env with dev defaults; fail-fast on prod misconfig
├── types.ts            domain types (mirror of frontend types + API.md)
├── db.ts               JSON store: load / atomic save / reset
├── seed.ts             seedDatabase() — 3 users · 6 sources · 28 opportunities
├── seed-run.ts         `npm run seed` CLI
├── middleware/auth.ts  requireAuth · optionalAuth · requireAdmin (+ AuthRequest)
├── routes/
│   ├── auth.ts         register · login · me · updateMe
│   ├── opportunities.ts browse · featured · detail · CRUD · apply
│   ├── saved.ts        list · save · unsave (all requireAuth)
│   ├── dashboard.ts    stats bundle (requireAuth)
│   ├── scan.ts         sources · scans · POST /scan (run needs auth)
│   └── admin.ts        overview · feature toggle (requireAdmin)
└── utils/
    ├── auth.ts         bcrypt hash/verify · JWT sign/verify · publicUser()
    └── scoring.ts      pure computeScore() — the 0–100 heuristic
```

---

## 2 · The anatomy of a route (copy this pattern)

```ts
// 1. Validate at the boundary with Zod — first error wins, 400 + message.
const parsed = upsertSchema.safeParse(req.body);
if (!parsed.success) {
  res.status(400).json({ error: parsed.error.issues[0].message });
  return;
}

// 2. Authorize: requireAuth (middleware) → owner-or-admin check → 403.
if (opp.postedBy !== req.user!.id && req.user!.role !== "admin") {
  res.status(403).json({ error: "Only the author or an admin can edit this" });
  return;
}

// 3. Mutate the store, recompute derived fields, persist.
Object.assign(opp, parsed.data, { updatedAt: new Date().toISOString() });
opp.score = computeScore(opp);
store.save();

// 4. Respond with the resource (or a bundle) — always JSON.
res.json({ item: withSavedFlag(opp, req.user!.id) });
```

Rules:

- **Routers are thin.** Business rules live in `utils/`; persistence in `db.ts`.
- **Never serialize `passwordHash`.** Use `publicUser()`.
- **Errors are `{ error: string }`** with the correct status (table in `API.md`).
- **Unknown fields are stripped** by Zod — clients can't set `score`,
  `featured`, `postedBy`, `views`, … directly.

---

## 3 · Middleware order (in `app.ts` — it matters)

```
helmet() → cors(origins) → express.json(256kb) → morgan(dev) → routers → 404 → error handler
```

- `helmet` — secure defaults (CSP off, frameguard on, etc.)
- `cors` — allow-list from `CORS_ORIGIN` (comma-separated)
- `express.json({ limit: "256kb" })` — DoS guard on big payloads
- Central error handler — logs fully, but sends `String(err)` only in dev

---

## 4 · Auth internals

| Piece | Detail |
|-------|--------|
| Password hashing | `bcryptjs`, cost 10 (`hashPassword` / `verifyPassword`) |
| Token | JWT `HS256`, payload `{ sub, email, role }`, expiry `JWT_EXPIRES_IN` (default `7d`) |
| `requireAuth` | 401 unless `Authorization: Bearer <valid>` + user still exists → `req.user` |
| `optionalAuth` | Never rejects; sets `req.user` when a valid token is present (used for `saved` flags + view tracking on public routes) |
| `requireAdmin` | 403 unless `req.user.role === "admin"` — always mounted **after** `requireAuth` |

Login deliberately returns the same `401` for unknown email vs wrong password.

---

## 5 · Scoring (`utils/scoring.ts`)

`computeScore()` is **pure and deterministic**: same listing → same score.
Weights: completeness 30 · freshness 25 (60-day linear decay) · demand 20
(`log10(1 + views + applicants×8) × 7`, capped) · comp clarity 15 · featured 10.
Closed listings cap at 25. Recomputed on: view, apply, create, edit.

To retune: change the weights, restart — no migration, since scores recompute
lazily. Seed data uses the same function, so tuning instantly reshapes demos.

---

## 6 · Browse query pipeline (`routes/opportunities.ts`)

```
all → q filter → type → category → location → remote → featured → status
    → minScore → sort (newest|score|deadline|amount) → paginate → +saved flags
```

`facets` (type counts, categories, sources) is computed from the **full**
collection on every response so filter UIs never go stale.

---

## 7 · Scanner (`routes/scan.ts`)

`POST /api/scan` is a *simulation with honest mechanics*:

1. Snapshot `startedAt`; select `active` sources.
2. Pick 1–3 entries from `SCAN_POOL` not already present (deduped by
   `title|organization`).
3. Stamp `createdAt`, compute real scores, `unshift` into opportunities.
4. Update each source's `lastScanAt`/`foundCount`; append a `ScanRun`.
5. `201 { run, items }`.

To add “new” inventory, append entries to `SCAN_POOL`. To wire **real**
connectors later (RSS, Greenhouse…), replace step 2 with fetchers — the
response shape and frontend stay unchanged.

---

## 8 · Config & environments

All config flows through `config.ts` — routes never read `process.env`
directly. Defaults make `npm run dev` work with no `.env`. Production guard:
booting with `NODE_ENV=production` + the default `JWT_SECRET` throws.

---

## 9 · Adding a new endpoint (checklist)

1. Define/extend Zod schema + types in `routes/<domain>.ts` (and `types.ts` if new shapes).
2. Pick the guard: public → none/`optionalAuth`; user → `requireAuth`; admin → `+ requireAdmin`.
3. Validate → authorize → mutate → `store.save()` → JSON (see § 2).
4. Add the typed method to `frontend/src/api/client.ts`.
5. Document in `docs/API.md` (endpoint + curl example).
6. Smoke-test per `docs/TESTING.md` and run `npx tsc --noEmit`.

---

## 10 · Scripts

| Script | What |
|--------|------|
| `npm run dev` | `tsx watch` — hot-reload API |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | Run compiled `dist/index.js` (prod) |
| `npm run seed` | Wipe + reseed DB (dev only, stop server first) |
| `npm run typecheck` | `tsc --noEmit` |
