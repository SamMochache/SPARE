import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Save, UserRound } from "lucide-react";
import { apiRequest, ApiRequestError } from "../api/client";
import { useAuth, type CurrentUser } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { buttonClass } from "../components/ui/Button";

const fieldClass = "mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-canvas disabled:text-ink-muted";

export function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CurrentUser | null>(user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const current = await apiRequest<CurrentUser>("/api/v1/auth/me/");
      setProfile(current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProfile(); }, []);

  function update(field: "first_name" | "last_name" | "email", value: string) {
    setProfile((current) => current ? { ...current, [field]: value } : current);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    try {
      const updated = await apiRequest<CurrentUser>("/api/v1/auth/me/", {
        method: "PATCH",
        body: {
          first_name: profile.first_name.trim(),
          last_name: profile.last_name.trim(),
          email: profile.email.trim()
        }
      });
      setProfile(updated);
      toast.success("Profile updated");
    } catch (cause) {
      const message = cause instanceof ApiRequestError
        ? cause.message
        : cause instanceof Error ? cause.message : "Could not save your profile.";
      setError(message);
      toast.error("Profile could not be saved", { description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 sm:p-6">
      <PageHeader title="Settings & Profile" description="Manage your account details. Changes are saved to your account through the API." />
      {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-ink">
        <p className="font-medium">There was a problem.</p>
        <p className="mt-1">{error}</p>
        <button type="button" onClick={() => void loadProfile()} className="mt-2 font-semibold underline">Try again</button>
      </div>}
      <section className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-navy"><UserRound className="h-5 w-5" /></span>
          <div>
            <h2 className="font-semibold text-ink">Personal profile</h2>
            <p className="text-sm text-ink-muted">Your name and contact information</p>
          </div>
        </div>
        {loading && !profile ? <p className="py-8 text-sm text-ink-muted">Loading profile from the server…</p> : profile ? (
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-ink">First name
                <input className={fieldClass} value={profile.first_name} onChange={(event) => update("first_name", event.target.value)} maxLength={150} disabled={loading || saving} />
              </label>
              <label className="text-sm font-medium text-ink">Last name
                <input className={fieldClass} value={profile.last_name} onChange={(event) => update("last_name", event.target.value)} maxLength={150} disabled={loading || saving} />
              </label>
              <label className="text-sm font-medium text-ink">Email
                <input type="email" className={fieldClass} value={profile.email} onChange={(event) => update("email", event.target.value)} maxLength={254} disabled={loading || saving} />
              </label>
              <label className="text-sm font-medium text-ink">Username
                <input className={fieldClass} value={profile.username} disabled readOnly />
              </label>
            </div>
            <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
              <div><p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Assigned role</p><p className="mt-1 text-sm capitalize text-ink">{profile.is_superuser ? "Superuser" : profile.role}</p></div>
              <div><p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Assigned branch</p><p className="mt-1 text-sm text-ink">{profile.branch_name || "No branch assigned"}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={loading || saving} className={buttonClass("primary")}><Save className="h-4 w-4" />{saving ? "Saving…" : "Save profile"}</button>
              <button type="button" disabled={loading || saving} onClick={() => void loadProfile()} className={buttonClass("secondary")}><RefreshCw className="h-4 w-4" />Reload from server</button>
            </div>
          </form>
        ) : <p className="text-sm text-ink-muted">Your profile could not be loaded.</p>}
      </section>
      <section className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-7">
        <h2 className="font-semibold text-ink">Account security</h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">Your account role and branch assignment are managed by an authorized administrator. Password changes are not available here because the backend currently has no password-change endpoint.</p>
      </section>
    </div>
  );
}
