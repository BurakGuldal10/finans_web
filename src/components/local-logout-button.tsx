"use client";

import { LogOut } from "lucide-react";

export function LocalLogoutButton() {
  async function logout() {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => null);
    window.location.href = "/login";
  }

  return (
    <button
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm text-white transition hover:border-red-300 hover:text-red-100"
      onClick={logout}
      type="button"
    >
      <LogOut size={15} />
      Cikis
    </button>
  );
}
