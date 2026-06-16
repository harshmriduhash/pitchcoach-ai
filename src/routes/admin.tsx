import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertOctagon, CheckCircle2, PhoneCall, ShieldOff, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "Admin Console | PitchCoach AI" }, { name: "robots", content: "noindex" }] }),
});

type ErrorRow = { id: string; severity: string; source: string; message: string; created_at: string; resolved: boolean; user_id: string | null };

function Admin() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, calls: 0, completed: 0, avgScore: 0 });
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => { if (!loading && user && !isAdmin) { /* not admin */ } }, [loading, user, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    void (async () => {
      const [u, c, done, scores, errs] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("call_sessions").select("*", { count: "exact", head: true }),
        supabase.from("call_sessions").select("*", { count: "exact", head: true }).eq("status", "complete"),
        supabase.from("call_sessions").select("score_overall").not("score_overall", "is", null).limit(500),
        supabase.from("error_logs").select("id,severity,source,message,created_at,resolved,user_id").eq("resolved", showResolved).order("created_at", { ascending: false }).limit(100),
      ]);
      const scoreRows = (scores.data ?? []) as { score_overall: number | null }[];
      const avg = scoreRows.length ? Math.round(scoreRows.reduce((a, r) => a + (r.score_overall ?? 0), 0) / scoreRows.length) : 0;
      setStats({ users: u.count ?? 0, calls: c.count ?? 0, completed: done.count ?? 0, avgScore: avg });
      setErrors((errs.data as ErrorRow[] | null) ?? []);
    })();
  }, [isAdmin, showResolved, refresh]);

  async function markResolved(id: string) {
    await supabase.from("error_logs").update({ resolved: true }).eq("id", id);
    setRefresh(r => r + 1);
  }

  if (loading) return <AppShell><p className="p-10 text-muted-foreground">Loading…</p></AppShell>;
  if (!user) { void navigate({ to: "/auth", search: { mode: "login" } }); return null; }
  if (!isAdmin) return <AppShell><div className="mx-auto max-w-xl py-20 text-center">
    <ShieldOff className="mx-auto size-12 text-muted-foreground" />
    <h1 className="mt-6 text-3xl font-black">ADMIN ACCESS ONLY</h1>
    <p className="mt-3 text-muted-foreground">Your account doesn't have admin permissions. Ask an existing admin to grant you the role.</p>
    <code className="mt-6 inline-block rounded-md bg-card px-3 py-2 text-xs">INSERT INTO public.user_roles (user_id, role) VALUES ('{user.id}', 'admin');</code>
  </div></AppShell>;

  const cards = [
    { label: "Total users", value: stats.users, Icon: Users },
    { label: "Total calls", value: stats.calls, Icon: PhoneCall },
    { label: "Completed", value: stats.completed, Icon: CheckCircle2 },
    { label: "Avg score", value: stats.avgScore, Icon: TrendingUp },
  ];

  return <AppShell>
    <p className="text-sm font-bold uppercase tracking-[.2em] text-primary">Operator console</p>
    <h1 className="mt-2 text-5xl font-black">ADMIN DASHBOARD.</h1>
    <p className="mt-2 text-muted-foreground">Live platform health, usage, and incident tracking.</p>

    <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, Icon }) => <article key={label} className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs font-bold uppercase tracking-wider">{label}</span><Icon className="size-4 text-primary" /></div>
      <p className="mt-5 font-display text-4xl font-bold">{value}</p>
    </article>)}</div>

    <section className="mt-10 rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border p-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold"><AlertOctagon className="size-5 text-primary" />Error feed</h2>
        <div className="flex gap-2">
          <Button size="sm" variant={showResolved ? "ghost" : "default"} onClick={() => setShowResolved(false)}>Open</Button>
          <Button size="sm" variant={showResolved ? "default" : "ghost"} onClick={() => setShowResolved(true)}>Resolved</Button>
        </div>
      </header>
      {errors.length ? <ul className="divide-y divide-border">{errors.map(e => <li key={e.id} className="grid grid-cols-[1fr_auto] gap-4 p-5">
        <div>
          <div className="flex items-center gap-2"><span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-bold uppercase text-red-400">{e.severity}</span><b className="text-sm">{e.source}</b><span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span></div>
          <p className="mt-2 break-words font-mono text-xs text-muted-foreground">{e.message}</p>
        </div>
        {!e.resolved && <Button size="sm" variant="ghost" onClick={() => markResolved(e.id)}><CheckCircle2 className="size-4" />Resolve</Button>}
      </li>)}</ul> : <p className="p-10 text-center text-sm text-muted-foreground">No {showResolved ? "resolved" : "open"} errors. Quiet skies.</p>}
    </section>
  </AppShell>;
}