import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "../globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Account · Rocky Coast Detailing",
    template: "%s · Rocky Coast",
  },
  robots: { index: false, follow: false },
};

export default function AccountRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrument.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink text-bone">{children}</body>
    </html>
  );
}
