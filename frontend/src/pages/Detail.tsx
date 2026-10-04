import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  CalendarDays,
  Building2,
  Tag,
  Eye,
  Users,
  Trash2,
  Pencil,
} from "lucide-react";
import { clsx } from "clsx";
import { apiError, opportunitiesApi, savedApi } from "../api/client";
import type { Opportunity } from "../types";
import { OpportunityCard } from "../components/OpportunityCard";
import { CenteredSpinner, ErrorBanner } from "../components/bits";
import { useAuth } from "../context/AuthContext";
import {
  deadlineCountdown,
  formatDate,
  formatMoney,
  scoreTone,
  timeAgo,
  typeTone,
} from "../utils/format";

export function Detail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [similar, setSimilar] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await opportunitiesApi.get(id);
      setOpp(data.item);
      setSimilar(data.similar);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSave = async () => {
    if (!opp || !user) return;
    try {
      if (opp.saved) await savedApi.unsave(opp.id);
      else await savedApi.save(opp.id);
      setOpp({ ...opp, saved: !opp.saved });
    } catch (err) {
      setError(apiError(err));
    }
  };

  const onApply = async () => {
    if (!opp) return;
    if (user && !applied) {
      try {
        const updated = await opportunitiesApi.apply(opp.id);
        setOpp({ ...updated, saved: opp.saved });
        setApplied(true);
      } catch {
        /* non-fatal — still open the link */
      }
    }
    window.open(opp.url, "_blank", "noopener,noreferrer");
  };

  const onDelete = async () => {
    if (!opp || !confirm("Delete this opportunity? This cannot be undone.")) return;
    try {
      await opportunitiesApi.remove(opp.id);
      navigate("/browse");
    } catch (err) {
      setError(apiError(err));
    }
  };

  if (loading) return <CenteredSpinner />;
  if (error && !opp) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-10">
        <ErrorBanner message={error} />
        <Link to="/browse" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>
      </div>
    );
  }
  if (!opp) return null;

  const money = formatMoney(opp.amountMin, opp.amountMax, opp.currency);
  const countdown = deadlineCountdown(opp.deadline);
  const canEdit = user && (user.role === "admin" || opp.postedBy === user.id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/browse" className="btn-ghost mb-4">
        <ArrowLeft className="h-4 w-4" /> All opportunities
      </Link>
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <article className="card rise p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx("chip", typeTone(opp.type))}>{opp.type}</span>
            <span className="chip bg-slate-100 text-slate-600">{opp.category}</span>
            <span className={clsx("chip ring-1", scoreTone(opp.score))}>
              ★ Score {opp.score}/100
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {opp.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <Building2 className="h-4 w-4" /> {opp.organization}
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {opp.location}
            </span>
            {opp.remote && (
              <span className="font-bold text-emerald-600">· Remote</span>
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Deadline: <strong className="text-slate-800">{formatDate(opp.deadline)}</strong>
              {countdown && <span className="font-semibold text-brand-600">({countdown})</span>}
            </span>
            {money && (
              <span className="text-base font-extrabold text-slate-900">{money}</span>
            )}
          </div>

          <div className="prose-sm mt-6 max-w-none whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
            {opp.description}
          </div>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {opp.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
              >
                <Tag className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" /> {opp.views.toLocaleString()} views
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {opp.applicantsCount.toLocaleString()} applicants
            </span>
            <span>Posted {timeAgo(opp.createdAt)} via {opp.source}</span>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card rise rise-1 space-y-3 p-5">
            <button onClick={onApply} className="btn-primary w-full !py-3">
              Apply now <ExternalLink className="h-4 w-4" />
            </button>
            {applied && (
              <p className="text-center text-xs font-semibold text-emerald-600">
                ✓ Application tracked — good luck!
              </p>
            )}
            {user ? (
              <button onClick={toggleSave} className="btn-secondary w-full">
                {opp.saved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" /> Saved — remove
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" /> Save for later
                  </>
                )}
              </button>
            ) : (
              <Link to="/login" className="btn-secondary w-full">
                <Bookmark className="h-4 w-4" /> Log in to save
              </Link>
            )}
            {canEdit && (
              <div className="flex gap-2">
                <Link to={`/submit?id=${opp.id}`} className="btn-secondary flex-1 !px-3">
                  <Pencil className="h-4 w-4" /> Edit
                </Link>
                <button onClick={onDelete} className="btn flex-1 bg-red-50 !px-3 !py-2.5 text-sm text-red-600 hover:bg-red-100">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>

          <div className="card rise rise-2 p-5 text-sm">
            <h3 className="font-bold">Why this score?</h3>
            <ul className="mt-2 space-y-1.5 text-slate-600">
              <ScoreRow label="Listing completeness" pts="30" />
              <ScoreRow label="Freshness" pts="25" />
              <ScoreRow label="Demand signal" pts="20" />
              <ScoreRow label="Compensation clarity" pts="15" />
              <ScoreRow label="Curation boost" pts="10" />
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Transparent heuristic — full formula in{" "}
              <span className="font-mono">docs/API.md</span>.
            </p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-extrabold">Similar opportunities</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {similar.map((o, i) => (
              <OpportunityCard key={o.id} opp={o} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ScoreRow({ label, pts }: { label: string; pts: string }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-mono font-bold text-slate-800">/ {pts}</span>
    </li>
  );
}
