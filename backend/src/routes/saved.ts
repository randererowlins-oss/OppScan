import { Router } from "express";
import { store } from "../db";
import { requireAuth, type AuthRequest } from "../middleware/auth";

export const savedRouter = Router();
savedRouter.use(requireAuth); // every saved-route needs a logged-in user

/** GET /api/saved — the user's bookmarked opportunities. */
savedRouter.get("/", (req: AuthRequest, res) => {
  const ids = new Set(
    store.data.saved
      .filter((s) => s.userId === req.user!.id)
      .map((s) => s.opportunityId),
  );
  const items = store.data.opportunities
    .filter((o) => ids.has(o.id))
    .map((o) => ({ ...o, saved: true }));
  res.json({ items, total: items.length });
});

/** POST /api/saved/:id — bookmark. Idempotent (re-saving is a no-op). */
savedRouter.post("/:id", (req: AuthRequest, res) => {
  const opp = store.data.opportunities.find((o) => o.id === req.params.id);
  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  const exists = store.data.saved.some(
    (s) => s.userId === req.user!.id && s.opportunityId === opp.id,
  );
  if (!exists) {
    store.data.saved.push({
      userId: req.user!.id,
      opportunityId: opp.id,
      createdAt: new Date().toISOString(),
    });
    store.save();
  }
  res.status(201).json({ saved: true });
});

/** DELETE /api/saved/:id — remove bookmark. Idempotent. */
savedRouter.delete("/:id", (req: AuthRequest, res) => {
  const before = store.data.saved.length;
  store.data.saved = store.data.saved.filter(
    (s) => !(s.userId === req.user!.id && s.opportunityId === req.params.id),
  );
  if (store.data.saved.length !== before) store.save();
  res.json({ saved: false });
});
