import { Navigate, useLocation } from "react-router-dom";
import { SearchX, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

/** Route guard — redirects anonymous visitors to /login (remembers target). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <CenteredSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

/** Admin-only guard. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <CenteredSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function CenteredSpinner() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <SearchX className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card rise p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
