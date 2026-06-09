import { testimonials as staticTestimonials } from "@/data/testimonials";
import { fetchPublishedRows } from "@/lib/cms/published-list";

export type CmsTestimonial = {
  quote: string;
  name: string;
  context: string;
};

export async function getTestimonials(): Promise<CmsTestimonial[]> {
  const rows = await fetchPublishedRows<CmsTestimonial>({
    scope: "testimonials",
    noun: "testimonials",
    table: "Testimonial",
    columns: "quote, name, context",
  });

  return rows ?? staticTestimonials;
}
