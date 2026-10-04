/** Mirrors backend/src/types.ts — keep in sync (see docs/API.md). */

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
  email: string;
  role: Role;
  avatarColor: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  category: string;
  description: string;
  location: string;
  remote: boolean;
  amountMin?: number | null;
  amountMax?: number | null;
  currency?: string | null;
  deadline?: string | null;
  url: string;
  source: string;
  tags: string[];
  status: OpportunityStatus;
  featured: boolean;
  applicantsCount: number;
  views: number;
  score: number;
  postedBy: string | null;
  createdAt: string;
  updatedAt: string;
  saved?: boolean;
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

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  facets?: {
    types: { value: string; count: number }[];
    categories: string[];
    sources: string[];
  };
}

export interface DashboardStats {
  totals: {
    opportunities: number;
    open: number;
    closingSoon: number;
    saved: number;
    postedByMe: number;
    sources: number;
    scans: number;
  };
  byType: { type: string; count: number; open: number }[];
  scoreBuckets: { range: string; count: number }[];
  closingSoon: Opportunity[];
  mine: Opportunity[];
  latest: Opportunity[];
  avgScore: number;
}
