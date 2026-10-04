# 🔌 API REFERENCE — every endpoint, shape & example

> Base URL (dev): `http://localhost:4000/api`
> Auth: `Authorization: Bearer <jwt>` where marked 🔒.
> All responses are JSON. Errors are always `{ "error": string }`.

**Conventions:** `🔓` public · `🔒` logged in · `🛡️` admin.
IDs are opaque strings (`user-…`, `opp-…`, `src-…`, `scan-…`).
Timestamps are ISO-8601 UTC.

Set this up once for the examples below:

```bash
API=http://localhost:4000/api
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"demo@oppscan.io","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH="Authorization: Bearer $TOKEN"
```

---

## Health

### `GET /api/health` 🔓

```bash
curl $API/health
# {"ok":true,"service":"oppscan-api","time":"2026-10-04T09:18:21.652Z"}
```

---

## Auth

### `POST /api/auth/register` 🔓 → `201 { user, token }`

```bash
curl -X POST $API/auth/register -H 'Content-Type: application/json' -d '{
  "name": "Ada Lovelace", "email": "ada@example.com", "password": "secret123"
}'
```

Validation: name 2–60 chars · valid email (lowercased, unique) · password 6–72 chars.
`409` if the email is taken. `User` shape (§ Schemas) — never includes `passwordHash`.

### `POST /api/auth/login` 🔓 → `200 { user, token }`

```bash
curl -X POST $API/auth/login -H 'Content-Type: application/json' -d '{
  "email": "demo@oppscan.io", "password": "demo1234"
}'
```

`401` with a generic message on unknown email **or** wrong password (no account enumeration).

### `GET /api/auth/me` 🔒 → `200 { user }`

```bash
curl $API/auth/me -H "$AUTH"
```

### `PATCH /api/auth/me` 🔒 → `200 { user }`

```bash
curl -X PATCH $API/auth/me -H "$AUTH" -H 'Content-Type: application/json' -d '{
  "name": "Demo Power-User"
}'
```

---

## Opportunities

### `GET /api/opportunities` 🔓 (+`saved` flags when authed)

Paginated browse with search / filter / sort. Returns
`{ items, total, page, pages, limit, facets }`.

| Query | Meaning | Example |
|-------|---------|---------|
| `q` | Full-text over title, org, description, category, tags | `q=solar` |
| `type` | Exact type | `type=Grant` |
| `category` | Exact category | `category=Climate` |
| `location` | Case-insensitive substring | `location=lagos` |
| `remote` | `true` → remote only | `remote=true` |
| `minScore` | Score floor 0–100 | `minScore=80` |
| `status` | `open` / `closing-soon` / `closed` | `status=open` |
| `featured` | `true` → featured only | `featured=true` |
| `sort` | `newest` (default) · `score` · `deadline` · `amount` | `sort=score` |
| `page` / `limit` | Pagination (limit clamped 1–50, default 12) | `page=2&limit=12` |

```bash
# Top-scored remote grants:
curl "$API/opportunities?type=Grant&remote=true&sort=score&limit=3" -H "$AUTH"
```

`facets` (for building filter UIs — types with counts, all categories, all sources)
is included in **every** response.

### `GET /api/opportunities/featured` 🔓 → `{ items[≤6] }`

Featured + not closed, by score desc. Powers the landing page.

### `GET /api/opportunities/:id` 🔓 → `{ item, similar[≤3] }`

Fetches detail, **increments `views`**, recomputes score, and returns up to 3
similar listings (same type or category, by score). `404` if missing.

### `POST /api/opportunities` 🔒 → `201 { item }`

Submit a listing. `source` is forced to `"Community submission"`, `postedBy` to
you, `featured` to `false`; score is computed server-side.

```bash
curl -X POST $API/opportunities -H "$AUTH" -H 'Content-Type: application/json' -d '{
  "title": "Solidity Auditor (Contract)",
  "organization": "Vault DAO",
  "type": "Freelance",
  "category": "Security",
  "description": "At least sixty characters describing the work, the stack, and how to apply…",
  "location": "Remote",
  "remote": true,
  "amountMin": 8000, "amountMax": 15000, "currency": "USD",
  "deadline": "2026-11-30T00:00:00.000Z",
  "url": "https://example.com/apply",
  "tags": ["solidity", "audit"]
}'
```

Required: `title` (5–140) · `organization` · `type` · `category` · `description`
(≥60 chars) · `location` · valid `url`. Optional: `remote`, `amountMin/Max`,
`currency`, `deadline` (ISO datetime), `tags[≤10]`, `status`.

### `PUT /api/opportunities/:id` 🔒 → `200 { item }`

Partial update; **owner or admin only** (`403` otherwise). Same field rules as
create. Score recomputes; `updatedAt` bumps.

### `DELETE /api/opportunities/:id` 🔒 → `200 { ok: true }`

Owner or admin only. Also removes all bookmarks pointing at the listing.

### `POST /api/opportunities/:id/apply` 🔒 → `200 { item }`

Tracks an outbound application click: `applicantsCount + 1`, score recompute.
The frontend then opens `item.url` in a new tab.

---

## Saved (bookmarks)

All 🔒. Save/unsave are **idempotent** — repeating is a safe no-op.

```bash
curl -X POST $API/saved/<oppId> -H "$AUTH"      # → 201 { saved: true }
curl -X DELETE $API/saved/<oppId> -H "$AUTH"    # → 200 { saved: false }
curl $API/saved -H "$AUTH"                      # → { items, total }
```

---

## Dashboard

### `GET /api/dashboard/stats` 🔒

One call powering the whole dashboard:

```jsonc
{
  "totals": { "opportunities": 28, "open": 28, "closingSoon": 2, "saved": 2,
              "postedByMe": 0, "sources": 6, "scans": 1 },
  "byType": [{ "type": "Job", "count": 5, "open": 5 }, /* …×6 */],
  "scoreBuckets": [{ "range": "0–59", "count": 1 }, /* …×4 */],
  "closingSoon": [/* ≤5, deadline within 14d, soonest first */],
  "mine": [/* ≤5 of my submissions, newest first */],
  "latest": [/* ≤5 newest overall, with `saved` flags */],
  "avgScore": 84
}
```

---

## Scanner

### `GET /api/sources` 🔓 → `{ items: Source[] }`

Configured sources with `status`, `lastScanAt`, `foundCount`.

### `GET /api/scans` 🔓 → `{ items: ScanRun[] }` (newest first)

### `POST /api/scan` 🔒 → `201 { run, items }`

Simulates a scan across all `active` sources: adds 1–3 fresh listings from a
rotating pool, stamps source metadata, records the run.

```bash
curl -X POST $API/scan -H "$AUTH"
# {"run":{"id":"scan-…","sourcesScanned":5,"newFound":2,…},"items":[…]}
```

---

## Admin

All 🛡️ (admin JWT required; `403` otherwise).

### `GET /api/admin/overview`

```jsonc
{ "users": 3, "opportunities": 28, "saved": 2, "scans": 1,
  "usersList": [/* PublicUser[] */] }
```

### `PATCH /api/admin/opportunities/:id/feature`

```bash
curl -X PATCH $API/admin/opportunities/<oppId>/feature \
  -H "$AUTH_ADMIN" -H 'Content-Type: application/json' -d '{"featured": true}'
# → { item }
```

Omit the body or pass `{"featured": false}` to unfeature.

---

## Schemas

```ts
type OpportunityType = "Job" | "Grant" | "Tender" | "Freelance" | "Funding" | "Scholarship";
type OpportunityStatus = "open" | "closing-soon" | "closed";

interface User {           // passwordHash NEVER serialized
  id: string; name: string; email: string;
  role: "user" | "admin"; avatarColor: string; createdAt: string;
}

interface Opportunity {
  id: string; title: string; organization: string;
  type: OpportunityType; category: string; description: string;
  location: string; remote: boolean;
  amountMin: number | null; amountMax: number | null; currency: string | null;
  deadline: string | null; url: string; source: string; tags: string[];
  status: OpportunityStatus; featured: boolean;
  applicantsCount: number; views: number; score: number; // 0–100
  postedBy: string | null; createdAt: string; updatedAt: string;
  saved?: boolean;         // present on browse/detail/latest when authed
}

interface Source {
  id: string; name: string; kind: OpportunityType | "Mixed"; url: string;
  status: "active" | "paused" | "error";
  lastScanAt: string | null; foundCount: number;
}

interface ScanRun {
  id: string; startedAt: string; finishedAt: string;
  sourcesScanned: number; newFound: number; newIds: string[];
  status: "completed";
}
```

---

## Status codes & errors

| Code | When |
|------|------|
| `200 / 201` | Success |
| `400` | Zod validation failed — `error` names the first problem |
| `401` | Missing/invalid/expired token, or bad login |
| `403` | Authenticated but not allowed (not owner, not admin) |
| `404` | Unknown opportunity / endpoint |
| `409` | Email already registered |
| `500` | Server bug (message hidden in production) |

TypeScript sources of truth: `backend/src/types.ts` (server) and
`frontend/src/types.ts` (client) — keep all three (incl. this doc) in sync.
