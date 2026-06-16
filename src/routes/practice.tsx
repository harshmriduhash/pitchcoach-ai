import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Mic, MicOff, PhoneOff, Send, Volume2, VolumeX } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { continuePractice, scorePractice } from "@/lib/pitchcoach.functions";
import { logError } from "@/lib/monitoring";

export const Route = createFileRoute("/practice")({
  validateSearch: (s: Record<string, unknown>) => ({ persona: typeof s.persona === "string" ? s.persona : "gatekeeper" }),
  component: Practice,
  head: () => ({ meta: [{ title: "Live Practice | PitchCoach AI" }] }),
});
type Turn = { speaker: "user" | "ai"; text: string };

// Web Speech API typing shims
type SR = { start: () => void; stop: () => void; abort: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string };

function Practice() {
  const { persona: slug } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const sendTurn = useServerFn(continuePractice);
  const finish = useServerFn(scorePractice);
  const [persona, setPersona] = useState<Tables<"personas"> | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [fillers, setFillers] = useState(0);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [voice, setVoice] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);
  const draftRef = useRef("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { void supabase.from("personas").select("*").eq("slug", slug).single().then(({ data }) => setPersona(data)); }, [slug]);
  useEffect(() => { if (!active) return; const id = setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(id); }, [active]);
  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [turns]);
  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* noop */ } window.speechSynthesis?.cancel(); }, []);

  function speak(text: string) {
    if (!voice || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02; u.pitch = 0.95;
    window.speechSynthesis.speak(u);
  }

  function toggleMic() {
    if (listening) { try { recRef.current?.stop(); } catch { /* noop */ } setListening(false); return; }
    setMicError(null);
    const SRC = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;
    if (!SRC) { setMicError("Your browser doesn't support voice input. Try Chrome or Edge — or type your reply."); return; }
    try {
      const rec = new SRC();
      rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
      rec.onresult = (e) => {
        let interim = ""; let finalText = draftRef.current;
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          const text = r[0].transcript;
          if (r.isFinal) finalText += text + " "; else interim += text;
        }
        draftRef.current = finalText;
        setDraft(finalText + interim);
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed") setMicError("Microphone blocked. Allow it in your browser site settings and try again.");
        else if (e.error !== "aborted" && e.error !== "no-speech") setMicError(`Mic error: ${e.error}`);
        setListening(false);
        void logError("speech-recognition", e.error);
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch (err) {
      setMicError("Could not start the microphone."); void logError("mic-start", String(err));
    }
  }

  async function start() {
    if (!user) { void navigate({ to: "/auth", search: { mode: "signup" } }); return; }
    if (!persona) return;
    const { data, error } = await supabase.from("call_sessions").insert({ user_id: user.id, persona_id: persona.id, call_type: persona.persona_type === "investor" ? "investor" : "cold_call", status: "active", started_at: new Date().toISOString() }).select("id").single();
    if (error || !data) { void logError("start-session", error?.message ?? "no data"); return; }
    setSession(data.id);
    setTurns([{ speaker: "ai", text: persona.opening_line }]);
    await supabase.from("call_turns").insert({ session_id: data.id, user_id: user.id, turn_order: 1, speaker: "ai", text: persona.opening_line });
    setActive(true);
    speak(persona.opening_line);
  }

  async function sendMessage(message: string) {
    if (!session || busy || !message.trim()) return;
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false); setDraft(""); draftRef.current = "";
    setTurns(t => [...t, { speaker: "user", text: message }]);
    setBusy(true);
    try {
      const result = await sendTurn({ data: { sessionId: session, message } });
      setTurns(t => [...t, { speaker: "ai", text: result.reply }]);
      setFillers(n => n + result.fillerWords);
      speak(result.reply);
    } catch (e) {
      void logError("continue-practice", e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); await sendMessage(draft.trim()); }

  async function end() {
    if (!session) return;
    try { recRef.current?.stop(); } catch { /* noop */ }
    window.speechSynthesis?.cancel();
    setActive(false); setBusy(true);
    await supabase.from("call_sessions").update({ status: "scoring", duration_seconds: seconds }).eq("id", session);
    try { await finish({ data: { sessionId: session } }); void navigate({ to: "/report/$sessionId", params: { sessionId: session } }); }
    catch (e) { void logError("score-practice", e instanceof Error ? e.message : String(e)); setBusy(false); setActive(true); }
  }

  if (!active && !busy) return <AppShell><div className="mx-auto max-w-3xl py-12 text-center">
    <p className="text-sm font-bold uppercase tracking-[.2em] text-primary">Incoming challenge</p>
    <div className="mx-auto mt-8 grid size-28 place-items-center rounded-full border border-primary/30 bg-primary/10 font-display text-4xl text-primary">{persona?.name.replace("The ", "").slice(0, 2).toUpperCase()}</div>
    <h1 className="mt-7 text-6xl font-black">{persona?.name ?? "LOADING…"}</h1>
    <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{persona?.description}</p>
    <div className="mt-8 flex justify-center gap-3 text-sm"><span className="rounded-full bg-card px-4 py-2">10 minute drill</span><span className="rounded-full bg-card px-4 py-2">Difficulty {persona?.difficulty}/5</span></div>
    <Button size="xl" variant="hero" className="mt-10" onClick={start}><Mic />Start practice call</Button>
    <p className="mt-4 text-xs text-muted-foreground">Voice in / voice out — works best in Chrome & Edge. Or type your replies.</p>
  </div></AppShell>;

  if (busy && !active) return <AppShell><div className="grid min-h-[65vh] place-items-center text-center"><div><Loader2 className="mx-auto size-10 animate-spin text-primary" /><h1 className="mt-5 text-4xl font-black">GENERATING YOUR DEBRIEF</h1><p className="mt-2 text-muted-foreground">Your coach is reviewing every turn.</p></div></div></AppShell>;

  return <AppShell><div className="grid min-h-[calc(100vh-8rem)] gap-6 xl:grid-cols-[1fr_280px]">
    <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border p-4">
        <span className="flex items-center gap-3 font-bold"><span className={`size-2 rounded-full ${listening ? "animate-ping bg-red-500" : "animate-pulse bg-primary"}`} />{persona?.name}{listening && <small className="ml-2 text-xs font-normal uppercase text-red-500">● recording</small>}</span>
        <div className="flex items-center gap-3"><Button size="icon" variant="ghost" onClick={() => { setVoice(v => !v); window.speechSynthesis?.cancel(); }} aria-label={voice ? "Mute coach voice" : "Unmute coach voice"}>{voice ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}</Button><span className="font-mono">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span></div>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">{turns.map((t, i) => <div key={i} className={`max-w-[80%] rounded-xl p-4 text-sm leading-6 ${t.speaker === "user" ? "ml-auto bg-primary text-primary-foreground" : "border border-border bg-background"}`}><small className="mb-1 block font-bold uppercase opacity-60">{t.speaker === "user" ? "You" : persona?.name}</small>{t.text}</div>)}{busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Prospect is responding…</div>}<div ref={bottom} /></div>
      {micError && <div className="flex items-start gap-2 border-t border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-200"><AlertTriangle className="mt-0.5 size-3.5" />{micError}</div>}
      <form onSubmit={submit} className="flex gap-2 border-t border-border p-4">
        <Button type="button" size="icon" variant={listening ? "destructive" : "tactical"} className="h-12 w-12 shrink-0" onClick={toggleMic} aria-label={listening ? "Stop listening" : "Start listening"}>{listening ? <MicOff /> : <Mic />}</Button>
        <Input name="message" value={draft} onChange={(e) => { setDraft(e.target.value); draftRef.current = e.target.value; }} autoComplete="off" className="h-12 bg-background" placeholder={listening ? "Listening… speak naturally" : "Say your next line… or tap the mic"} />
        <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={busy || !draft.trim()}><Send /></Button>
      </form>
    </section>
    <aside className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live coach</p>
        <div className="mt-6 grid place-items-center"><div className={`grid size-28 place-items-center rounded-full border-8 ${listening ? "border-red-500/40 animate-pulse" : "border-primary/20"}`}><span className="font-display text-3xl">{listening ? "REC" : "LIVE"}</span></div></div>
        <div className="mt-7 flex justify-between border-t border-border pt-4 text-sm"><span className="text-muted-foreground">Filler words</span><b>{fillers}</b></div>
        <div className="mt-3 flex justify-between text-sm"><span className="text-muted-foreground">Objections</span><b>{Math.max(0, turns.filter(t => t.speaker === "ai").length - 1)}</b></div>
        <div className="mt-3 flex justify-between text-sm"><span className="text-muted-foreground">Turns</span><b>{turns.length}</b></div>
      </div>
      <Button variant="destructive" size="xl" className="w-full" onClick={end} disabled={busy}><PhoneOff />End & score</Button>
    </aside>
  </div></AppShell>;
}