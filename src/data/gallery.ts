export type GalleryImage = {
  src: string;
  alt: string;
  isBefore?: boolean;
  isAfter?: boolean;
};

export type VehicleGallery = {
  slug: string;
  label: string;
  year: number;
  make: string;
  model: string;
  color: string;
  images: GalleryImage[];
};

export const vehicles: VehicleGallery[] = [
  {
    slug: "brown-truck",
    label: "2019 Ford F-150 · Gorham",
    year: 2019,
    make: "Ford",
    model: "F-150",
    color: "Brown",
    images: [
      {
        src: "/gallery/brown-truck/exterior.jpg",
        alt: "Exterior after full detail",
        isAfter: true,
      },
      {
        src: "/gallery/brown-truck/exterior-front.jpg",
        alt: "Front quarter panel after detail",
        isAfter: true,
      },
      {
        src: "/gallery/brown-truck/driver-side.jpg",
        alt: "Driver-side exterior after detail",
        isAfter: true,
      },
      {
        src: "/gallery/brown-truck/back-seat.jpg",
        alt: "Rear interior after extraction and conditioning",
        isAfter: true,
      },
      {
        src: "/gallery/brown-truck/truck-bed.jpg",
        alt: "Truck bed cleaned and dressed",
        isAfter: true,
      },
      {
        src: "/gallery/brown-truck/floor.jpg",
        alt: "Interior floor after deep extraction",
        isAfter: true,
      },
    ],
  },
];

export type BeforeAfterPair = {
  label: string;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
};

export const beforeAfterPair: BeforeAfterPair = {
  label: "Recent detail · client pickup",
  before: {
    src: "/gallery/brown-truck/driver-side.jpg",
    alt: "Driver-side before detail",
  },
  after: {
    src: "/gallery/brown-truck/exterior-front.jpg",
    alt: "Front exterior after detail",
  },
};

export const galleryGrid = vehicles.flatMap((v) => v.images);
