export type ServiceTier = {
  size: "S" | "M" | "L";
  price: number;
};

export type Service = {
  slug: string;
  title: string;
  tiers: ServiceTier[];
};

export const services: Service[] = [
  {
    slug: "full-package",
    title: "Interior, Exterior, Tires & Trunk",
    tiers: [
      { size: "S", price: 200 },
      { size: "M", price: 235 },
      { size: "L", price: 270 },
    ],
  },
  {
    slug: "interior-exterior",
    title: "Interior & Exterior",
    tiers: [
      { size: "S", price: 150 },
      { size: "M", price: 185 },
      { size: "L", price: 220 },
    ],
  },
  {
    slug: "interior-tires",
    title: "Interior & Tires",
    tiers: [
      { size: "S", price: 145 },
      { size: "M", price: 165 },
      { size: "L", price: 185 },
    ],
  },
  {
    slug: "exterior-tires",
    title: "Exterior & Tires",
    tiers: [
      { size: "S", price: 100 },
      { size: "M", price: 130 },
      { size: "L", price: 130 },
    ],
  },
  {
    slug: "interior-restoration",
    title: "Interior Restoration",
    tiers: [
      { size: "S", price: 110 },
      { size: "M", price: 130 },
      { size: "L", price: 150 },
    ],
  },
  {
    slug: "refresh",
    title: "Refresh",
    tiers: [
      { size: "S", price: 65 },
      { size: "M", price: 85 },
      { size: "L", price: 105 },
    ],
  },
];
