import { generateText, Output } from "ai";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createAiGateway } from "./ai-gateway.server";

const turnSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(3000),
});

const reportSchema = z.object({
  scores: z.object({
    opening: z.number().min(0).max(100), talk_ratio: z.number().min(0).max(100),
    objection_handling: z.number().min(0).max(100), filler_words: z.number().min(0).max(100),
    value_framing: z.number().min(0).max(100), discovery_questions: z.number().min(0).max(100),
    next_step: z.number().min(0).max(100), confidence: z.number().min(0).max(100),
  }),
  overall_score: z.number().min(0).max(100),
  talk_ratio_user: z.number().min(0).max(100),
  filler_word_count: z.number().int().min(0),
  objections_raised: z.number().int().min(0),
  objections_handled: z.number().int().min(0),
  top_strength: z.string(), critical_weakness: z.string(), feedback: z.string(),
  action_items: z.array(z.string()).length(3),
});

function gateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI coaching is temporarily unavailable.");
  return createAiGateway(key);
}

export const continuePractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => turnSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: session } = await context.supabase.from("call_sessions").select("*, personas(*)").eq("id", data.sessionId).eq("user_id", context.userId).single();
    if (!session) throw new Error("Practice session not found.");
    const { data: turns } = await context.supabase.from("call_turns").select("speaker,text,turn_order").eq("session_id", data.sessionId).order("turn_order").limit(30);
    const persona = session.personas;
    const history = (turns ?? []).map((turn) => `${turn.speaker === "user" ? "REP" : "PROSPECT"}: ${turn.text}`).join("\n");
    const { text } = await generateText({
      model: gateway().chatModel("google/gemini-3-flash-preview"),
      system: `You are ${persona?.name ?? "a difficult prospect"}. ${persona?.system_prompt ?? "Push back realistically."} Never break character. Raise objections naturally. Keep replies to 1-3 spoken sentences. If the rep rambles, interrupt. Do not coach them during the call.`,
      prompt: `CALL SO FAR:\n${history}\nREP: ${data.message}\nRespond only as the prospect.`,
    });
    const nextOrder = (turns?.length ?? 0) + 1;
    const fillerWords = data.message.toLowerCase().match(/\b(um|uh|like|basically|actually|you know)\b/g) ?? [];
    const { error } = await context.supabase.from("call_turns").insert([
      { session_id: data.sessionId, user_id: context.userId, turn_order: nextOrder, speaker: "user", text: data.message, filler_word_count: fillerWords.length, filler_words: fillerWords },
      { session_id: data.sessionId, user_id: context.userId, turn_order: nextOrder + 1, speaker: "ai", text },
    ]);
    if (error) throw new Error("Could not save this turn.");
    return { reply: text, fillerWords: fillerWords.length };
  });

export const scorePractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: session } = await context.supabase.from("call_sessions").select("*, personas(name)").eq("id", data.sessionId).eq("user_id", context.userId).single();
    const { data: turns } = await context.supabase.from("call_turns").select("speaker,text").eq("session_id", data.sessionId).order("turn_order");
    if (!session || !turns?.length) throw new Error("Complete at least one exchange before ending.");
    const transcript = turns.map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n");
    const { output } = await generateText({
      model: gateway().chatModel("google/gemini-3-flash-preview"),
      output: Output.object({ schema: reportSchema }),
      system: "You are a direct, world-class sales coach. Score consistently and give specific, useful feedback grounded only in the transcript.",
      prompt: `Persona: ${session.personas?.name ?? "Prospect"}\nCall type: ${session.call_type}\nTranscript:\n${transcript}`,
    });
    if (!output) throw new Error("Could not generate the debrief.");
    const s = output.scores;
    const { error } = await context.supabase.from("call_sessions").update({ status: "complete", ended_at: new Date().toISOString(), score_overall: output.overall_score, score_opening: s.opening, score_talk_ratio: s.talk_ratio, score_objection_handling: s.objection_handling, score_filler_words: s.filler_words, score_value_framing: s.value_framing, score_discovery_questions: s.discovery_questions, score_next_step: s.next_step, score_confidence: s.confidence, talk_ratio_user: output.talk_ratio_user, filler_word_count: output.filler_word_count, objections_raised: output.objections_raised, objections_handled: output.objections_handled, top_strength: output.top_strength, critical_weakness: output.critical_weakness, feedback: output.feedback, action_items: output.action_items, transcript }).eq("id", data.sessionId).eq("user_id", context.userId);
    if (error) throw new Error("Could not save your report.");
    return output;
  });