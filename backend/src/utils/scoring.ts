import type { Opportunity } from "../types";

/**
 * ─── OppScan opportunity score (0–100) ────────────────────────────
 * A transparent, deterministic heuristic that answers:
 * "How complete, fresh and attractive is this listing?"
 *
 * The weights are deliberately simple so they can be explained in the UI
 * and tuned later (or replaced by an ML model without changing the API).
 *
 * Breakdown (max 100):
 *  • Listing completeness …………… 30  (description length, tags, amount, url)
 *  • Freshness ……………………… 25  (decays over 60 days; closing-soon capped)
 *  • Demand signal …………………… 20  (views + applicants, log-scaled)
 *  • Compensation clarity …………… 15  (has amount range + currency)
 *  • Curation boost …………………… 10  (featured listings)
 */
export function computeScore(
  opp: Pick<
    Opportunity,
    | "description"
    | "tags"
    | "amountMin"
    | "amountMax"
    | "currency"
    | "createdAt"
    | "deadline"
    | "views"
    | "applicantsCount"
    | "featured"
    | "status"
  >,
): number {
  let score = 0;

  // 1) Completeness (0–30)
  const descLen = opp.description.trim().length;
  if (descLen > 600) score += 12;
  else if (descLen > 300) score += 9;
  else if (descLen > 120) score += 6;
  else score += 3;
  if (opp.tags.length >= 3) score += 8;
  else score += opp.tags.length * 2;
  if (opp.amountMin != null || opp.amountMax != null) score += 6;
  else score += 2;
  score += 4; // has canonical URL (required field)

  // 2) Freshness (0–25) — linear decay over 60 days
  const ageDays =
    (Date.now() - new Date(opp.createdAt).getTime()) / 86_400_000;
  const freshness = Math.max(0, 25 * (1 - ageDays / 60));
  score += freshness;

  // 3) Demand signal (0–20) — log scale so virality doesn't dominate
  const demand = Math.log10(1 + opp.views + opp.applicantsCount * 8);
  score += Math.min(20, demand * 7);

  // 4) Compensation clarity (0–15)
  if (opp.amountMin != null && opp.amountMax != null && opp.currency) {
    score += 15;
  } else if (opp.amountMin != null || opp.amountMax != null) {
    score += 8;
  }

  // 5) Curation boost (0–10)
  if (opp.featured) score += 10;

  // Closed listings sink to the bottom but stay searchable.
  if (opp.status === "closed") score = Math.min(score, 25);

  return Math.max(0, Math.min(100, Math.round(score)));
}
