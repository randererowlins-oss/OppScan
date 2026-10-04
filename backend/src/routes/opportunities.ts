import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { store } from "../db";
import {
  optionalAuth,
  requireAuth,
  type AuthRequest,
} from "../middleware/auth";
import type { Opportunity, OpportunityType } from "../types";
import { computeScore } from "../utils/scoring";

export const opportunitiesRouter = Router();

const TYPES: OpportunityType[] = [
  "Job",
  "Grant",
  "Tender",
  "Freelance",
  "Funding",
  "Scholarship",
];

const upsertSchema = z.object({
  title: z.string().trim().min(5).max(140),
  organization: z.string().trim().min(2).max(120),
  type: z.enum(["Job", "Grant", "Tender", "Freelance", "Funding", "Scholarship"]),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(60, "Description must be at least 60 characters"),
  location: z.string().trim().min(2).max(120),
  remote: z.boolean().default(false),
  amountMin: z.number().positive().nullable().optional(),
  amountMax: z.number().positive().nullable().optional(),
  currency: z.string().trim().max(8).nullable().optional(),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
  url: z.string().trim().url("Must be a valid URL"),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  status: z.enum(["open", "closing-soon", "closed"]).default("open"),
});

type SortKey = "newest" | "score" | "deadline" | "amount";

/** Collect distinct filter facets for the browse page (types, categories…). */
function facets() {
  const opps = store.data.opportunities;
  return {
    types: TYPES.map((t) => ({
      value: t,
      count: opps.filter((o) => o.type === t).length,
    })),
    categories: [...new Set(opps.map((o) => o.category))].sort(),
    sources: [...new Set(opps.map((o) => o.source))].sort(),
  };
}

function withSavedFlag<T extends Opportunity>(
  opp: T,
  userId?: string,
): T & { saved: boolean } {
  const saved =
    !!userId &&
    store.data.saved.some(
      (s) => s.userId === userId && s.opportunityId === opp.id,
    );
  return { ...opp, saved };
}

/**
 * GET /api/opportunities
 * Query: q, type, category, location, remote(true), minScore, status,
 *        sort(newest|score|deadline|amount), page, limit, featured(true)
 * Returns paginated listings + facets. `saved` flag included when authed.
 */
opportunitiesRouter.get("/", optionalAuth, (req: AuthRequest, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const type = String(req.query.type ?? "");
  const category = String(req.query.category ?? "");
  const location = String(req.query.location ?? "").trim().toLowerCase();
  const remoteOnly = req.query.remote === "true";
  const featuredOnly = req.query.featured === "true";
  const status = String(req.query.status ?? "");
  const minScore = Number(req.query.minScore ?? 0);
  const sort = (String(req.query.sort ?? "newest") as SortKey) || "newest";
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 12) || 12));

  let items = [...store.data.opportunities];

  if (q) {
    items = items.filter((o) =>
      [o.title, o.organization, o.description, o.category, ...o.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (type && TYPES.includes(type as OpportunityType)) {
    items = items.filter((o) => o.type === type);
  }
  if (category) items = items.filter((o) => o.category === category);
  if (location) {
    items = items.filter((o) => o.location.toLowerCase().includes(location));
  }
  if (remoteOnly) items = items.filter((o) => o.remote);
  if (featuredOnly) items = items.filter((o) => o.featured);
  if (status) items = items.filter((o) => o.status === status);
  if (minScore > 0) items = items.filter((o) => o.score >= minScore);

  const byDeadline = (o: Opportunity) =>
    o.deadline ? new Date(o.deadline).getTime() : Number.MAX_SAFE_INTEGER;
  switch (sort) {
    case "score":
      items.sort((a, b) => b.score - a.score);
      break;
    case "deadline":
      items.sort((a, b) => byDeadline(a) - byDeadline(b));
      break;
    case "amount":
      items.sort((a, b) => (b.amountMax ?? 0) - (a.amountMax ?? 0));
      break;
    default:
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const slice = items
    .slice((page - 1) * limit, page * limit)
    .map((o) => withSavedFlag(o, req.user?.id));

  res.json({ items: slice, total, page, pages, limit, facets: facets() });
});

/** GET /api/opportunities/featured — top featured by score (max 6). */
opportunitiesRouter.get("/featured", optionalAuth, (req: AuthRequest, res) => {
  const items = store.data.opportunities
    .filter((o) => o.featured && o.status !== "closed")
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((o) => withSavedFlag(o, req.user?.id));
  res.json({ items });
});

/** GET /api/opportunities/:id — detail (increments view counter). */
opportunitiesRouter.get("/:id", optionalAuth, (req: AuthRequest, res) => {
  const opp = store.data.opportunities.find((o) => o.id === req.params.id);
  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  opp.views += 1;
  opp.score = computeScore(opp); // demand signal feeds back into score
  store.save();

  const similar = store.data.opportunities
    .filter((o) => o.id !== opp.id && (o.type === opp.type || o.category === opp.category))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((o) => withSavedFlag(o, req.user?.id));

  res.json({ item: withSavedFlag(opp, req.user?.id), similar });
});

/** POST /api/opportunities — submit a listing (auth required). */
opportunitiesRouter.post("/", requireAuth, (req: AuthRequest, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const d = parsed.data;
  const timestamp = new Date().toISOString();
  const opp: Opportunity = {
    id: `opp-${nanoid(12)}`,
    title: d.title,
    organization: d.organization,
    type: d.type,
    category: d.category,
    description: d.description,
    location: d.location,
    remote: d.remote,
    amountMin: d.amountMin ?? null,
    amountMax: d.amountMax ?? null,
    currency: d.currency ?? null,
    deadline: d.deadline ?? null,
    url: d.url,
    source: "Community submission",
    tags: d.tags,
    status: d.status,
    featured: false,
    applicantsCount: 0,
    views: 0,
    score: 0,
    postedBy: req.user!.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  opp.score = computeScore(opp);
  store.data.opportunities.unshift(opp);
  store.save();
  res.status(201).json({ item: withSavedFlag(opp, req.user!.id) });
});

/** PUT /api/opportunities/:id — edit (owner or admin). */
opportunitiesRouter.put("/:id", requireAuth, (req: AuthRequest, res) => {
  const opp = store.data.opportunities.find((o) => o.id === req.params.id);
  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  const isOwner = opp.postedBy === req.user!.id;
  if (!isOwner && req.user!.role !== "admin") {
    res.status(403).json({ error: "Only the author or an admin can edit this" });
    return;
  }
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  Object.assign(opp, parsed.data, { updatedAt: new Date().toISOString() });
  opp.score = computeScore(opp);
  store.save();
  res.json({ item: withSavedFlag(opp, req.user!.id) });
});

/** DELETE /api/opportunities/:id — remove (owner or admin). */
opportunitiesRouter.delete("/:id", requireAuth, (req: AuthRequest, res) => {
  const idx = store.data.opportunities.findIndex((o) => o.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  const opp = store.data.opportunities[idx];
  const isOwner = opp.postedBy === req.user!.id;
  if (!isOwner && req.user!.role !== "admin") {
    res.status(403).json({ error: "Only the author or an admin can delete this" });
    return;
  }
  store.data.opportunities.splice(idx, 1);
  store.data.saved = store.data.saved.filter(
    (s) => s.opportunityId !== opp.id,
  );
  store.save();
  res.json({ ok: true });
});

/** POST /api/opportunities/:id/apply — track an application click. */
opportunitiesRouter.post("/:id/apply", requireAuth, (req: AuthRequest, res) => {
  const opp = store.data.opportunities.find((o) => o.id === req.params.id);
  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  opp.applicantsCount += 1;
  opp.score = computeScore(opp);
  store.save();
  res.json({ item: withSavedFlag(opp, req.user!.id) });
});
