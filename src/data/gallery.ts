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
    src: "0",
    alt: "Car with swirl marks and oxidation before correction",
  },
  after: {
    src: "0",
    alt: "Same car after paint correction, deep gloss restored",
  },
};

export const galleryGrid: GalleryImage[] = [
  { src: "public/brownTruckFloor.jpg", alt: "Detailed black sports car at sunset" },
  { src: "public/brownTruckBed.jpg", alt: "Microfiber close-up on hood reflection" },
  { src: "public/brownTruckDriverside.jpg", alt: "Wheel and brake caliper detail" },
  { src: "public/brownTruckExterior.jpg", alt: "Side profile of polished sedan" },
  { src: "public/brownTruckFloor.jpg", alt: "Foam-covered hood during wash" },
  {src:"public/BrownTruckExteriorFront.jpg", alt: "truck"}
];
