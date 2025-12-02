import type { Metadata } from "next";

const SITE_NAME = "Aisle";
const SITE_DESCRIPTION = "Aisle is an AI wedding planner that helps couples plan their perfect wedding. Get personalized advice on budgets, venues, timelines, vendors, and more.";
const SITE_URL = "https://aisleboard.com";

export const siteConfig = {
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  ogImage: `${SITE_URL}/og.png`,
  creator: "Aisle",
  keywords: [
    "AI wedding planner",
    "wedding planning AI",
    "Aisle AI",
    "Aisle wedding planner",
    "wedding budget calculator",
    "wedding planning assistant",
    "AI wedding assistant",
    "wedding planning app",
    "wedding planning tools",
    "wedding checklist",
    "wedding timeline",
    "wedding vendor management",
    "wedding guest list",
    "wedding seating chart",
    "free wedding planner",
    "online wedding planner",
  ],
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - AI Wedding Planner`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: siteConfig.keywords,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - AI Wedding Planner`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - AI Wedding Planner`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - AI Wedding Planner`,
    description: SITE_DESCRIPTION,
    images: [siteConfig.ogImage],
    creator: "@aisleboard",
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
};
