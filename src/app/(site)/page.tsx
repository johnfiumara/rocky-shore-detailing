import dynamic from "next/dynamic";
import Hero from "@/components/hero/hero";
import StorySection from "@/components/story-section";
import ServicesSection from "@/components/services-section";
import {
  BookingSkeleton,
  ProcessSkeleton,
  GallerySkeleton,
  FaqSkeleton,
  TestimonialsSkeleton,
} from "@/components/skeletons";

const ProcessSection = dynamic(
  () => import("@/components/process-section"),
  { loading: () => <ProcessSkeleton />, ssr: true },
);

const GallerySection = dynamic(
  () => import("@/components/gallery-section"),
  { loading: () => <GallerySkeleton />, ssr: true },
);

const TestimonialsSection = dynamic(
  () => import("@/components/testimonials-section"),
  { loading: () => <TestimonialsSkeleton />, ssr: true },
);

const BookingSection = dynamic(
  () =>
    import("@/components/booking/booking-section-server").then(
      (mod) => mod.BookingSectionServer,
    ),
  { loading: () => <BookingSkeleton />, ssr: true },
);

const FaqSection = dynamic(() => import("@/components/faq-section"), {
  loading: () => <FaqSkeleton />,
  ssr: true,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ rebook?: string }>;
}) {
  const { rebook } = await searchParams;

  return (
    <>
      <Hero />
      <StorySection />
      <ServicesSection />
      <ProcessSection />
      <GallerySection />
      <TestimonialsSection />
      <BookingSection rebookId={rebook} />
      <FaqSection />
    </>
  );
}
