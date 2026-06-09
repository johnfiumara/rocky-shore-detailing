import { getProcessSteps } from "@/lib/cms/process-steps";
import ProcessSectionClient from "./process-section-client";

export default async function ProcessSection() {
  const steps = await getProcessSteps();
  return <ProcessSectionClient steps={steps} />;
}

