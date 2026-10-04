import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Radar,
  Bookmark,
  Flame,
  FilePlus2,
  Radio,
  ArrowRight,
  AlarmClock,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiError, dashboardApi, scanApi } from "../api/client";
import type { DashboardStats } from "../types";
import { OpportunityCard } from "../components/OpportunityCard";
import { CenteredSpinner, ErrorBanner, StatCard } from "../components/bits";
import { useAuth } from "../context/AuthContext";
import { deadlineCountdown } from "../utils/format";

const BAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  const load = useCallback(async () => {
    try {
      setStats(await dashboardApi.stats());
    } catch (err) {
      setError(apiError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runScan = async () => {
    setScanning(true);
    setScanMsg("");
    try {
      const { run } = await scanApi.run();
      setScanMsg(
        run.newFound > 0
          ? `Scan complete — ${run.newFound} new opportunit${run.newFound === 1 ? "y" : "ies"} found across ${run.sourcesScanned} sources.`
          : `Scan complete — no new listings this time (${run.sourcesScanned} sources checked).`,
      );
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setScanning(false);
    }
  };

  if (!stats) {
    return (
      <div>
        {error ? <ErrorBanner message={error} /> : <CenteredSpinner />}
      </div>
    );
  }

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Good to see you, {firstName} 👋</h1>
          <p className="page-sub">
            {stats.totals.open} open opportunities · avg. score {stats.avgScore}/100 ·{" "}
            {stats.totals.closingSoon} closing soon.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={runScan} disabled={scanning} className="btn-primary">
            <Radar className={`h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning…" : "Run scan"}
          </button>
          <Link to="/submit" className="btn-secondary">
            <FilePlus2 className="h-4 w-4" /> Submit
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}
      {scanMsg && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <Sparkles className="mr-1 inline h-4 w-4" /> {scanMsg}
        </div>
      )}

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open opportunities"
          value={stats.totals.open}
          sub={`${stats.totals.opportunities} total tracked`}
          icon={<Radio className="h-5 w-5 text-brand-500" />}
        />
        <StatCard
          label="Closing soon"
          value={stats.totals.closingSoon}
          sub="Deadlines within 7 days"
          icon={<AlarmClock className="h-5 w-5 text-red-500" />}
        />
        <StatCard
          label="My saved"
          value={stats.totals.saved}
          sub="Bookmarked by you"
          icon={<Bookmark className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          label="Posted by me"
          value={stats.totals.postedByMe}
          sub={`${stats.totals.sources} sources · ${stats.totals.scans} scans`}
          icon={<Flame className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-bold">Opportunities by type</h3>
          <p className="text-xs text-slate-500">Open vs total per category.</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byType} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="type" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Total" radius={[0, 6, 6, 0]}>
                  {stats.byType.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-bold">Score distribution</h3>
          <p className="text-xs text-slate-500">How many listings sit in each quality band.</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scoreBuckets} margin={{ left: -8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Listings" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Closing soon */}
      {stats.closingSoon.length > 0 && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">⏰ Closing within 14 days</h3>
            <Link to="/browse?sort=deadline" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {stats.closingSoon.map((o) => (
              <Link
                key={o.id}
                to={`/opportunities/${o.id}`}
                className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">{o.title}</span>
                  <span className="text-xs text-slate-500">{o.organization} · {o.type}</span>
                </span>
                <span className="chip shrink-0 bg-red-50 text-red-700 ring-1 ring-red-200">
                  {deadlineCountdown(o.deadline)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest */}
      <div className="mt-6 flex items-end justify-between">
        <h3 className="text-lg font-extrabold">Fresh on the radar</h3>
        <Link to="/browse" className="btn-ghost text-brand-600">
          Browse all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {stats.latest.map((o, i) => (
          <OpportunityCard key={o.id} opp={o} index={i} />
        ))}
      </div>
    </div>
  );
}
