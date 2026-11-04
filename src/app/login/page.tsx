"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") ? next : "/";
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Lock size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Jmaie</h1>
            <p className="text-sm text-muted">Money, food and training</p>
          </div>
        </div>
        <label className="label" htmlFor="pw">
          Password
        </label>
        <input
          id="pw"
          type="password"
          className="input"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-bad">{error}</p>}
        <button className="btn-primary mt-4 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
