import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { apiError, opportunitiesApi, savedApi } from "../api/client";
import type { Opportunity } from "../types";
import { OpportunityCard } from "../components/OpportunityCard";
import { CenteredSpinner, EmptyState, ErrorBanner } from "../components/bits";
import { useAuth } from "../context/AuthContext";

const TYPES = ["Job", "Grant", "Tender", "Freelance", "Funding", "Scholarship"];
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "score", label: "Highest score" },
  { value: "deadline", label: "Closing soonest" },
  { value: "amount", label: "Highest value" },
];

export function Browse() {
  const { user } = useAuth();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [remote, setRemote] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await opportunitiesApi.list({
        q: q || undefined,
        type: type || undefined,
        category: category || undefined,
        remote,
        minScore: minScore || undefined,
        sort,
        page,
        limit: 12,
      });
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
      setCategories(data.facets?.categories ?? []);
      const c: Record<string, number> = {};
      for (const t of data.facets?.types ?? []) c[t.value] = t.count;
      setCounts(c);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [q, type, category, remote, minScore, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce search input → committed query
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQ(qDraft);
    }, 350);
    return () => clearTimeout(t);
  }, [qDraft]);

  const resetPage = (fn: () => void) => () => {
    setPage(1);
    fn();
  };

  const toggleSave = async (opp: Opportunity) => {
    if (!user) return;
    try {
      if (opp.saved) await savedApi.unsave(opp.id);
      else await savedApi.save(opp.id);
      setItems((prev) =>
        prev.map((o) => (o.id === opp.id ? { ...o, saved: !o.saved } : o)),
      );
    } catch (err) {
      setError(apiError(err));
    }
  };

  const hasFilters = q || type || category || remote || minScore > 0;
  const clearAll = () => {
    setQDraft("");
    setQ("");
    setType("");
    setCategory("");
    setRemote(false);
    setMinScore(0);
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Browse opportunities</h1>
          <p className="page-sub">
            {total} result{total === 1 ? "" : "s"}
            {type && ` in ${type}s`} — ranked by {SORTS.find((s) => s.value === sort)?.label.toLowerCase()}.
          </p>
        </div>
        <button
          className="btn-secondary sm:hidden"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Search + sort */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input !pl-10"
            placeholder="Search titles, organisations, tags… (e.g. “solar”, “react”, “grant”)"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-52"
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value);
          }}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Filter sidebar */}
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="card space-y-5 p-5 lg:sticky lg:top-24">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Type</h3>
              <div className="mt-2 space-y-1">
                <FilterRow
                  label="All types"
                  active={!type}
                  onClick={resetPage(() => setType(""))}
                />
                {TYPES.map((t) => (
                  <FilterRow
                    key={t}
                    label={`${t}s`}
                    count={counts[t]}
                    active={type === t}
                    onClick={resetPage(() => setType(type === t ? "" : t))}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</h3>
              <select
                className="input mt-2"
                value={category}
                onChange={(e) => {
                  setPage(1);
                  setCategory(e.target.value);
                }}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Min. score: {minScore}
              </h3>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minScore}
                onChange={(e) => {
                  setPage(1);
                  setMinScore(Number(e.target.value));
                }}
                className="mt-2 w-full accent-indigo-600"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={remote}
                onChange={(e) => {
                  setPage(1);
                  setRemote(e.target.checked);
                }}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              Remote only
            </label>
            {hasFilters && (
              <button onClick={clearAll} className="btn-ghost w-full text-red-600 hover:bg-red-50">
                <X className="h-4 w-4" /> Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Results */}
        <div>
          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} />
            </div>
          )}
          {loading ? (
            <CenteredSpinner />
          ) : items.length === 0 ? (
            <EmptyState
              title="No opportunities match"
              hint="Try broadening your search or clearing filters."
              action={
                <button onClick={clearAll} className="btn-secondary">
                  Clear all filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((o, i) => (
                  <OpportunityCard
                    key={o.id}
                    opp={o}
                    index={i}
                    onToggleSave={user ? toggleSave : undefined}
                  />
                ))}
              </div>
              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Page {page} of {pages}
                </p>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary !px-3"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button
                    className="btn-secondary !px-3"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
          {!user && (
            <p className="mt-6 rounded-xl bg-brand-50 px-4 py-3 text-center text-sm text-brand-800">
              <Link to="/login" className="font-bold hover:underline">Log in</Link> to
              bookmark opportunities and run fresh scans.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition ${
        active
          ? "bg-brand-50 font-bold text-brand-700"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span>{label}</span>
      {count != null && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
          {count}
        </span>
      )}
    </button>
  );
}
