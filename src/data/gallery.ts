export type GalleryImage = {
  src: string;
  alt: string;
};

export type BeforeAfterPair = {
  before: GalleryImage;
  after: GalleryImage;
  label: string;
};

// TODO: swap in real before/after pair once shot. The current pair uses two
// angles of the same finished truck so the slider renders without 404s.
export const beforeAfter: BeforeAfterPair = {
  label: "Recent detail · client pickup",
  before: {
    src: "/brownTruckDriverside.jpg",
    alt: "Driver-side exterior after detail",
  },
  after: {
    src: "/BrownTruckExteriorFront.jpg",
    alt: "Front exterior after detail",
  },
};

export const galleryGrid: GalleryImage[] = [
  { src: "/brownTruckExterior.jpg", alt: "Exterior after detail" },
  { src: "/brownTruckBackSeat.jpg", alt: "Back seat interior after detail" },
  { src: "/brownTruckBed.jpg", alt: "Truck bed cleaned and dressed" },
  { src: "/brownTruckFloor.jpg", alt: "Interior floor after extraction" },
  { src: "/BrownTruckExteriorFront.jpg", alt: "Front quarter exterior" },
  { src: "/brownTruckDriverside.jpg", alt: "Driver-side exterior" },
];
