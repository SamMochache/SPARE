import React, { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRoundIcon, LoaderCircleIcon, LockKeyholeIcon } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return <div className="min-h-screen grid place-items-center text-ink-muted">Checking session…</div>;
  }
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      toast.success("Signed in successfully");
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";
      navigate(destination, { replace: true });
    } catch (cause) {
      const message = cause instanceof ApiRequestError
        ? (cause.status === 401 ? "Incorrect username or password." : cause.message)
        : "Sign-in failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-line bg-white p-7 shadow-card">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-white"><KeyRoundIcon className="h-6 w-6" /></div>
          <div><h1 className="text-xl font-semibold text-ink">AutoParts Pro</h1><p className="text-sm text-ink-muted">Sign in to your shop workspace</p></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink">Username</label>
            <input id="username" name="username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">Password</label>
            <div className="relative">
              <LockKeyholeIcon className="absolute left-3 top-3 h-4 w-4 text-ink-subtle" aria-hidden="true" />
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-line py-2.5 pl-9 pr-3 outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" />
            </div>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 font-medium text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting && <LoaderCircleIcon className="h-4 w-4 animate-spin" />}
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-xs leading-relaxed text-ink-muted">Your account must be created by an authorized shop administrator. If you cannot sign in, contact your administrator.</p>
      </section>
    </main>
  );
}
