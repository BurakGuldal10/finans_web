"use client";

import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";

type AuthStatus = {
  authenticated: boolean;
  enabled: boolean;
};

export function LocalLoginForm() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/auth", { cache: "no-store" });
        const status = (await response.json()) as AuthStatus;
        if (!status.enabled || status.authenticated) {
          window.location.replace("/");
        }
      } catch {
        setMessage("Giris durumu kontrol edilemedi.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth", {
        body: JSON.stringify({ password }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Giris yapilamadi.");
        return;
      }

      window.location.replace("/");
    } catch {
      setMessage("Giris baglantisi kurulamadi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-8">
      <form
        className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.9)] p-5 shadow-2xl shadow-black/30"
        onSubmit={submit}
      >
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
            <LockKeyhole size={20} />
            Finansman Asistani
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Lokal erisim kilidi aktif. Devam etmek icin parolayi girin.
          </p>
        </div>

        <label className="mt-5 block space-y-1 text-xs text-[var(--muted)]">
          Parola
          <input
            autoFocus
            className="h-11 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-sm text-white outline-none transition focus:border-emerald-300"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>

        {message ? (
          <p className="mt-3 rounded-md border border-yellow-300/20 bg-yellow-300/10 px-3 py-2 text-sm text-yellow-100">
            {message}
          </p>
        ) : null}

        <button
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-300 px-3 text-sm font-semibold text-black transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Kontrol ediliyor" : "Giris yap"}
        </button>
      </form>
    </main>
  );
}
