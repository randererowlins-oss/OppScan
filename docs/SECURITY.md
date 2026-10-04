# 🔒 SECURITY — threat model & hardening

> OppScan is a demo-grade app with production-shaped habits. This doc states
> what's protected, what isn't, and exactly what to do before handling real users.

---

## 1 · What's already in place

| Control | Where | Detail |
|---------|-------|--------|
| Password hashing | `backend/src/utils/auth.ts` | bcrypt, cost 10; hashes never serialized (`publicUser()`) |
| Stateless auth | `middleware/auth.ts` | JWT HS256, 7-day expiry; user re-loaded per request (deleted users lose access immediately) |
| Auth guards | routes | `requireAuth` (user) · `requireAdmin` (admin) · owner-or-admin checks on edit/delete |
| Input validation | every mutating route | Zod schemas; unknown fields stripped (clients can't set `score`, `featured`, `role`, …) |
| Login anti-enumeration | `POST /auth/login` | Identical 401 for unknown email vs wrong password |
| Security headers | `app.ts` | `helmet()` defaults |
| CORS allow-list | `app.ts` | `CORS_ORIGIN` env (comma-separated) |
| Body limits | `app.ts` | `express.json({ limit: "256kb" })` |
| Error hygiene | `app.ts` | Stack traces / internals hidden when `NODE_ENV=production` |
| Prod secret fail-fast | `config.ts` | Refuses to boot in production with the dev `JWT_SECRET` |
| Atomic writes | `db.ts` | tmp-file + rename; no half-written DB on crash |

---

## 2 · Known limitations (read before going live)

| # | Limitation | Risk | Fix |
|---|------------|------|-----|
| 1 | JWT in `localStorage` | XSS could steal tokens | Move to httpOnly `Secure` cookies + CSRF tokens (§ 3) |
| 2 | No rate limiting | Credential-stuffing / scan-spam | `express-rate-limit`: strict on `/auth/*`, lenient elsewhere |
| 3 | No email verification / password reset | Anyone can register any email | Add verification + reset flow before real users |
| 4 | Single-file JSON DB | No concurrent-write safety across processes | Migrate to Postgres ([`DATABASE.md`](DATABASE.md) § 6) before scaling |
| 5 | `description` rendered as plain text | Safe today — but if you ever render HTML/Markdown, sanitize it | DOMPurify on render + sanitize on write |
| 6 | No audit logging | Admin actions aren't traced | Append admin events to a log / table |
| 7 | CORS `*` risk | Misconfig could over-share | Keep `CORS_ORIGIN` to exact origins; never `*` with credentials |
| 8 | Demo creds in docs/seed | Attackers try them first | Reseed/rotate in production; force password change |

---

## 3 · Recommended hardening checklist (pre-launch)

- [ ] Cookies: `httpOnly; Secure; SameSite=Lax` session or JWT + CSRF double-submit.
- [ ] Rate limits: 10/min/IP on auth, 60/min/IP on scan/submit, 300/min/IP global.
- [ ] Helmet CSP tuned for your frontend origin; HSTS via your TLS terminator.
- [ ] TLS everywhere (Caddy/Cloudflare/autocert) + redirect http→https.
- [ ] `JWT_EXPIRES_IN` shorter (e.g. `1d`) + refresh-token rotation.
- [ ] Log auth failures + admin actions; ship logs off-box.
- [ ] Back up `db.json` (or Postgres) daily; test restores.
- [ ] `npm audit` in CI; Dependabot/Renovate for updates.
- [ ] Remove/purge demo users; require strong passwords (length ≥ 12 or zxcvbn).

---

## 4 · Reporting a vulnerability

Open a **private** report via GitHub Security Advisories on this repo (or email
the maintainers). Please include: affected version/commit, reproduction steps,
and impact. Do not open public issues for security bugs.
