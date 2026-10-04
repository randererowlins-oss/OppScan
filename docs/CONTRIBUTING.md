# 🤝 CONTRIBUTING — how to work on OppScan

> Small repo, high standards, kind reviews. This guide keeps every contribution
> consistent with the codebase and docs.

---

## 1 · Ground rules

1. **Docs are code.** Changing behaviour without updating `docs/` (esp. `API.md`)
   is an incomplete PR.
2. **Types are the contract.** `backend/src/types.ts`, `frontend/src/types.ts`
   and `docs/API.md` stay in sync — all three, every time.
3. **Small PRs beat big ones.** One feature/fix per branch; < 400 lines preferred.
4. **Main is always green.** Typecheck + build + smoke suite pass before merge.

## 2 · Workflow

```bash
git checkout -b feat/my-thing        # or fix/… docs/…
# … make changes …
cd backend  && npx tsc --noEmit      # typecheck
cd frontend && npx tsc --noEmit
# run the smoke suite in docs/TESTING.md § 2 (API changes)
# walk the UI checklist in docs/TESTING.md § 3 (frontend changes)
git commit -m "feat: my thing"       # conventional commits, see § 5
git push -u origin feat/my-thing     # open a PR with the template below
```

### PR template (paste into the description)

```md
## What / why
## Screenshots (UI changes)
## Checks
- [ ] `tsc --noEmit` passes (backend + frontend)
- [ ] Smoke suite (§ TESTING.md) passes / N/A
- [ ] Docs updated (API.md / guides as needed)
- [ ] No secrets or local paths committed
```

## 3 · Code style

- TypeScript `strict`; prefer `unknown` over `any` (comment any escape hatch).
- Backend routes follow the 4-step pattern (validate → authorize → mutate+save → JSON)
  — see `docs/BACKEND.md` § 2. Never serialize `passwordHash`.
- Frontend: pages fetch via `api/client.ts` only; reuse `OpportunityCard`,
  `EmptyState`, `ErrorBanner`, `StatCard`; data colours via `utils/format.ts`.
- Styling: Tailwind + the shared classes in `index.css` (`.btn-*`, `.input`,
  `.card`, `.chip`). No inline hex colours for data tones.
- 2-space indent, double quotes, semicolons, trailing commas (match existing files).
- Comments explain **why**, not what — file headers state ownership.

## 4 · Adding features (checklists)

**New endpoint:** Zod schema → guard (`optionalAuth`/`requireAuth`/`requireAdmin`) →
route → `store.save()` → typed client method → `API.md` entry + curl example →
smoke test.

**New page:** route in `App.tsx` (+ guard) → Navbar link if primary → fetch via
client → spinner/error/empty/content states → `USER_GUIDE.md` entry → UI checklist.

**New docs page:** link it from `README.md` (index table) and from the most
relevant existing doc.

## 5 · Commit messages (Conventional Commits)

`feat:` · `fix:` · `docs:` · `style:` · `refactor:` · `test:` · `chore:`
— imperative mood, ≤ 72 chars, e.g. `feat: add deadline countdown to cards`.

## 6 · What makes a great first issue?

Seed more `SCAN_POOL` entries · add table-tests for `computeScore()` · improve
empty/loading states · write the Playwright checklist · translate the user guide.
Ask in an issue if you're unsure — mentoring is part of the deal.
