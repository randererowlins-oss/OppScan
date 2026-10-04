import { Link, NavLink, useNavigate } from "react-router-dom";
import { Radar, LayoutDashboard, Compass, Bookmark, PlusCircle, ShieldCheck, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/format";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  );

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lift">
            <Radar className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Opp<span className="text-brand-600">Scan</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          <NavLink to="/browse" className={linkCls}>
            <Compass className="h-4 w-4" /> Browse
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className={linkCls}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </NavLink>
              <NavLink to="/saved" className={linkCls}>
                <Bookmark className="h-4 w-4" /> Saved
              </NavLink>
              {user.role === "admin" && (
                <NavLink to="/admin" className={linkCls}>
                  <ShieldCheck className="h-4 w-4" /> Admin
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link to="/submit" className="btn-primary hidden !px-4 sm:inline-flex">
                <PlusCircle className="h-4 w-4" /> Submit
              </Link>
              <Link
                to="/profile"
                title={user.email}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: user.avatarColor }}
              >
                {initials(user.name)}
              </Link>
              <button onClick={onLogout} className="btn-ghost" title="Log out">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary !px-4">Get started</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        <NavLink to="/browse" className={linkCls}><Compass className="h-4 w-4" /> Browse</NavLink>
        {user && (
          <>
            <NavLink to="/dashboard" className={linkCls}><LayoutDashboard className="h-4 w-4" /> Dashboard</NavLink>
            <NavLink to="/saved" className={linkCls}><Bookmark className="h-4 w-4" /> Saved</NavLink>
            <NavLink to="/submit" className={linkCls}><PlusCircle className="h-4 w-4" /> Submit</NavLink>
            {user.role === "admin" && (
              <NavLink to="/admin" className={linkCls}><ShieldCheck className="h-4 w-4" /> Admin</NavLink>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
