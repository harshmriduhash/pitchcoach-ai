import { jsPDF } from "jspdf";
import type { Tables } from "@/integrations/supabase/types";

export function exportReportPdf(call: Tables<"call_sessions">) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;
  doc.setFillColor(15, 18, 22); doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 200, 60); doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("PITCHCOACH AI — CALL DEBRIEF", 40, 40);
  doc.setFontSize(28); doc.setTextColor(255, 255, 255);
  doc.text(`Score ${Math.round(call.score_overall ?? 0)} / 100`, 40, 74);
  y = 130;
  doc.setTextColor(20, 20, 20); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text(`Call type: ${call.call_type}`, 40, y); y += 18;
  doc.text(`Date: ${new Date(call.created_at).toLocaleString()}`, 40, y); y += 28;

  const dims: [string, number | null][] = [
    ["Opening", call.score_opening], ["Talk ratio", call.score_talk_ratio],
    ["Objection handling", call.score_objection_handling], ["Filler words", call.score_filler_words],
    ["Value framing", call.score_value_framing], ["Discovery", call.score_discovery_questions],
    ["Next step", call.score_next_step], ["Confidence", call.score_confidence],
  ];
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("Scorecard", 40, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  for (const [name, v] of dims) {
    doc.text(`${name}`, 40, y); doc.text(`${Math.round(v ?? 0)}`, W - 60, y, { align: "right" });
    doc.setDrawColor(220); doc.line(40, y + 4, W - 40, y + 4); y += 18;
  }
  y += 14;
  block(doc, "Top strength", call.top_strength ?? "—", y); y += 70;
  block(doc, "Critical weakness", call.critical_weakness ?? "—", y); y += 70;
  block(doc, "Coach's debrief", call.feedback ?? "—", y); y += 110;

  const actions = Array.isArray(call.action_items) ? call.action_items.filter((x): x is string => typeof x === "string") : [];
  doc.setFont("helvetica", "bold"); doc.text("Next drills", 40, y); y += 18;
  doc.setFont("helvetica", "normal");
  actions.forEach((a, i) => { const lines = doc.splitTextToSize(`${i + 1}. ${a}`, W - 80); doc.text(lines, 40, y); y += lines.length * 14 + 4; });

  doc.save(`pitchcoach-report-${call.id.slice(0, 8)}.pdf`);
}

function block(doc: jsPDF, title: string, body: string, y: number) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(120);
  doc.text(title.toUpperCase(), 40, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(20);
  const lines = doc.splitTextToSize(body, W - 80);
  doc.text(lines.slice(0, 4), 40, y + 16);
}