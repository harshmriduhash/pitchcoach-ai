import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Download, Target, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { exportReportPdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/report/$sessionId")({ component: Report, head: () => ({ meta: [{ title: "Call Debrief | PitchCoach AI" }] }) });

function Report() {
  const { sessionId } = Route.useParams();
  const [call, setCall] = useState<Tables<"call_sessions"> | null>(null);
  useEffect(() => { void supabase.from("call_sessions").select("*").eq("id", sessionId).single().then(({ data }) => setCall(data)); }, [sessionId]);
  const dims = call ? [["Opening hook", call.score_opening], ["Talk ratio", call.score_talk_ratio], ["Objection handling", call.score_objection_handling], ["Filler words", call.score_filler_words], ["Value framing", call.score_value_framing], ["Discovery", call.score_discovery_questions], ["Next step", call.score_next_step], ["Confidence", call.score_confidence]] as const : [];
  const actions = Array.isArray(call?.action_items) ? (call.action_items as unknown[]).filter((x): x is string => typeof x === "string") : [];
  return <AppShell>{!call ? <p>Loading report…</p> : <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-bold uppercase tracking-[.2em] text-primary">Session debrief</p>
      <Button variant="tactical" onClick={() => exportReportPdf(call)}><Download className="size-4" />Export PDF</Button>
    </div>
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <section className="rounded-xl border border-border bg-card p-8 text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Overall score</p><p className="mt-4 font-display text-9xl font-black text-primary">{Math.round(call.score_overall ?? 0)}</p><p className="text-sm text-muted-foreground">out of 100</p><div className="mt-8 border-t border-border pt-6 text-left"><p className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="size-4 text-primary" />Top strength</p><p className="mt-2 text-sm text-muted-foreground">{call.top_strength}</p></div></section>
      <section><h1 className="mt-2 text-5xl font-black">THE SCORE DOESN'T LIE.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{call.feedback}</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{dims.map(([name, value]) => <div key={String(name)} className="rounded-lg border border-border bg-card p-4"><div className="mb-3 flex justify-between text-sm"><b>{name}</b><span className="font-display text-xl text-primary">{Math.round(Number(value ?? 0))}</span></div><Progress value={Number(value ?? 0)} /></div>)}</div></section>
    </div>
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <article className="rounded-xl border border-border bg-card p-6"><p className="text-xs font-bold uppercase tracking-wider text-primary">Critical weakness</p><h2 className="mt-3 text-3xl font-bold">{call.critical_weakness}</h2><div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center"><div><b className="font-display text-3xl">{Math.round(call.talk_ratio_user ?? 0)}%</b><p className="text-xs text-muted-foreground">Talk ratio</p></div><div><b className="font-display text-3xl">{call.filler_word_count}</b><p className="text-xs text-muted-foreground">Fillers</p></div><div><b className="font-display text-3xl">{call.objections_handled}/{call.objections_raised}</b><p className="text-xs text-muted-foreground">Objections</p></div></div></article>
      <article className="rounded-xl border border-primary/40 bg-primary/5 p-6"><p className="text-xs font-bold uppercase tracking-wider text-primary">Next practice plan</p><div className="mt-4 space-y-3">{actions.map((a, i) => <p key={a} className="flex gap-3 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /><span><b>Drill {i + 1}.</b> {a}</span></p>)}</div><Button asChild className="mt-6"><Link to="/practice" search={{ persona: "gatekeeper" }}><Target />Run it back <ArrowRight /></Link></Button></article>
    </section>
  </>}</AppShell>;
}