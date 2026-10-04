import { Link } from "react-router-dom";
import { Radar } from "lucide-react";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Radar className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-4xl font-extrabold">404</h1>
      <p className="mt-1 text-slate-500">
        This signal got lost in the noise — the page doesn't exist.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to safety
      </Link>
    </div>
  );
}
