import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "../globals.css";

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

// JSON-LD Structured Data for LocalBusiness
export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://rockyshoredetailing.com",
  "name": "Rocky Shore Detailing",
  "description": "Hand-crafted mobile auto detailing services in Maine with paint correction, ceramic coatings, and interior restoration",
  "url": "https://rockyshoredetailing.com",
  "telephone": "+1-207-555-0100",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Maine",
    "addressRegion": "ME",
    "addressCountry": "US"
  },
  "areaServed": "ME",
  "serviceType": "Automotive Detailing",
  "priceRange": "$$",
  "image": "https://rockyshoredetailing.com/gallery/image-1.jpg",
  "logo": {
    "@type": "ImageObject",
    "url": "https://rockyshoredetailing.com/gallery/image-1.jpg"
  }
};

// JSON-LD Structured Data for Services
export const servicesJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "Service",
      "@id": "#full-package",
      "name": "Interior, Exterior, Tires & Trunk",
      "description": "Complete detailing service including full interior cleaning, exterior wash, tire treatment, and trunk cleaning",
      "serviceType": "Automotive Detailing",
      "areaServed": "ME",
      "priceRange": "$$"
    },
    {
      "@type": "Service",
      "@id": "#interior-exterior",
      "name": "Interior & Exterior",
      "description": "Professional interior and exterior detailing service for comprehensive vehicle cleaning",
      "serviceType": "Automotive Detailing",
      "areaServed": "ME",
      "priceRange": "$$"
    },
    {
      "@type": "Service",
      "@id": "#interior-tires",
      "name": "Interior & Tires",
      "description": "Interior detailing combined with professional tire treatment and cleaning",
      "serviceType": "Automotive Detailing",
      "areaServed": "ME",
      "priceRange": "$"
    },
    {
      "@type": "Service",
      "@id": "#exterior-tires",
      "name": "Exterior & Tires",
      "description": "Exterior wash and shine service combined with professional tire treatment",
      "serviceType": "Automotive Detailing",
      "areaServed": "ME",
      "priceRange": "$"
    },
    {
      "@type": "Service",
      "@id": "#interior-restoration",
      "name": "Interior Restoration",
      "description": "Deep interior restoration service focusing on cleaning and rejuvenating vehicle interiors",
      "serviceType": "Automotive Detailing",
      "areaServed": "ME",
      "priceRange": "$"
    },
    {
      "@type": "Service",
      "@id": "#refresh",
      "name": "Refresh",
      "description": "Quick refresh service for maintaining your vehicle's appearance between full detailing",
      "serviceType": "Automotive Detailing",
      "areaServed": "ME",
      "priceRange": "$"
    }
  ]
};

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
    description: "Hand-crafted mobile auto detailing by Aiden Quinn. Statewide Maine.",
    url: "https://rockyshoredetailing.com",
    siteName: "Rocky Shore Detailing",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://rockyshoredetailing.com/gallery/image-1.jpg",
        width: 1200,
        height: 630,
        alt: "Rocky Shore Detailing - Premium Auto Detailing in Maine",
        type: "image/jpeg"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Rocky Shore Detailing",
    description: "Hand-crafted mobile auto detailing by Aiden Quinn across Maine",
    images: ["https://rockyshoredetailing.com/gallery/image-1.jpg"],
    creator: "@rockyshoredet"
  },
  alternates: {
    canonical: "https://rockyshoredetailing.com"
  }
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        {/* JSON-LD Structured Data for LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {/* JSON-LD Structured Data for Services */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
        />
      </head>
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
