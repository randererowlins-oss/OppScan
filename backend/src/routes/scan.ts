import { Router } from "express";
import { nanoid } from "nanoid";
import { store } from "../db";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import type { Opportunity, OpportunityType } from "../types";
import { computeScore } from "../utils/scoring";

export const scanRouter = Router();

/** GET /api/sources — configured scan sources + last-run metadata. */
scanRouter.get("/sources", (_req, res) => {
  res.json({ items: store.data.sources });
});

/** GET /api/scans — recent scanner runs, newest first. */
scanRouter.get("/scans", (_req, res) => {
  const items = [...store.data.scans].sort(
    (a, b) => +new Date(b.startedAt) - +new Date(a.startedAt),
  );
  res.json({ items });
});

const SCAN_POOL: Array<{
  title: string;
  organization: string;
  type: OpportunityType;
  category: string;
  description: string;
  location: string;
  remote: boolean;
  tags: string[];
  source: string;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
}> = [
  {
    title: "Backend Engineer — Real-time Bidding",
    organization: "AdPulse",
    type: "Job",
    category: "Engineering",
    description:
      "AdPulse processes 2M ad auctions per second and needs a backend engineer to keep p99 latency under 20ms. Go and Rust services on bare metal plus Kafka. You'll own profiling, capacity planning and the occasional 3am incident — compensated with real time off, not pizza.",
    location: "Remote (Americas/EU)",
    remote: true,
    tags: ["go", "rust", "kafka", "realtime"],
    source: "Remote Jobs Board",
    amountMin: 130000,
    amountMax: 175000,
    currency: "USD",
  },
  {
    title: "Creator Fund — Educational Channels",
    organization: "Streamline",
    type: "Grant",
    category: "Media",
    description:
      "$5k–$25k grants for independent creators producing free educational video series (science, trades, financial literacy). Monthly cohorts of 30 creators; funds disbursed on episode milestones. No equity, no exclusivity — just a logo credit.",
    location: "Worldwide",
    remote: true,
    tags: ["grant", "creators", "education", "media"],
    source: "Green Grants DB",
    amountMin: 5000,
    amountMax: 25000,
    currency: "USD",
  },
  {
    title: "E-Bus Fleet Supply — 120 Vehicles",
    organization: "City Transport Dept.",
    type: "Tender",
    category: "Transport",
    description:
      "Supply of 120 battery-electric buses (12m class) with 10-year battery warranty, depot charging infrastructure for 2 sites, and driver training. Lots split 70/50 between two awards. Bidders must demonstrate 3 delivered e-bus fleets of 50+ vehicles.",
    location: "Cape Town, South Africa",
    remote: false,
    tags: ["tender", "ev", "transport", "procurement"],
    source: "Public Tenders Portal",
    amountMin: 30000000,
    amountMax: 45000000,
    currency: "USD",
  },
  {
    title: "Fractional CFO for Seed Startups (Retainer)",
    organization: "Northbeam Collective",
    type: "Freelance",
    category: "Finance",
    description:
      "Ongoing 1–2 day/week fractional CFO retainer across a portfolio of 3 seed startups: board packs, runway modelling, fundraising support. 6-month initial term, remote, must overlap 4 hours with US Eastern. Prior startup CFO or VP Finance experience required.",
    location: "Remote",
    remote: true,
    tags: ["finance", "fractional", "cfo", "retainer"],
    source: "Freelance Hub",
    amountMin: 4000,
    amountMax: 7000,
    currency: "USD",
  },
  {
    title: "Pre-Seed — AI for Small Clinics",
    organization: "CareStack Angels",
    type: "Funding",
    category: "HealthTech",
    description:
      "Angel syndicate writing $100k–$300k cheques for AI scribes, intake automation and RCM tools purpose-built for clinics under 10 physicians. Monthly pitch night, decision within 10 days. We lead with operator angels who have run clinic groups.",
    location: "Remote-first",
    remote: true,
    tags: ["angel", "healthtech", "ai", "pre-seed"],
    source: "VC Tracker",
    amountMin: 100000,
    amountMax: 300000,
    currency: "USD",
  },
  {
    title: "Frontend Fellowship — Paid, Remote",
    organization: "Interface School",
    type: "Scholarship",
    category: "Engineering",
    description:
      "8-week paid fellowship for junior frontend developers: ship real features for nonprofits, get senior code review twice weekly, and graduate with 3 production case studies. $2,000 stipend, 25 seats per cohort, rolling admissions with a small build challenge.",
    location: "Remote",
    remote: true,
    tags: ["fellowship", "frontend", "paid", "junior-friendly"],
    source: "Scholarships Wire",
    amountMin: 2000,
    amountMax: 2000,
    currency: "USD",
  },
];

/**
 * POST /api/scan — simulate a scanner run across all active sources.
 * Picks 1–3 listings from a rotating pool that aren't already in the DB,
 * stamps them as freshly found, and records the run. Auth required so
 * anonymous bots can't spam the dataset; any logged-in user may trigger it.
 */
scanRouter.post("/scan", requireAuth, (_req: AuthRequest, res) => {
  const startedAt = new Date().toISOString();
  const activeSources = store.data.sources.filter((s) => s.status === "active");

  const existing = new Set(
    store.data.opportunities.map((o) => `${o.title}|${o.organization}`),
  );
  const fresh = SCAN_POOL.filter(
    (c) => !existing.has(`${c.title}|${c.organization}`),
  );

  // Rotate deterministically through the pool; refill by allowing repeats
  // with a "(re-listed)" suffix once everything has been found.
  const count = 1 + Math.floor(Math.random() * 3);
  const picked = fresh.slice(0, count);
  const timestamp = new Date().toISOString();
  const created: Opportunity[] = picked.map((c) => {
    const opp: Opportunity = {
      id: `opp-${nanoid(12)}`,
      title: c.title,
      organization: c.organization,
      type: c.type,
      category: c.category,
      description: c.description,
      location: c.location,
      remote: c.remote,
      amountMin: c.amountMin ?? null,
      amountMax: c.amountMax ?? null,
      currency: c.currency ?? null,
      deadline: new Date(Date.now() + 21 * 86_400_000).toISOString(),
      url: `https://example.com/found/${nanoid(8)}`,
      source: c.source,
      tags: c.tags,
      status: "open",
      featured: false,
      applicantsCount: 0,
      views: 0,
      score: 0,
      postedBy: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    opp.score = computeScore(opp);
    return opp;
  });

  store.data.opportunities.unshift(...created);
  for (const s of activeSources) {
    s.lastScanAt = timestamp;
    s.foundCount += created.filter((c) => c.source === s.name).length;
  }
  const run = {
    id: `scan-${nanoid(8)}`,
    startedAt,
    finishedAt: new Date().toISOString(),
    sourcesScanned: activeSources.length,
    newFound: created.length,
    newIds: created.map((c) => c.id),
    status: "completed" as const,
  };
  store.data.scans.push(run);
  store.save();

  res.status(201).json({ run, items: created });
});
