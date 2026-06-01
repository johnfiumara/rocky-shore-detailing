import { supabaseAnon } from "@/lib/supabase/server";
import { processSteps as staticSteps } from "@/data/process-steps";

export type CmsProcessStep = {
  number: string;
  title: string;
  body: string;
};

export async function getProcessSteps(): Promise<CmsProcessStep[]> {

  try {
    const { data, error } = await supabaseAnon()
      .from("process_step")
      .select("id, title, body")
      .eq("published", true)
      .order("sortOrder");

    if (error || !data || data.length === 0) {
      console.warn("[cms:process-steps] No process steps found, using static fallback", {
        error: error?.message,
        timestamp: new Date().toISOString(),
      });
      return staticSteps;
    }
    return data.map((r: { title: string; body: string }, i: number) => ({
      number: String(i + 1).padStart(2, "0"),
      title: r.title,
      body: r.body,
    }));
  } catch (err) {
    console.error("[cms:process-steps] Failed to fetch process steps", {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return staticSteps;
  }
}


