import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiError, savedApi } from "../api/client";
import type { Opportunity } from "../types";
import { OpportunityCard } from "../components/OpportunityCard";
import { CenteredSpinner, EmptyState, ErrorBanner } from "../components/bits";

export function Saved() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await savedApi.list();
      setItems(data.items);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unsave = async (opp: Opportunity) => {
    try {
      await savedApi.unsave(opp.id);
      setItems((prev) => prev.filter((o) => o.id !== opp.id));
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <div>
      <h1 className="page-title">Saved opportunities</h1>
      <p className="page-sub">
        Your shortlist — {items.length} bookmarked.
      </p>

      <div className="mt-6">
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <CenteredSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            hint="Tap the bookmark icon on any listing to build your shortlist."
            action={
              <Link to="/browse" className="btn-primary">
                Browse opportunities
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((o, i) => (
              <OpportunityCard key={o.id} opp={o} index={i} onToggleSave={unsave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
