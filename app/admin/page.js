"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Lock, LogOut, Trash2 } from "lucide-react";

const inputClass =
  "w-full rounded-xl bg-[#0c1a33] border border-white/20 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20 transition [color-scheme:dark]";

function sortNewestFirst(list) {
  return [...list].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEnabled, setAdminEnabled] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState([]);
  const [actionId, setActionId] = useState(null);

  const sortedMemories = useMemo(
    () => sortNewestFirst(memories),
    [memories],
  );

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session");
      const body = await res.json();
      setAdminEnabled(body.admin !== false);
      setAuthenticated(Boolean(body.authenticated));
    } catch {
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadMemories = useCallback(async () => {
    const res = await fetch("/api/admin/memories");
    if (!res.ok) throw new Error("Failed to load notes");
    const body = await res.json();
    setMemories(sortNewestFirst(body.memories || []));
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!authenticated) return;
    loadMemories().catch(() => setMemories([]));
  }, [authenticated, loadMemories]);

  const onLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setLoginError(body.error || "Login failed");
        return;
      }
      setAuthenticated(true);
      setPassword("");
      await loadMemories();
    } catch {
      setLoginError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setMemories([]);
    setEmail("");
    setPassword("");
  };

  const setArchived = async (id, archived) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!res.ok) return;
      const body = await res.json();
      setMemories((prev) =>
        sortNewestFirst(
          prev.map((m) => (m.id === id ? body.memory : m)),
        ),
      );
    } finally {
      setActionId(null);
    }
  };

  const deleteMemory = async (id) => {
    if (!window.confirm("Delete this note permanently?")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/memories/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setActionId(null);
    }
  };

  if (checking) {
    return (
      <div className="h-[100dvh] bg-[#0a1630] text-slate-200 flex items-center justify-center px-4">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#0a1630] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(120, 80, 220, 0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(30, 100, 200, 0.1) 0%, transparent 50%)",
        }}
      />

      {/* Sticky top — header + toolbar */}
      <div className="sticky top-0 z-20 flex-shrink-0 border-b border-white/10 bg-[#0a1630]/95 backdrop-blur-md">
        <header>
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Lock size={16} className="text-purple-300 flex-shrink-0" />
                <span className="truncate">Admin</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                Manage all memory / notes in the jar
              </p>
            </div>
            <Link
              href="/"
              className="flex-shrink-0 text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2"
            >
              Back to jar
            </Link>
          </div>
        </header>

        {authenticated && (
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 border-t border-white/5 px-4 py-2.5">
            <p className="text-sm text-slate-300">
              {memories.length} note{memories.length === 1 ? "" : "s"} total
            </p>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-slate-100 transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {!authenticated && adminEnabled ? (
        <main className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-4 py-6">
          <div className="w-full max-w-sm">
            <form
              onSubmit={onLogin}
              className="rounded-2xl border border-white/15 bg-black/50 backdrop-blur-md p-5 sm:p-6 space-y-4 shadow-2xl"
            >
              <div className="text-center mb-1">
                <p className="text-sm font-medium text-slate-100">Sign in</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Admin access only
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={inputClass}
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-300 text-center">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </main>
      ) : !adminEnabled ? (
        <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            Admin login is not configured. Set{" "}
            <code className="text-amber-50">ADMIN_EMAIL</code> and{" "}
            <code className="text-amber-50">ADMIN_PASSWORD</code> in{" "}
            <code className="text-amber-50">.env.local</code>.
          </div>
        </main>
      ) : (
        <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 min-h-0 overflow-hidden px-4">
          <div
            className="h-full overflow-y-auto overscroll-y-contain py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="space-y-3 sm:space-y-4">
              {sortedMemories.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">
                  No notes yet.
                </p>
              ) : (
                sortedMemories.map((m) => (
                  <article
                    key={m.id}
                    className={`rounded-xl border p-3.5 sm:p-4 ${
                      m.archived
                        ? "border-slate-600/40 bg-slate-900/40 opacity-80"
                        : "border-white/15 bg-black/40"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-purple-300">
                            {m.type}
                          </span>
                          {m.archived && (
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">
                              Archived
                            </span>
                          )}
                          {m.author && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[12rem]">
                              — {m.author}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-100 whitespace-pre-wrap break-words leading-relaxed">
                          {m.text}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2">
                          {m.created_at
                            ? new Date(m.created_at).toLocaleString()
                            : "—"}
                        </p>
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 sm:gap-1.5 flex-shrink-0 sm:min-w-[5.5rem]">
                        <button
                          type="button"
                          disabled={actionId === m.id}
                          onClick={() => setArchived(m.id, !m.archived)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 sm:py-1 text-[11px] hover:bg-white/10 disabled:opacity-40 transition-colors"
                        >
                          {m.archived ? (
                            <ArchiveRestore size={13} />
                          ) : (
                            <Archive size={13} />
                          )}
                          {m.archived ? "Restore" : "Archive"}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === m.id}
                          onClick={() => deleteMemory(m.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-2 sm:py-1 text-[11px] text-red-200 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
