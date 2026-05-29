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

    if (error || !data || data.length === 0) return staticFaq;
    return data.map((r: { question: string; answer: string }) => ({ q: r.question, a: r.answer }));
  } catch {
    return staticFaq;
  }
}


