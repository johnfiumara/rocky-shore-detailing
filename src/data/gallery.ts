export type GalleryImage = {
  src: string;
  alt: string;
};

export type BeforeAfterPair = {
  before: GalleryImage;
  after: GalleryImage;
  label: string;
};

// Placeholder Unsplash images — replace with real before/after shots in /public/gallery/
export const beforeAfter: BeforeAfterPair = {
  label: "Single-stage paint correction · 2017 BMW M2",
  before: {
    src: "https://images.unsplash.com/photo-1547038577-da80abbc4f19?w=1600&q=80",
    alt: "Car with swirl marks and oxidation before correction",
  },
  after: {
    src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80",
    alt: "Same car after paint correction, deep gloss restored",
  },
};

export const galleryGrid: GalleryImage[] = [
  { src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80", alt: "Detailed black sports car at sunset" },
  { src: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80", alt: "Microfiber close-up on hood reflection" },
  { src: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&q=80", alt: "Wheel and brake caliper detail" },
  { src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80", alt: "Side profile of polished sedan" },
  { src: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80", alt: "Foam-covered hood during wash" },
  { src: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&q=80", alt: "Interior dashboard, freshly conditioned" },
];
