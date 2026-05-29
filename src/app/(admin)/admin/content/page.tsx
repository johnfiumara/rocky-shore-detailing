import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ServicesTable from "./services-table";
import TestimonialsManager from "./testimonials-manager";
import FaqManager from "./faq-manager";

export const metadata = { title: "Content" };

export default async function ContentPage() {
  await requireRole("admin", "editor");

  const [services, testimonials, faqItems] = await Promise.all([
    prisma.service.findMany({
      orderBy: { sortOrder: "asc" },
      include: { tiers: { orderBy: { size: "asc" } } },
    }),
    prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-12">
      <h1 className="text-2xl font-display text-bone">Content</h1>

      <section className="space-y-4">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">Services & Pricing</h2>
        <ServicesTable services={services} />
      </section>

      <section className="space-y-4">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">Testimonials</h2>
        <TestimonialsManager testimonials={testimonials} />
      </section>

      <section className="space-y-4">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">FAQ</h2>
        <FaqManager faqItems={faqItems} />
      </section>
    </div>
  );
}
