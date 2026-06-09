import { services as staticServices } from "@/data/services";
import { fetchPublishedRows } from "@/lib/cms/published-list";

export type CmsService = {
  slug: string;
  title: string;
  description?: string | null;
  tiers: { size: string; price: number }[];
};

export async function getServices(): Promise<CmsService[]> {
  const rows = await fetchPublishedRows<CmsService>({
    scope: "services",
    noun: "services",
    table: "Service",
    columns: "slug, title, description, tiers:ServiceTier(size, price)",
    flag: "active",
  });

  return rows ?? staticServices;
}
