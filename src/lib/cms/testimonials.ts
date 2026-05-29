import { supabaseAnon } from "@/lib/supabase/server";
import { testimonials as staticTestimonials } from "@/data/testimonials";

export type CmsTestimonial = {
  quote: string;
  name: string;
  context: string;
};

export async function getTestimonials(): Promise<CmsTestimonial[]> {

  try {
    const { data, error } = await supabaseAnon()
      .from("Testimonial")
      .select("quote, name, context")
      .eq("published", true)
      .order("sortOrder");

    if (error || !data || data.length === 0) return staticTestimonials;
    return data;
  } catch {
    return staticTestimonials;
  }
}


