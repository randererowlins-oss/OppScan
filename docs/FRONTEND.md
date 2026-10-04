# 🎨 FRONTEND — SPA conventions & internals

> Stack: React 18 · Vite 5 · TypeScript (strict) · Tailwind 3 · React Router 6 ·
> Axios · Recharts · lucide-react. Entry: `src/main.tsx`. Port: `5173`.

---

## 1 · Tour of `src/`

```
src/
├── main.tsx               React root + global CSS import
├── App.tsx                router: 10 routes + guards (route map in file header)
├── index.css              Tailwind + design tokens (.btn, .input, .card, .chip…)
├── vite-env.d.ts          Vite client types
├── types.ts               client mirror of backend types (keep in sync)
├── api/client.ts          THE api layer: Axios instance, token attach,
│                          apiError(), authApi · opportunitiesApi · savedApi ·
│                          dashboardApi · scanApi · adminApi
├── context/AuthContext.tsx user + token lifecycle (login/register/logout/refresh)
├── utils/format.ts        timeAgo · formatDate · deadlineCountdown · formatMoney ·
│                          initials · scoreTone · typeTone
├── components/
│   ├── Navbar.tsx         top nav (desktop + mobile) + auth-aware actions
│   ├── Layout.tsx         Navbar + <main> + footer shell
│   ├── OpportunityCard.tsx the ONE listing card (Browse/Saved/Dashboard/Landing)
│   └── bits.tsx           ProtectedRoute · AdminRoute · CenteredSpinner ·
│                          EmptyState · ErrorBanner · StatCard
└── pages/
    ├── Landing.tsx        hero + featured + features + how-it-works (public)
    ├── Auth.tsx           Login + Register (prefilled demo creds on login)
    ├── Browse.tsx         search (debounced) + filters + sort + pagination
    ├── Detail.tsx         full listing + apply/save/edit/delete + similar + score explainer
    ├── Dashboard.tsx      stats cards + Recharts bars + deadline watch + scan button
    ├── Saved.tsx          bookmark shortlist
    ├── Submit.tsx         create + ?id= edit form
    ├── Profile.tsx        avatar, counts, display-name edit
    ├── Admin.tsx          totals + featuring + sources + users + scan history
    └── NotFound.tsx       404
```

---

## 2 · Data flow (the only pattern)

```
Page ──▶ api/client.ts method ──▶ HTTP /api/* ──▶ setState ──▶ render
                ▲                                     │
                └── Bearer token auto-attached ───────┘
```

Rules:

- **Pages never import Axios** — every endpoint lives in `api/client.ts` with a
  typed signature. New endpoint? Add it there first.
- **Errors go through `apiError()`** — turns Axios failures into human
  sentences (`Cannot reach the API…`, server `{ error }`, timeouts).
- **Auth state lives only in `AuthContext`** — `user`, `loading`, and
  `login/register/logout/refresh`. Token in `localStorage` (`oppscan_token`).
- **No global store** (Redux/Zustand) — server state is fetched per page with
  `useEffect` + `useCallback`, which is plenty at this scale and keeps every
  page readable top-to-bottom.

---

## 3 · Routing & guards (`App.tsx`)

| Route | Access | Notes |
|-------|--------|-------|
| `/` | public | Landing |
| `/login`, `/register` | public | `Login` remembers `location.state.from` and returns there |
| `/browse` | public | Bookmark buttons render only when logged in |
| `/opportunities/:id` | public | Apply-tracking needs login; edit/delete need owner/admin |
| `/dashboard`, `/saved`, `/submit`, `/profile` | `ProtectedRoute` | Redirect to `/login` (with `from`) |
| `/submit?id=…` | protected | Edit mode: prefills + `PUT` |
| `/admin` | `AdminRoute` | Non-admins bounce to `/dashboard` |
| `*` | — | `NotFound` |

---

## 4 · The API client (`api/client.ts`)

- `baseURL`: `VITE_API_URL + /api` when set (production builds), else relative
  `/api` — which Vite proxies to `localhost:4000` in dev. **The browser never
  hardcodes a backend host**, so sandbox previews work untouched.
- Request interceptor attaches `Authorization: Bearer <token>` when present.
- `timeout: 15000` — slow networks get a friendly message, not a hang.
- One namespace per domain (`opportunitiesApi.list({ q, type, … })`), so pages
  read like English.

---

## 5 · Styling system (`index.css` + Tailwind)

- Font: Inter (Google Fonts, `index.html`). Brand colour: indigo (`brand-*`).
- **Component classes** (defined once, reused everywhere):
  `.btn` · `.btn-primary` · `.btn-secondary` · `.btn-ghost` · `.btn-danger` ·
  `.input` · `.label` · `.card` · `.chip` · `.page-title` · `.page-sub`
- Colour tones for data live in `utils/format.ts` (`scoreTone`, `typeTone`) so
  every page colours scores/types identically.
- Cards animate in with `.rise` (+ `rise-1…5` stagger). Icons: `lucide-react`.
- Dark hero on Landing; light surfaces elsewhere. Fully responsive (mobile nav
  collapses to a scrollable icon bar; grids stack).

---

## 6 · Page-by-page implementation notes

- **Browse** — search input debounces 350 ms into the committed query; every
  filter change resets to page 1; `facets` from the API drive type counts +
  category options; pagination is Prev/Next over `pages`.
- **Detail** — fetches `{ item, similar }`; `Apply now` calls `POST …/apply`
  (auth, once) then opens the canonical URL; owner/admin see Edit/Delete;
  the “Why this score?” card documents the weights inline.
- **Dashboard** — single `dashboardApi.stats()` call; Recharts vertical bars
  (by type) + histogram (score buckets); `Run scan` posts + reloads stats and
  shows the outcome banner.
- **Submit** — one form for create/edit (edit via `?id=`); tags as comma
  string → array; deadline `date` input → ISO; live char counter for the
  60-char description minimum.
- **Admin** — four parallel loads (`Promise.all`); feature toggles update
  optimistically-confirmed; scan history table from `/api/scans`.

---

## 7 · Conventions for new code

1. New page → add route in `App.tsx` (+ guard), link it in `Navbar` if primary.
2. New data → typed method in `api/client.ts`, typed state in the page.
3. New colours for data → helper in `utils/format.ts`, not inline classes.
4. Reuse `OpportunityCard`, `EmptyState`, `ErrorBanner`, `StatCard` before inventing.
5. Keep pages self-contained: fetch → loading spinner → error banner → content.
6. `npx tsc --noEmit` must pass; no `any` without a comment explaining why.

---

## 8 · Dev server specifics (`vite.config.ts`)

- Binds `0.0.0.0:5173` (container/sandbox friendly).
- `allowedHosts: true` — permits proxied preview hosts in dev.
- `/api` proxy → `VITE_API_URL ?? http://localhost:4000`.

Production builds (`npm run build` → `dist/`) are served by Nginx in Docker
(see `nginx.conf`: SPA fallback + `/api/` proxy to `api:4000`).
