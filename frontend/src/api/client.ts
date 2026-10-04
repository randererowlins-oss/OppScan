import axios from "axios";
import type {
  DashboardStats,
  Opportunity,
  Paginated,
  ScanRun,
  Source,
  User,
} from "../types";

/**
 * Central API client. Base URL is relative (`/api`) in dev so Vite's proxy
 * forwards to the backend — the browser never talks to localhost:4000
 * directly, which keeps sandboxed previews working.
 */

const TOKEN_KEY = "oppscan_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
  timeout: 15000,
});

api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { error?: string } | undefined)?.error;
    if (msg) return msg;
    if (err.code === "ECONNABORTED") return "Request timed out — try again.";
    if (!err.response) return "Cannot reach the API. Is the backend running?";
    return `Request failed (${err.response.status})`;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

// ─── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  async register(input: { name: string; email: string; password: string }) {
    const { data } = await api.post<{ user: User; token: string }>(
      "/auth/register",
      input,
    );
    return data;
  },
  async login(input: { email: string; password: string }) {
    const { data } = await api.post<{ user: User; token: string }>(
      "/auth/login",
      input,
    );
    return data;
  },
  async me() {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },
  async updateMe(input: { name: string }) {
    const { data } = await api.patch<{ user: User }>("/auth/me", input);
    return data.user;
  },
};

// ─── Opportunities ────────────────────────────────────────────────
export interface BrowseParams {
  q?: string;
  type?: string;
  category?: string;
  location?: string;
  remote?: boolean;
  minScore?: number;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
}

export const opportunitiesApi = {
  async list(params: BrowseParams = {}) {
    const { data } = await api.get<Paginated<Opportunity>>("/opportunities", {
      params: {
        ...params,
        remote: params.remote ? "true" : undefined,
        featured: params.featured ? "true" : undefined,
      },
    });
    return data;
  },
  async featured() {
    const { data } = await api.get<{ items: Opportunity[] }>(
      "/opportunities/featured",
    );
    return data.items;
  },
  async get(id: string) {
    const { data } = await api.get<{ item: Opportunity; similar: Opportunity[] }>(
      `/opportunities/${id}`,
    );
    return data;
  },
  async create(input: Partial<Opportunity>) {
    const { data } = await api.post<{ item: Opportunity }>(
      "/opportunities",
      input,
    );
    return data.item;
  },
  async update(id: string, input: Partial<Opportunity>) {
    const { data } = await api.put<{ item: Opportunity }>(
      `/opportunities/${id}`,
      input,
    );
    return data.item;
  },
  async remove(id: string) {
    await api.delete(`/opportunities/${id}`);
  },
  async apply(id: string) {
    const { data } = await api.post<{ item: Opportunity }>(
      `/opportunities/${id}/apply`,
    );
    return data.item;
  },
};

// ─── Saved ────────────────────────────────────────────────────────
export const savedApi = {
  async list() {
    const { data } = await api.get<{ items: Opportunity[]; total: number }>(
      "/saved",
    );
    return data;
  },
  async save(id: string) {
    await api.post(`/saved/${id}`);
  },
  async unsave(id: string) {
    await api.delete(`/saved/${id}`);
  },
};

// ─── Dashboard / scan / admin ─────────────────────────────────────
export const dashboardApi = {
  async stats() {
    const { data } = await api.get<DashboardStats>("/dashboard/stats");
    return data;
  },
};

export const scanApi = {
  async sources() {
    const { data } = await api.get<{ items: Source[] }>("/sources");
    return data.items;
  },
  async scans() {
    const { data } = await api.get<{ items: ScanRun[] }>("/scans");
    return data.items;
  },
  async run() {
    const { data } = await api.post<{ run: ScanRun; items: Opportunity[] }>(
      "/scan",
    );
    return data;
  },
};

export const adminApi = {
  async overview() {
    const { data } = await api.get<{
      users: number;
      opportunities: number;
      saved: number;
      scans: number;
      usersList: User[];
    }>("/admin/overview");
    return data;
  },
  async setFeatured(id: string, featured: boolean) {
    const { data } = await api.patch<{ item: Opportunity }>(
      `/admin/opportunities/${id}/feature`,
      { featured },
    );
    return data.item;
  },
};
