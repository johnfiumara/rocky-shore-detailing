export type ProcessStep = {
  number: string;
  title: string;
  body: string;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Arrive at your driveway",
    body: "arrive with tools, I trust my equiment, please allow access to water(weather through faucet or outside spicket if available)",
  },
  {
    number: "02",
    title: "Inspect & document",
    body: "Walk-around with photos so we're aligned on goals before a single mitt touches metal.",
  },
  {
    number: "03",
    title: "Wash & decontaminate",
    body: " execute the the agreed apon package",
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
