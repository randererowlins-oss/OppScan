/**
 * OppScan shared domain types (backend).
 *
 * These mirror the contract documented in `docs/API.md` and the
 * TypeScript types in `frontend/src/types.ts`. Keep the three in sync.
 */

export type Role = "user" | "admin";

export type OpportunityType =
  | "Job"
  | "Grant"
  | "Tender"
  | "Freelance"
  | "Funding"
  | "Scholarship";

export type OpportunityStatus = "open" | "closing-soon" | "closed";

export interface User {
  id: string;
  name: string;
  email: string; // lowercase, unique
  passwordHash: string; // bcrypt — NEVER sent to clients
  role: Role;
  /** Hex colour used for avatar fallbacks, e.g. "#6366f1" */
  avatarColor: string;
  createdAt: string; // ISO-8601
}

export type PublicUser = Omit<User, "passwordHash">;

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  category: string; // e.g. "Engineering", "Climate", "Design"
  description: string; // markdown-ish plain text
  location: string; // "Remote" / "Lagos, Nigeria" / "Worldwide" …
  remote: boolean;
  amountMin?: number | null;
  amountMax?: number | null;
  currency?: string | null; // ISO-4217-ish, e.g. "USD"
  deadline?: string | null; // ISO-8601 date
  url: string; // canonical "apply" link
  source: string; // where OppScan found it, e.g. "Green Grants DB"
  tags: string[];
  status: OpportunityStatus;
  featured: boolean;
  applicantsCount: number;
  views: number;
  /** 0–100 relevance/quality score — see `utils/scoring.ts` */
  score: number;
  postedBy: string | null; // user id, or null for scanner-found
  createdAt: string;
  updatedAt: string;
}

export interface SavedItem {
  userId: string;
  opportunityId: string;
  createdAt: string;
}

export interface Source {
  id: string;
  name: string;
  kind: OpportunityType | "Mixed";
  url: string;
  status: "active" | "paused" | "error";
  lastScanAt: string | null;
  foundCount: number;
}

export interface ScanRun {
  id: string;
  startedAt: string;
  finishedAt: string;
  sourcesScanned: number;
  newFound: number;
  newIds: string[];
  status: "completed";
}

/** Shape of the JSON database file. See `db.ts`. */
export interface DatabaseShape {
  version: 1;
  users: User[];
  opportunities: Opportunity[];
  saved: SavedItem[];
  sources: Source[];
  scans: ScanRun[];
}
