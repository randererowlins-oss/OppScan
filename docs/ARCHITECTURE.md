# 🏗️ ARCHITECTURE — how OppScan fits together

> One page to understand the whole system: components, data flow, and the
> reasoning behind the key decisions.

---

## 1 · System map

```
                        ┌─────────────────────────────────────────┐
                        │              BROWSER (SPA)              │
                        │  React 18 · Router 6 · Tailwind · Recharts │
                        │  pages/ → api/client.ts (Axios + JWT)  │
                        └──────────────┬──────────────────────────┘
                                       │  HTTP + JSON
                                       │  GET/POST /api/*  (Bearer JWT when logged in)
                                       ▼
┌──────────────┐   proxy /api→:4000 (dev)   ┌──────────────────────────────┐
│  Vite :5173  │  ─── or Nginx (docker) ──▶ │      EXPRESS API :4000       │
└──────────────┘                            │  helmet → cors → json → routes│
                                            │  routes: auth · opportunities │
                                            │  saved · dashboard · scan · admin│
                                            └──────────────┬───────────────┘
                                                           │  read/write (in-memory + atomic file save)
                                                           ▼
                                            ┌──────────────────────────────┐
                                            │   JSON DOCUMENT STORE        │
                                            │   backend/data/db.json       │
                                            │   users · opportunities · saved│
                                            │   sources · scans            │
                                            └──────────────────────────────┘
```

**There are only three moving parts.** No database server, no cache, no queue —
deliberately, so the project runs anywhere and every flow is traceable in code.

---

## 2 · Request lifecycle (example: “save a bookmark”)

```
1. User clicks bookmark on OpportunityCard
2. savedApi.save(id) → POST /api/saved/:id  (Axios adds `Authorization: Bearer <jwt>`)
3. Express: helmet → cors → express.json → savedRouter
4. requireAuth verifies JWT → loads user → req.user
5. Route checks opportunity exists → inserts {userId, opportunityId} (idempotent)
6. store.save() → atomic write (tmp file + rename) to db.json
7. 201 { saved: true } → React flips the icon optimistically-confirmed
```

Every route follows this shape: **middleware chain → validate (Zod) →
authorize (owner/admin) → mutate store → `store.save()` → JSON response**.
Errors are always `{ error: string }` with the right HTTP status.

---

## 3 · Module responsibilities

### Backend (`backend/src/`)

| File / dir | Owns | Must NOT |
|------------|------|----------|
| `index.ts` | Boot: touch store (seed), listen on `0.0.0.0` | Contain route logic |
| `app.ts` | Middleware order, router mounting, 404 + error handler | Touch the DB |
| `config.ts` | All env vars with dev defaults; fail-fast in prod | Be imported for anything else |
| `db.ts` | The entire persistence layer: load, atomic save, reset | Contain business rules |
| `seed.ts` | Deterministic demo dataset + `seedDatabase()` | Be called outside boot/`seed-run` |
| `routes/*.ts` | One domain each; validation + authz + response shape | Reach across domains except via `store` |
| `middleware/auth.ts` | `requireAuth` / `optionalAuth` / `requireAdmin` | Know about opportunity rules |
| `utils/auth.ts` | bcrypt + JWT sign/verify, `publicUser()` strip | Handle HTTP |
| `utils/scoring.ts` | Pure `computeScore()` (0–100, deterministic) | Touch I/O |

### Frontend (`frontend/src/`)

| File / dir | Owns |
|------------|------|
| `api/client.ts` | **Only** place that knows endpoint URLs; token attach; `apiError()` messages |
| `context/AuthContext.tsx` | User + token lifecycle: login/register/logout/refresh-on-boot |
| `pages/*.tsx` | One route each; data fetching via the API client; no raw `fetch` |
| `components/OpportunityCard.tsx` | The single listing card reused on 4 pages |
| `components/bits.tsx` | Route guards (`ProtectedRoute`, `AdminRoute`), spinner, empty/error states |
| `utils/format.ts` | Display formatting (money, dates, score/type colour tones) |

**Dependency rule:** pages → components → api-client → (HTTP). Pages never
import Axios directly; the API client never imports React. This keeps every
endpoint mockable and every page testable.

---

## 4 · Auth design

```
Register/Login ──▶ bcrypt verify ──▶ JWT { sub, email, role } (7d) ──▶ localStorage
                                                                    │
Subsequent requests ──▶ Authorization: Bearer <jwt> ──▶ requireAuth ──▶ req.user
```

- Passwords: bcrypt (`bcryptjs`, 10 rounds). Hashes never leave the server —
  `publicUser()` strips them on every response.
- Tokens: stateless JWT; the API re-loads the user row per request so deleted
  users instantly lose access.
- Guards: `requireAuth` (logged in), `optionalAuth` (personalise if logged in —
  used for `saved` flags on public listings), `requireAdmin` (after auth).
- Frontend: `AuthProvider` validates the stored token against `GET /auth/me`
  on boot; `ProtectedRoute`/`AdminRoute` redirect appropriately.

---

## 5 · Scoring algorithm (the “brain”)

`computeScore()` in `backend/src/utils/scoring.ts` is a **pure, deterministic
heuristic** — same input → same score, no ML, fully explainable in the UI:

| Signal | Max | How |
|--------|-----|-----|
| Listing completeness | 30 | Description length + tag count + amount + URL |
| Freshness | 25 | Linear decay over 60 days from `createdAt` |
| Demand signal | 20 | `log10(1 + views + applicants×8) × 7`, capped |
| Compensation clarity | 15 | Full range + currency = 15, partial = 8 |
| Curation boost | 10 | `featured` flag set by admins |

Closed listings are capped at 25. Scores recompute whenever views/applicants
change, so popular listings genuinely climb. The day we add ML re-ranking, only
this file changes — the API shape (`score: number`) stays identical.

---

## 6 · Key decisions (ADRs, short form)

| # | Decision | Rationale | Revisit when… |
|---|----------|-----------|---------------|
| 1 | **Monorepo, two packages** | One clone, one PR, shared docs; backend/frontend still deploy independently | Teams need independent versioning |
| 2 | **JSON file store, not Postgres** | Zero-setup runs everywhere (local, CI, sandbox previews); entire persistence surface is one file | Concurrent writers or >100k rows → see `DATABASE.md` migration recipe |
| 3 | **REST + JSON, not GraphQL/tRPC** | Every client (curl, docs, future mobile app) works with zero tooling | Frontend needs complex nested queries |
| 4 | **JWT in localStorage** | Simple, stateless, survives refresh; fine for this threat model | XSS becomes a real concern → move to httpOnly cookies + CSRF |
| 5 | **Vite `/api` proxy in dev** | Browser talks to one origin → zero CORS friction in previews | Never in dev; prod uses Nginx proxy or `VITE_API_URL` |
| 6 | **Zod validation at the boundary** | One schema per route input; frontend gets precise 400 messages | — (keep) |
| 7 | **Heuristic score, not ML** | Explainable, deterministic, zero infra | Enough behavioural data to train a ranker |

---

## 7 · Data & trust boundaries

```
                    ┌─ never leaves server: passwordHash, JWT_SECRET
  Untrusted ──▶ API boundary (Zod validation + auth guards) ──▶ Trusted store
  (browser)         401 unauthenticated · 403 unauthorised · 400 invalid
```

- All route inputs are validated with Zod; unknown fields are stripped.
- JSON body limit: 256 KB (DoS guard on the submit endpoint).
- `helmet` sets secure headers; `cors` allow-lists browser origins.
- Full threat model: [`SECURITY.md`](SECURITY.md).

---

## 8 · Where to go deeper

- Endpoints & shapes → [`API.md`](API.md)
- Tables & seed data → [`DATABASE.md`](DATABASE.md)
- API conventions → [`BACKEND.md`](BACKEND.md) · SPA conventions → [`FRONTEND.md`](FRONTEND.md)
