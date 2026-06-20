import { testimonials as staticTestimonials } from "@/data/testimonials";

export type CmsTestimonial = {
  quote: string;
  name: string;
  context: string;
};

export async function getTestimonials(): Promise<CmsTestimonial[]> {
  return staticTestimonials;
}
