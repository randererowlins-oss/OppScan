import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiError, opportunitiesApi } from "../api/client";
import { CenteredSpinner, ErrorBanner } from "../components/bits";
import type { OpportunityType } from "../types";

const TYPES: OpportunityType[] = ["Job", "Grant", "Tender", "Freelance", "Funding", "Scholarship"];

const EMPTY = {
  title: "",
  organization: "",
  type: "Job" as OpportunityType,
  category: "",
  description: "",
  location: "",
  remote: false,
  amountMin: "",
  amountMax: "",
  currency: "USD",
  deadline: "",
  url: "",
  tags: "",
};

/**
 * Submit page doubles as the edit page: pass `?id=<oppId>` to load an
 * existing listing into the form (owner or admin only, enforced by the API).
 */
export function Submit() {
  const [params] = useSearchParams();
  const editId = params.get("id");
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!editId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editId) return;
    opportunitiesApi
      .get(editId)
      .then(({ item }) =>
        setForm({
          title: item.title,
          organization: item.organization,
          type: item.type,
          category: item.category,
          description: item.description,
          location: item.location,
          remote: item.remote,
          amountMin: item.amountMin?.toString() ?? "",
          amountMax: item.amountMax?.toString() ?? "",
          currency: item.currency ?? "USD",
          deadline: item.deadline ? item.deadline.slice(0, 10) : "",
          url: item.url,
          tags: item.tags.join(", "),
        }),
      )
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, [editId]);

  const set = (k: keyof typeof EMPTY, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      title: form.title.trim(),
      organization: form.organization.trim(),
      type: form.type,
      category: form.category.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      remote: form.remote,
      amountMin: form.amountMin ? Number(form.amountMin) : null,
      amountMax: form.amountMax ? Number(form.amountMax) : null,
      currency: form.currency || null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      url: form.url.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      const item = editId
        ? await opportunitiesApi.update(editId, payload)
        : await opportunitiesApi.create(payload);
      navigate(`/opportunities/${item.id}`);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <CenteredSpinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">{editId ? "Edit opportunity" : "Submit an opportunity"}</h1>
      <p className="page-sub">
        {editId
          ? "Changes are re-scored instantly."
          : "Share a job, grant, tender, gig, funding round or scholarship with the community."}
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-6 sm:p-8">
        {error && <ErrorBanner message={error} />}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="title">Title *</label>
            <input
              id="title" className="input" value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Senior Frontend Engineer (React)"
              required minLength={5} maxLength={140}
            />
          </div>
          <div>
            <label className="label" htmlFor="organization">Organisation *</label>
            <input
              id="organization" className="input" value={form.organization}
              onChange={(e) => set("organization", e.target.value)}
              placeholder="e.g. Acme Corp" required
            />
          </div>
          <div>
            <label className="label" htmlFor="url">Application URL *</label>
            <input
              id="url" className="input" type="url" value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://…" required
            />
          </div>
          <div>
            <label className="label" htmlFor="type">Type *</label>
            <select
              id="type" className="input" value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="category">Category *</label>
            <input
              id="category" className="input" value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Engineering, Climate, Design" required
            />
          </div>
          <div>
            <label className="label" htmlFor="location">Location *</label>
            <input
              id="location" className="input" value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Remote, Lagos, Worldwide" required
            />
          </div>
          <div>
            <label className="label" htmlFor="deadline">Deadline</label>
            <input
              id="deadline" className="input" type="date" value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Compensation range</label>
            <div className="flex gap-2">
              <input
                className="input" type="number" min={0} value={form.amountMin}
                onChange={(e) => set("amountMin", e.target.value)} placeholder="Min"
              />
              <input
                className="input" type="number" min={0} value={form.amountMax}
                onChange={(e) => set("amountMax", e.target.value)} placeholder="Max"
              />
              <input
                className="input !w-24" value={form.currency}
                onChange={(e) => set("currency", e.target.value)} placeholder="USD"
                maxLength={8}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="tags">Tags (comma-separated)</label>
            <input
              id="tags" className="input" value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="react, remote, fintech"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox" checked={form.remote}
            onChange={(e) => set("remote", e.target.checked)}
            className="h-4 w-4 rounded accent-indigo-600"
          />
          This is a remote opportunity
        </label>

        <div>
          <label className="label" htmlFor="description">
            Description * <span className="font-normal text-slate-400">(min. 60 characters — detail boosts your score)</span>
          </label>
          <textarea
            id="description" className="input min-h-40" rows={6} value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What is it, who is it for, how to apply, key dates…"
            required minLength={60}
          />
          <p className="mt-1 text-right text-xs text-slate-400">{form.description.trim().length} / 60+ chars</p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button className="btn-primary flex-1" disabled={busy}>
            {busy ? "Saving…" : editId ? "Save changes" : "Publish opportunity"}
          </button>
        </div>
      </form>
    </div>
  );
}
