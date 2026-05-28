export type ProcessStep = {
  number: string;
  title: string;
  body: string;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Arrive at your driveway",
    body: "I show up with my own tools and supplies. All I ask is access to water — an outdoor spigot or interior faucet works.",
  },
  {
    number: "02",
    title: "Inspect & document",
    body: "Walk-around with photos so we're aligned on goals before a single mitt touches metal.",
  },
  {
    number: "03",
    title: "Wash & decontaminate",
    body: "Execute the agreed-upon package — wash, decontamination, and any add-ons you booked.",
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
