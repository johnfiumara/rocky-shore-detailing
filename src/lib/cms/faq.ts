import { faq as staticFaq } from "@/data/faq";

export type CmsFaqItem = { q: string; a: string };

export async function getFaq(): Promise<CmsFaqItem[]> {
  return staticFaq;
}
