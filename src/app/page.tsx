import StorySection from "@/components/story-section";
import ServicesSection from "@/components/services-section";
import ProcessSection from "@/components/process-section";
import GallerySection from "@/components/gallery-section";
import TestimonialsSection from "@/components/testimonials-section";
import BookingSection from "@/components/booking-section";
import FaqSection from "@/components/faq-section";

export default function Page() {
  return (
    <>
      <StorySection />
      <ServicesSection />
      <ProcessSection />
      <GallerySection />
      <TestimonialsSection />
      <BookingSection />
      <FaqSection />
    </>
  );
}
