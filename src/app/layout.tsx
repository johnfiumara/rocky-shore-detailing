import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/smooth-scroll";
import MotionProvider from "@/components/motion-provider";
import Cursor from "@/components/cursor";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rocky Shore Detailing — Mobile Auto Detailing across Maine",
    template: "%s · Rocky Shore Detailing",
  },
  description:
    "Hand-crafted mobile auto detailing by Aiden Quinn. Paint correction, ceramic coatings, interior restoration — at your driveway, statewide across Maine.",
  metadataBase: new URL("https://rockyshoredetailing.com"),
  openGraph: {
    title: "Rocky Shore Detailing",
    description:
      "Hand-crafted mobile auto detailing by Aiden Quinn. Statewide Maine.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-bone grain vignette has-cursor">
        <MotionProvider>
          <SmoothScroll>
            <Cursor />
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </SmoothScroll>
        </MotionProvider>
      </body>
    </html>
  );
}
