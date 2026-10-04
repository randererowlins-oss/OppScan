import { Link } from "react-router-dom";
import { MapPin, Bookmark, BookmarkCheck, Flame, Clock3, Eye, Users } from "lucide-react";
import { clsx } from "clsx";
import type { Opportunity } from "../types";
import {
  deadlineCountdown,
  formatMoney,
  scoreTone,
  timeAgo,
  typeTone,
} from "../utils/format";

interface Props {
  opp: Opportunity;
  onToggleSave?: (opp: Opportunity) => void;
  index?: number;
}

/** Listing card used on Browse / Saved / Dashboard / Landing. */
export function OpportunityCard({ opp, onToggleSave, index = 0 }: Props) {
  const money = formatMoney(opp.amountMin, opp.amountMax, opp.currency);
  const countdown = deadlineCountdown(opp.deadline);

  return (
    <article
      className={clsx(
        "card rise group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift",
        `rise-${Math.min(index % 6, 5)}`,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={clsx("chip", typeTone(opp.type))}>{opp.type}</span>
          {opp.featured && (
            <span className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <Flame className="h-3 w-3" /> Featured
            </span>
          )}
          {opp.status === "closing-soon" && (
            <span className="chip bg-red-50 text-red-700 ring-1 ring-red-200">
              <Clock3 className="h-3 w-3" /> Closing soon
            </span>
          )}
        </div>
        <span
          title="OppScan quality score (0–100)"
          className={clsx("chip ring-1", scoreTone(opp.score))}
        >
          ★ {opp.score}
        </span>
      </div>

      <Link to={`/opportunities/${opp.id}`} className="mt-3 block">
        <h3 className="text-base font-bold leading-snug text-slate-900 group-hover:text-brand-700">
          {opp.title}
        </h3>
        <p className="mt-0.5 text-sm font-medium text-slate-500">{opp.organization}</p>
      </Link>

      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{opp.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {opp.location}
          {opp.remote && <span className="font-semibold text-emerald-600">· Remote</span>}
        </span>
        {money && <span className="font-bold text-slate-800">{money}</span>}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {opp.tags.slice(0, 4).map((t) => (
          <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            #{t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1" title="Views">
            <Eye className="h-3.5 w-3.5" /> {opp.views.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1" title="Applicants">
            <Users className="h-3.5 w-3.5" /> {opp.applicantsCount.toLocaleString()}
          </span>
          <span title={opp.createdAt}>{timeAgo(opp.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {countdown && (
            <span className="font-semibold text-slate-600">{countdown}</span>
          )}
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(opp)}
              title={opp.saved ? "Remove bookmark" : "Bookmark"}
              className={clsx(
                "rounded-lg p-1.5 transition",
                opp.saved
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
              )}
            >
              {opp.saved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
