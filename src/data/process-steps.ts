export type ProcessStep = {
  number: string;
  title: string;
  body: string;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Arrive at your driveway",
    body: "Mobile setup — water, power, and product all come with the truck. No drop-off, no shop visit.",
  },
  {
    number: "02",
    title: "Inspect & document",
    body: "Walk-around with photos and paint readings so we're aligned on goals before a single mitt touches metal.",
  },
  {
    number: "03",
    title: "Wash & decontaminate",
    body: "Foam pre-wash, two-bucket hand wash, iron-x, clay if needed. Bonded contaminants gone before polishing starts.",
  },
  {
    number: "04",
    title: "Polish & protect",
    body: "Correction passes if you booked them, finishing polish, then sealant or ceramic coating cured to spec.",
  },
  {
    number: "05",
    title: "Final reveal",
    body: "Side-by-side photos, care instructions, and a receipt. You drive off looking like you just bought it.",
  },
];
