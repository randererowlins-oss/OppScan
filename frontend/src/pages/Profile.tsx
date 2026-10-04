import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Bookmark, FilePlus2, ShieldCheck } from "lucide-react";
import { apiError, authApi, dashboardApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ErrorBanner } from "../components/bits";
import { initials } from "../utils/format";

export function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [counts, setCounts] = useState({ saved: 0, posted: 0 });

  useEffect(() => {
    dashboardApi
      .stats()
      .then((s) => setCounts({ saved: s.totals.saved, posted: s.totals.postedByMe }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await authApi.updateMe({ name: name.trim() });
      await refresh();
      setMsg("Profile updated.");
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="page-title">Profile & settings</h1>
      <p className="page-sub">Manage your public identity on OppScan.</p>

      <div className="card mt-6 flex items-center gap-4 p-6">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold text-white"
          style={{ background: user.avatarColor }}
        >
          {initials(user.name)}
        </span>
        <div>
          <p className="text-lg font-extrabold">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <span className="chip mt-1 bg-slate-100 text-slate-600">
            {user.role === "admin" && <ShieldCheck className="mr-1 h-3 w-3" />}
            {user.role}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link to="/saved" className="card flex items-center gap-3 p-5 transition hover:shadow-lift">
          <Bookmark className="h-5 w-5 text-amber-500" />
          <span>
            <span className="block text-xl font-extrabold">{counts.saved}</span>
            <span className="text-sm text-slate-500">Saved opportunities</span>
          </span>
        </Link>
        <Link to="/browse" className="card flex items-center gap-3 p-5 transition hover:shadow-lift">
          <FilePlus2 className="h-5 w-5 text-brand-500" />
          <span>
            <span className="block text-xl font-extrabold">{counts.posted}</span>
            <span className="text-sm text-slate-500">Posted by you</span>
          </span>
        </Link>
      </div>

      <form onSubmit={submit} className="card mt-4 space-y-4 p-6">
        <h2 className="font-bold">Display name</h2>
        {error && <ErrorBanner message={error} />}
        {msg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {msg}
          </div>
        )}
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>
        <button className="btn-primary">Save changes</button>
      </form>
    </div>
  );
}
