import { Router } from "express";
import { store } from "../db";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { publicUser } from "../utils/auth";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin); // admins only, both checks

/** GET /api/admin/overview — user + content totals for the admin panel. */
adminRouter.get("/overview", (_req, res) => {
  res.json({
    users: store.data.users.length,
    opportunities: store.data.opportunities.length,
    saved: store.data.saved.length,
    scans: store.data.scans.length,
    usersList: store.data.users.map((u) => publicUser(u)),
  });
});

/**
 * PATCH /api/admin/opportunities/:id/feature — toggle homepage featuring.
 * Body: { featured: boolean }
 */
adminRouter.patch("/opportunities/:id/feature", (req, res) => {
  const opp = store.data.opportunities.find((o) => o.id === req.params.id);
  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  opp.featured = req.body?.featured !== false;
  opp.updatedAt = new Date().toISOString();
  store.save();
  res.json({ item: opp });
});
