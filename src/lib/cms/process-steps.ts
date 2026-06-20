import { processSteps as staticSteps } from "@/data/process-steps";

export type CmsProcessStep = {
  number: string;
  title: string;
  body: string;
};

export async function getProcessSteps(): Promise<CmsProcessStep[]> {
  return staticSteps;
}
