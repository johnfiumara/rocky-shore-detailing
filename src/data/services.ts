export type Service = {
  slug: string;
  package: string;
  title: string;
  size: string[];
  priceFrom?: number[];
};

export const services: Service[] = [
  {
    slug: "full-package",
    title: "Interior, Exterior, Tires, & Trunk",
    size: ["S", "M", "L"],
    package: "Full",
    priceFrom: [200, 235, 270],
  },
  {
    slug: "interior-exterior",
    title: "Interior and Exterior",
    size: ["S", "M", "L"],
    package: "interniorPlus",
    priceFrom: [150, 185, 220],
  },
  {
    slug: "interior-tires",
    title: "Interior and Tires",
    size: ["S", "M", "L"],
    package: "IandT",
    priceFrom: [145, 165, 185],
  },
  {
    slug: "exterior-tires",
    title: "Exterior and Tires",
    size: ["S", "M", "L"],
    package: "EandT",
    priceFrom: [100, 130, 130],
  },
  {
    slug: "interior-restoration",
    title: "Interior Restoration",
    size: ["S", "M", "L"],
    package: "I",
    priceFrom: [110, 130, 150],
  },
  {
    slug: "refresh",
    title: "Refresh",
    size: ["S", "M", "L"],
    package: "refresh",
    priceFrom: [65, 85, 105],
  },
];
