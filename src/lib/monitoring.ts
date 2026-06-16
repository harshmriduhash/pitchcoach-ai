import { supabase } from "@/integrations/supabase/client";

export async function logError(source: string, message: string, context?: Record<string, unknown>) {
  try {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("error_logs").insert({
      user_id: u.user?.id ?? null,
      source: source.slice(0, 199),
      message: message.slice(0, 3999),
      severity: "error",
      context: context ?? null,
    });
  } catch {
    // swallow — monitoring must never break the app
  }
}

export function installGlobalErrorMonitor() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __pcMonitor?: boolean }).__pcMonitor) return;
  (window as unknown as { __pcMonitor?: boolean }).__pcMonitor = true;
  window.addEventListener("error", (e) => { void logError("window.error", String(e.message), { stack: e.error?.stack ?? null, url: e.filename }); });
  window.addEventListener("unhandledrejection", (e) => { void logError("unhandledrejection", String(e.reason?.message ?? e.reason)); });
}