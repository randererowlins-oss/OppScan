import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Radar,
  Search,
  Bookmark,
  BarChart3,
  Zap,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { opportunitiesApi } from "../api/client";
import type { Opportunity } from "../types";
import { OpportunityCard } from "../components/OpportunityCard";

const FEATURES = [
  {
    icon: Radar,
    title: "Always-on scanning",
    body: "OppScan watches jobs, grants, tenders, freelance gigs, funding and scholarships across curated sources — so you don't have to.",
  },
  {
    icon: Zap,
    title: "Transparent scoring",
    body: "Every listing gets a 0–100 score for completeness, freshness, demand and comp clarity. No black boxes.",
  },
  {
    icon: Search,
    title: "Search that respects you",
    body: "Filter by type, category, location, remote-only and minimum score. Sort by newest, score, deadline or amount.",
  },
  {
    icon: Bookmark,
    title: "Track & never miss out",
    body: "Bookmark contenders, watch closing-soon deadlines, and post your own opportunities in under a minute.",
  },
  {
    icon: BarChart3,
    title: "A dashboard with signal",
    body: "Totals, per-type breakdowns, score distribution and deadline pressure — one glance, full picture.",
  },
  {
    icon: BadgeCheck,
    title: "Community + curation",
    body: "Scanner-found listings plus community submissions, with admin featuring for the highest-signal finds.",
  },
];

export function Landing() {
  const [featured, setFeatured] = useState<Opportunity[]>([]);

  useEffect(() => {
    opportunitiesApi.featured().then(setFeatured).catch(() => {});
  }, []);

  return (
    <div className="-m-4 sm:-m-6">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-20 pt-16 text-white sm:px-6 sm:pt-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px 300px at 20% 10%, #4f46e5 0%, transparent 60%), radial-gradient(500px 260px at 85% 20%, #0ea5e9 0%, transparent 55%), radial-gradient(700px 340px at 50% 100%, #7c3aed 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="chip bg-white/10 text-brand-100 ring-1 ring-white/20">
            <Radar className="h-3.5 w-3.5" /> 6 opportunity types · 1 dashboard
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Scan less. <span className="text-brand-300">Win more.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            OppScan discovers, scores and tracks jobs, grants, tenders,
            freelance gigs, funding and scholarships — so your next big break
            never slips past you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary !px-7 !py-3 !text-base">
              Start scanning — it's free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/browse"
              className="btn !border-white/20 !bg-white/10 !px-7 !py-3 !text-base !text-white hover:!bg-white/20"
            >
              Browse opportunities
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Demo logins: <span className="font-mono">demo@oppscan.io / demo1234</span>
            {" · "}
            <span className="font-mono">admin@oppscan.io / admin123</span>
          </p>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="page-title">Featured this week</h2>
              <p className="page-sub">Highest-signal finds, hand-picked by curators.</p>
            </div>
            <Link to="/browse" className="btn-secondary hidden sm:inline-flex">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((o, i) => (
              <OpportunityCard key={o.id} opp={o} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="page-title text-center">Everything you need to hunt smarter</h2>
          <p className="page-sub text-center">
            Built for freelancers, founders, job-seekers and grant writers.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="page-title text-center">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { n: "1", t: "Scanner finds", d: "Curated sources are scanned continuously. New listings land in Browse within minutes, pre-scored." },
            { n: "2", t: "You filter & save", d: "Search, filter by what matters to you, bookmark contenders and watch deadlines on your dashboard." },
            { n: "3", t: "You apply & win", d: "One click takes you to the canonical application page. Apply tracking keeps your pipeline honest." },
          ].map((s) => (
            <div key={s.n} className="card relative p-6 pt-8 text-center">
              <span className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 font-extrabold text-white shadow-lift">
                {s.n}
              </span>
              <h3 className="font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/register" className="btn-primary !px-7 !py-3">
            Create your free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
