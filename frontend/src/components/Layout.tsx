import { Link } from "react-router-dom";
import { Radar } from "lucide-react";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Radar className="h-4 w-4" />
            </span>
            <span className="font-semibold text-slate-700">OppScan</span>
            <span>· scan less, win more.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/browse" className="hover:text-slate-900">Browse</Link>
            <Link to="/submit" className="hover:text-slate-900">Submit</Link>
            <a
              href="https://github.com/randererowlins-oss/OppScan"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
