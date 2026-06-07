import { processSteps as staticSteps } from "@/data/process-steps";
import { fetchPublishedRows } from "@/lib/cms/published-list";

export type CmsProcessStep = {
  number: string;
  title: string;
  body: string;
};

export async function getProcessSteps(): Promise<CmsProcessStep[]> {
  const rows = await fetchPublishedRows<{ title: string; body: string }>({
    scope: "process-steps",
    noun: "process steps",
    table: "process_step",
    columns: "id, title, body",
  });

  if (!rows) return staticSteps;

  return rows.map((r, i) => ({
    number: String(i + 1).padStart(2, "0"),
    title: r.title,
    body: r.body,
  }));
}
