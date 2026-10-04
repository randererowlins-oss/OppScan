# 🧪 TESTING — prove it works

> OppScan ships with type-safety + a scripted smoke suite + a manual UI
> checklist. (Automated unit/E2E suites are on the roadmap — the seams are
> ready: pure `computeScore()`, thin routes, page-level data fetching.)

---

## 1 · Typecheck (30 seconds, run always)

```bash
cd backend  && npx tsc --noEmit   # must exit 0 with no output
cd frontend && npx tsc --noEmit   # must exit 0 with no output
```

## 2 · API smoke suite (2 minutes, scripted)

Assumes the API runs on `:4000` (fresh seed recommended: stop server →
`npm run seed` → restart). Run top-to-bottom — each step builds on the last:

```bash
API=http://localhost:4000/api

echo "── 1 · health ──"
curl -sf $API/health  # {"ok":true,…}

echo "── 2 · register ──"
curl -sf -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"QA Tester","email":"qa@test.io","password":"qa123456"}'

echo "── 3 · login (member) ──"
TOKEN=$(curl -sf -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"demo@oppscan.io","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH="Authorization: Bearer $TOKEN"; echo "token ok (${#TOKEN} chars)"

echo "── 4 · wrong password rejected ──"
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@oppscan.io","password":"nope"}'  # → 401

echo "── 5 · browse + facets ──"
curl -sf "$API/opportunities?type=Grant&sort=score&limit=2" -H "$AUTH" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('total:',d['total'],'| facets:',sorted(d['facets'].keys()))"

echo "── 6 · detail bumps views ──"
ID=$(curl -sf "$API/opportunities?limit=1" | python3 -c "import sys,json; print(json.load(sys.stdin)['items'][0]['id'])")
V1=$(curl -sf $API/opportunities/$ID | python3 -c "import sys,json; print(json.load(sys.stdin)['item']['views'])")
V2=$(curl -sf $API/opportunities/$ID | python3 -c "import sys,json; print(json.load(sys.stdin)['item']['views'])")
echo "views $V1 → $V2 (must increment by 1)"

echo "── 7 · save → list → unsave (idempotent) ──"
curl -sf -X POST $API/saved/$ID -H "$AUTH"
curl -sf -X POST $API/saved/$ID -H "$AUTH"  # repeat: still 201
curl -sf $API/saved -H "$AUTH" | python3 -c "import sys,json; print('saved total:',json.load(sys.stdin)['total'])"
curl -sf -X DELETE $API/saved/$ID -H "$AUTH"
curl -sf -X DELETE $API/saved/$ID -H "$AUTH"  # repeat: still 200

echo "── 8 · submit → edit → apply → delete (owner) ──"
OID=$(curl -sf -X POST $API/opportunities -H "$AUTH" -H 'Content-Type: application/json' -d '{
  "title":"QA Contract Role","organization":"QA Corp","type":"Freelance",
  "category":"Testing","description":"A sufficiently long description of the QA contract role, its scope, and how to apply for it.",
  "location":"Remote","remote":true,"url":"https://example.com/qa"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['item']['id'])")
echo "created $OID"
curl -sf -X PUT $API/opportunities/$OID -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"title":"QA Contract Role (Updated)"}' > /dev/null
curl -sf -X POST $API/opportunities/$OID/apply -H "$AUTH" \
  | python3 -c "import sys,json; print('applicants:',json.load(sys.stdin)['item']['applicantsCount'])"
curl -sf -X DELETE $API/opportunities/$OID -H "$AUTH"  # → {"ok":true}

echo "── 9 · auth guards ──"
curl -s -o /dev/null -w "no-token dashboard → %{http_code}\n" $API/dashboard/stats  # → 401
curl -s -o /dev/null -w "member admin     → %{http_code}\n" $API/admin/overview -H "$AUTH"  # → 403

echo "── 10 · scan + dashboard + admin (as admin) ──"
ADMIN=$(curl -sf -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@oppscan.io","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -sf -X POST $API/scan -H "Authorization: Bearer $ADMIN" \
  | python3 -c "import sys,json; print('scan newFound:',json.load(sys.stdin)['run']['newFound'])"
curl -sf $API/dashboard/stats -H "$AUTH" \
  | python3 -c "import sys,json; print('dashboard totals:',json.load(sys.stdin)['totals'])"
curl -sf $API/admin/overview -H "Authorization: Bearer $ADMIN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('users:',d['users'],'opps:',d['opportunities'])"

echo "ALL SMOKE TESTS DONE ✔"
```

**Pass criteria:** every `curl -sf` exits 0; step 4 → 401; step 9 → 401 then 403;
step 6 views increment by exactly 1.

## 3 · UI checklist (5 minutes, manual)

With both servers running, walk this as `demo@oppscan.io`:

- [ ] `/` Landing renders hero + 6 featured cards (no console errors).
- [ ] `/browse` search `grant` narrows results; type rail counts match; min-score
      slider filters; sort changes order; pagination advances.
- [ ] Card → Detail shows full info; **Apply now** opens URL in a new tab;
      bookmark toggles and persists after reload.
- [ ] `/dashboard` shows 4 stat cards + 2 charts; **Run scan** banner appears
      and totals update.
- [ ] `/saved` lists bookmarks; removing one updates instantly.
- [ ] `/submit` validates (short description blocked with message); publish →
      lands on new Detail page with a real score.
- [ ] `/profile` name edit persists across reload.
- [ ] Log out → `/dashboard` redirects to `/login`; log back in returns to `/dashboard`.
- [ ] As `admin@oppscan.io`: `/admin` loads; feature a listing → appears on `/`.
- [ ] Mobile width (≤390px): nav collapses, cards stack, no horizontal scroll.

## 4 · Production-build check

```bash
cd backend  && npm run build && npm start  # serves compiled JS on :4000
cd frontend && npm run build               # tsc + vite build → dist/
```

Both must complete with zero errors. Serve `frontend/dist` via the Docker
`web` service (or any static host + `/api` proxy) for the full prod shape.

## 5 · Roadmap: automated suites

- **Unit:** `computeScore()` table-tests + Zod schema tests (Vitest).
- **API:** Supertest per-route tests with an isolated `DB_FILE`.
- **E2E:** Playwright over the § 3 checklist, seeded via `npm run seed`.
- **CI:** install → typecheck → build → smoke suite on every PR.
