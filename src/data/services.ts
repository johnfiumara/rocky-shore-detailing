export type Service = {
  slug: string;
  eyebrow: string;
  title: string;
  tagline: string;
  inclusions: string[];
  priceFrom?: string;
};

export const services: Service[] = [
  {
    slug: "express-wash",
    eyebrow: "01 · Maintenance",
    title: "Express Wash",
    tagline: "A quick, careful reset between full details — never a drive-through.",
    inclusions: [
      "Two-bucket hand wash",
      "Wheel & tire cleaning",
      "Spray sealant top-up",
      "Glass cleaned inside & out",
      "Door jambs wiped",
    ],
  },
  {
    slug: "full-detail",
    eyebrow: "02 · Signature",
    title: "Full Detail",
    tagline: "The complete reset — outside and in.",
    inclusions: [
      "Full decontamination wash",
      "Iron remover + clay treatment",
      "Single-stage polish",
      "Interior deep clean & vacuum",
      "Leather conditioned, plastics dressed",
    ],
  },
  {
    slug: "paint-correction",
    eyebrow: "03 · Restoration",
    title: "Paint Correction",
    tagline: "Multi-stage compounding to remove swirl marks, light scratches, and oxidation.",
    inclusions: [
      "Paint depth measurement",
      "Two- or three-stage cut & polish",
      "Defect removal up to 80–95%",
      "Finishing polish for clarity",
      "Sealant or coating prep",
    ],
  },
  {
    slug: "ceramic-coating",
    eyebrow: "04 · Protection",
    title: "Ceramic Coating",
    tagline: "Long-term gloss and chemical resistance — measured in years, not weeks.",
    inclusions: [
      "Paint correction prep",
      "Panel-wipe & IPA prep",
      "Professional-grade ceramic application",
      "12-hour cure window",
      "Aftercare kit & instructions",
    ],
  },
  {
    slug: "interior-restoration",
    eyebrow: "05 · Interior",
    title: "Interior Restoration",
    tagline: "Pet hair, spills, scent, stains — handled.",
    inclusions: [
      "Full vacuum incl. seat rails",
      "Hot-water extraction on fabrics",
      "Leather clean + condition",
      "Headliner & vents detailed",
      "Odor neutralizer treatment",
    ],
  },
];
