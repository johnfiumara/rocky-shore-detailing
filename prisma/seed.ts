import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const services = [
  {
    slug: "full-package",
    title: "Interior, Exterior, Tires & Trunk",
    sortOrder: 0,
    tiers: [
      { size: "S", price: 200 },
      { size: "M", price: 235 },
      { size: "L", price: 270 },
    ],
  },
  {
    slug: "interior-exterior",
    title: "Interior & Exterior",
    sortOrder: 1,
    tiers: [
      { size: "S", price: 150 },
      { size: "M", price: 185 },
      { size: "L", price: 220 },
    ],
  },
  {
    slug: "interior-tires",
    title: "Interior & Tires",
    sortOrder: 2,
    tiers: [
      { size: "S", price: 145 },
      { size: "M", price: 165 },
      { size: "L", price: 185 },
    ],
  },
  {
    slug: "exterior-tires",
    title: "Exterior & Tires",
    sortOrder: 3,
    tiers: [
      { size: "S", price: 100 },
      { size: "M", price: 130 },
      { size: "L", price: 130 },
    ],
  },
  {
    slug: "interior-restoration",
    title: "Interior Restoration",
    sortOrder: 4,
    tiers: [
      { size: "S", price: 110 },
      { size: "M", price: 130 },
      { size: "L", price: 150 },
    ],
  },
  {
    slug: "refresh",
    title: "Refresh",
    sortOrder: 5,
    tiers: [
      { size: "S", price: 65 },
      { size: "M", price: 85 },
      { size: "L", price: 105 },
    ],
  },
];

const testimonials = [
  {
    quote: "I can't possibly recommend Aiden enough. He detailed my truck this afternoon, and did such an amazing, thorough job - inside and out. Aiden is a super nice guy, and did such a great job - seriously, if you need your vehicle detailed, I can't imagine anyone better. Great communication before, friendly during. 10 out of 10.",
    name: "Andrew C",
    context: "Gorham · 2026",
    sortOrder: 0,
  },
  {
    quote: "I've used three detailers since moving to Maine. Rocky Coast is the only one I'll let touch my truck again.",
    name: "Sarah B.",
    context: "Bangor · 2022 F-150",
    sortOrder: 1,
  },
  {
    quote: "Ceramic coat held up through two winters of salt and sand. Worth every penny.",
    name: "Jared K.",
    context: "Camden · Tesla Model 3",
    sortOrder: 2,
  },
  {
    quote: "Pet hair from two labs and a toddler's juice incident — completely gone. I genuinely cried a little.",
    name: "Emily R.",
    context: "Augusta · Honda Pilot",
    sortOrder: 3,
  },
  {
    quote: "Booked him for a paint correction on the wife's surprise birthday gift. She thought we'd bought a new car.",
    name: "Tom V.",
    context: "Kennebunk · Mercedes E300",
    sortOrder: 4,
  },
  {
    quote: "Most thorough detailer I've ever hired. Asked questions. Took photos. Explained every step. Pro.",
    name: "Hannah P.",
    context: "Bar Harbor · Subaru Outback",
    sortOrder: 5,
  },
];

const faqItems = [
  {
    question: "Where do you service?",
    answer: "Rocky Coast is fully mobile — we come to your driveway, workplace, or wherever your vehicle is parked across Maine.",
    sortOrder: 0,
  },
  {
    question: "How long does a detail take?",
    answer: "A standard interior and exterior detail takes 3–5 hours depending on vehicle size and condition. We'll give you a more accurate estimate after seeing the car.",
    sortOrder: 1,
  },
  {
    question: "Do you bring your own water and power?",
    answer: "Yes — we carry our own water supply and generator so you don't need to provide anything.",
    sortOrder: 2,
  },
  {
    question: "What is ceramic coating?",
    answer: "Ceramic coating is a liquid polymer that bonds to your paint and creates a hard, hydrophobic layer. It protects against UV, salt, and minor scratches while making the car easier to wash.",
    sortOrder: 3,
  },
  {
    question: "How do I prepare my car for a detail?",
    answer: "Remove personal items from the interior. Everything else — we've got it covered.",
    sortOrder: 4,
  },
];

async function main() {
  console.log("Seeding services…");
  for (const s of services) {
    await db.service.upsert({
      where: { slug: s.slug },
      update: { title: s.title, sortOrder: s.sortOrder },
      create: {
        slug: s.slug,
        title: s.title,
        sortOrder: s.sortOrder,
        tiers: { create: s.tiers },
      },
    });
  }

  console.log("Seeding testimonials…");
  for (const t of testimonials) {
    const existing = await db.testimonial.findFirst({ where: { name: t.name } });
    if (!existing) {
      await db.testimonial.create({ data: t });
    }
  }

  console.log("Seeding FAQ…");
  for (const f of faqItems) {
    const existing = await db.faqItem.findFirst({ where: { question: f.question } });
    if (!existing) {
      await db.faqItem.create({ data: f });
    }
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
