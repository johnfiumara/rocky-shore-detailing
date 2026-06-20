import { services as staticServices } from "@/data/services";

export type CmsService = {
  slug: string;
  title: string;
  description?: string | null;
  tiers: { size: string; price: number }[];
};

export async function getServices(): Promise<CmsService[]> {
  return staticServices;
}
