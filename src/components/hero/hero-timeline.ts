import { getProject, type ISheet } from "@theatre/core";

let cachedSheet: ISheet | null = null;

export function getHeroSheet(): ISheet {
  if (cachedSheet) return cachedSheet;
  const project = getProject("Rocky Shore Hero", { state: {} });
  cachedSheet = project.sheet("Intro");
  return cachedSheet;
}
