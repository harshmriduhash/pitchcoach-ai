import { BarChart3, History, LayoutDashboard, LogOut, Menu, PhoneCall, Settings, Trophy, Users, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "./brand";
import { Button } from "./ui/button";

const nav = [
  ["/dashboard", "Dashboard", LayoutDashboard], ["/practice", "Start call", PhoneCall],
  ["/history", "Call history", History], ["/analytics", "Analytics", BarChart3],
  ["/personas", "Personas", Users], ["/leaderboard", "Leaderboard", Trophy], ["/settings", "Settings", Settings],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false); const navigate = useNavigate();
  return <div className="min-h-screen bg-background text-foreground"><header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden"><Brand /><Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</Button></header>
    <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-border bg-card p-5 lg:flex`}><Brand /><nav className="mt-10 flex flex-1 flex-col gap-1">{nav.map(([to,label,Icon]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"><Icon className="size-4" />{label}</Link>)}</nav><div className="rounded-lg border border-border bg-background p-3"><p className="text-xs font-bold uppercase tracking-widest text-primary">Free plan</p><p className="mt-1 text-xs text-muted-foreground">3 practice sessions each month</p></div><Button className="mt-3 justify-start" variant="ghost" onClick={async () => { await supabase.auth.signOut(); void navigate({ to: "/" }); }}><LogOut /> Sign out</Button></aside>
    <main className="lg:pl-64"><div className="mx-auto max-w-7xl p-5 md:p-8 lg:p-10">{children}</div></main></div>;
}