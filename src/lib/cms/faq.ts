import { supabaseAnon } from "@/lib/supabase/server";
import { faq as staticFaq } from "@/data/faq";

export type CmsFaqItem = { q: string; a: string };

export async function getFaq(): Promise<CmsFaqItem[]> {

  try {
    const { data, error } = await supabaseAnon()
      .from("FaqItem")
      .select("question, answer")
      .eq("published", true)
      .order("sortOrder");

    if (error || !data || data.length === 0) {
      console.warn("[cms:faq] No FAQ items found, using static fallback", {
        error: error?.message,
        timestamp: new Date().toISOString(),
      });
      return staticFaq;
    }
    return data.map((r: { question: string; answer: string }) => ({ q: r.question, a: r.answer }));
  } catch (err) {
    console.error("[cms:faq] Failed to fetch FAQ items", {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return staticFaq;
  }
}


