import { faq as staticFaq } from "@/data/faq";
import { fetchPublishedRows } from "@/lib/cms/published-list";

export type CmsFaqItem = { q: string; a: string };

export async function getFaq(): Promise<CmsFaqItem[]> {
  const rows = await fetchPublishedRows<{ question: string; answer: string }>({
    scope: "faq",
    noun: "FAQ items",
    table: "FaqItem",
    columns: "question, answer",
  });

  return rows ? rows.map((r) => ({ q: r.question, a: r.answer })) : staticFaq;
}
