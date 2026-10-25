"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

// Keep authorization parameters on this page rather than losing them during login.
export function IntegrationSignIn() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(event.currentTarget);
        try {
          const result = await signIn.email({
            email: String(form.get("email")),
            password: String(form.get("password")),
          });
          if (result.error) throw new Error();
          window.location.reload();
        } catch {
          setError("Could not sign in. Check your email and password.");
          setBusy(false);
        }
      }}
    >
      <p>Sign in to Clipsy to review this connection.</p>
      <label className="block">
        Email
        <input
          className="block w-full rounded bg-gray-800 p-3"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="block">
        Password
        <input
          className="block w-full rounded bg-gray-800 p-3"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} className="min-h-11 rounded bg-blue-600 px-4">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <button
        disabled={busy}
        type="button"
        className="min-h-11 rounded border px-4"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const result = await signIn.social({
              provider: "google",
              callbackURL: window.location.href,
            });
            if (result.error) throw new Error();
          } catch {
            setError("Google sign-in is unavailable. Try email and password.");
            setBusy(false);
          }
        }}
      >
        Sign in with Google
      </button>
    </form>
  );
}
