import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Users, Database, Radio, History } from "lucide-react";
import {
  apiError,
  adminApi,
  opportunitiesApi,
  scanApi,
} from "../api/client";
import type { Opportunity, ScanRun, Source, User } from "../types";
import { CenteredSpinner, ErrorBanner, StatCard } from "../components/bits";
import { timeAgo } from "../utils/format";

export function Admin() {
  const [overview, setOverview] = useState<{
    users: number;
    opportunities: number;
    saved: number;
    scans: number;
    usersList: User[];
  } | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [scans, setScans] = useState<ScanRun[]>([]);
  const [topOpps, setTopOpps] = useState<Opportunity[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [ov, src, sc, opps] = await Promise.all([
        adminApi.overview(),
        scanApi.sources(),
        scanApi.scans(),
        opportunitiesApi.list({ sort: "score", limit: 8 }),
      ]);
      setOverview(ov);
      setSources(src);
      setScans(sc);
      setTopOpps(opps.items);
    } catch (err) {
      setError(apiError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFeatured = async (opp: Opportunity) => {
    try {
      const updated = await adminApi.setFeatured(opp.id, !opp.featured);
      setTopOpps((prev) =>
        prev.map((o) => (o.id === opp.id ? { ...o, featured: updated.featured } : o)),
      );
    } catch (err) {
      setError(apiError(err));
    }
  };

  if (!overview) {
    return error ? <ErrorBanner message={error} /> : <CenteredSpinner />;
  }

  return (
    <div>
      <h1 className="page-title">Admin console</h1>
      <p className="page-sub">Users, content curation, sources and scan history.</p>
      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value={overview.users} icon={<Users className="h-5 w-5 text-brand-500" />} />
        <StatCard label="Opportunities" value={overview.opportunities} icon={<Database className="h-5 w-5 text-emerald-500" />} />
        <StatCard label="Bookmarks" value={overview.saved} icon={<Flame className="h-5 w-5 text-amber-500" />} />
        <StatCard label="Scan runs" value={overview.scans} icon={<History className="h-5 w-5 text-slate-500" />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Featuring */}
        <div className="card p-5">
          <h3 className="font-bold">🏆 Feature top listings</h3>
          <p className="text-xs text-slate-500">Featured items appear on the landing page.</p>
          <div className="mt-3 divide-y divide-slate-100">
            {topOpps.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link to={`/opportunities/${o.id}`} className="min-w-0 text-sm hover:underline">
                  <span className="block truncate font-semibold text-slate-900">{o.title}</span>
                  <span className="text-xs text-slate-500">★ {o.score} · {o.type}</span>
                </Link>
                <button
                  onClick={() => toggleFeatured(o)}
                  className={`btn shrink-0 !px-3 !py-1.5 !text-xs ${
                    o.featured
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  {o.featured ? "Featured" : "Feature"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold">📡 Scan sources</h3>
            <div className="mt-3 space-y-2">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Radio className={`h-4 w-4 ${s.status === "active" ? "text-emerald-500" : "text-slate-400"}`} />
                    <span className="font-semibold">{s.name}</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {s.foundCount} found · {s.lastScanAt ? `scanned ${timeAgo(s.lastScanAt)}` : "never scanned"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Users */}
          <div className="card p-5">
            <h3 className="font-bold">👥 Users</h3>
            <div className="mt-3 space-y-2">
              {overview.usersList.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: u.avatarColor }}
                    >
                      {u.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-semibold leading-tight">{u.name}</span>
                      <span className="block text-xs text-slate-500">{u.email}</span>
                    </span>
                  </span>
                  <span className="chip bg-slate-100 text-slate-600">{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scan history */}
      <div className="card mt-4 p-5">
        <h3 className="font-bold">🕘 Scan history</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-2">Run</th>
                <th className="pb-2">When</th>
                <th className="pb-2">Sources</th>
                <th className="pb-2">New found</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scans.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-mono text-xs">{s.id}</td>
                  <td className="py-2">{timeAgo(s.startedAt)}</td>
                  <td className="py-2">{s.sourcesScanned}</td>
                  <td className="py-2 font-bold">{s.newFound}</td>
                  <td className="py-2">
                    <span className="chip bg-emerald-50 text-emerald-700">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
