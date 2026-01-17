import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { RedditPixelTracker } from "@/components/reddit-pixel-tracker";
import { StemPixelTracker } from "@/components/stem-pixel-tracker";
import "./globals.css";
import Script from "next/script"; // Import Script from next/script

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const REDDIT_PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID; // New constant for GA4 ID

export const metadata: Metadata = {
  metadataBase: new URL('https://scribeandstem.com'),
  title: {
    default: 'Scribe & Stem - Wedding Planning Workspace',
    template: '%s | Scribe & Stem',
  },
  description: 'Scribe & Stem is a modern wedding planning workspace for budgets, guest lists, vendors, RSVPs, timelines, and day-of details.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  keywords: [
    'Scribe & Stem',
    'wedding planning app',
    'free wedding planner',
    'online wedding planner',
    'wedding budget calculator',
    'wedding guest list',
    'wedding checklist',
    'wedding timeline',
    'wedding seating chart',
    'wedding vendor management',
    'wedding planning help',
  ],
  authors: [{ name: 'Scribe & Stem', url: 'https://scribeandstem.com' }],
  creator: 'Scribe & Stem',
  publisher: 'Scribe & Stem',
  applicationName: 'Scribe & Stem',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scribeandstem.com',
    siteName: 'Scribe & Stem',
    title: 'Scribe & Stem - Wedding Planning Workspace',
    description: 'Plan your wedding with Scribe & Stem, a modern workspace for budgets, vendors, guests, RSVPs, timelines, and seating.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Scribe & Stem - Wedding Planning Workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scribe & Stem - Wedding Planning Workspace',
    description: 'Plan your wedding with Scribe & Stem: budgets, vendors, guests, RSVPs, timelines, and seating.',
    images: ['/og-image.png'],
    creator: '@scribeandstem',
  },
  alternates: {
    canonical: 'https://scribeandstem.com',
  },
  category: 'technology',
  other: {},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Viewport with safe area support */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Google Analytics 4 (GA4) - Conditional load */}
        {process.env.NODE_ENV === 'production' && GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Scribe & Stem',
              url: 'https://scribeandstem.com',
              logo: 'https://scribeandstem.com/logo.png',
              description: 'Scribe & Stem is a wedding planning workspace for budgets, guests, vendors, RSVPs, timelines, and day-of details.',
              email: 'hello@scribeandstem.com',
              foundingDate: '2024',
              sameAs: [
                'https://twitter.com/scribeandstem',
              ],
            }),
          }}
        />
        {/* JSON-LD: Software Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Scribe & Stem',
              alternateName: 'The Wedding OS',
              applicationCategory: 'EventPlanningApplication',
              operatingSystem: 'Web, iOS, Android',
              description: 'A wedding planning workspace for organizing budgets, guest lists, vendors, RSVPs, timelines, and seating.',
              url: 'https://scribeandstem.com',
              offers: {
                '@type': 'Offer',
                price: '12.00',
                priceCurrency: 'USD',
                priceValidUntil: '2025-12-31',
                availability: 'https://schema.org/InStock',
                description: 'Monthly subscription - Stem tier with expanded planning tools'
              },
              featureList: [
                'Budget tracking',
                'Vendor management',
                'Guest list management',
                'RSVP forms',
                'Timeline and seating tools'
              ],
              author: {
                '@type': 'Organization',
                name: 'Scribe & Stem Inc.'
              },
              potentialAction: {
                '@type': 'UseAction',
                target: 'https://scribeandstem.com/login'
              }
            }),
          }}
        />
        {/* JSON-LD: WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Scribe & Stem',
              alternateName: 'Scribe & Stem',
              url: 'https://scribeandstem.com',
              description: 'Wedding planning workspace',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://scribeandstem.com/?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* JSON-LD: FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is Scribe & Stem?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Scribe & Stem is a wedding planning workspace that brings budgets, guests, vendors, RSVPs, timelines, and seating into one place.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Scribe & Stem free to use?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, Scribe & Stem offers a free plan with essential planning tools. Paid plans unlock expanded limits and premium features.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What can Scribe & Stem help me with?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Scribe & Stem helps with budgets, timelines, vendor selection, guest management, seating charts, RSVPs, and day-of coordination.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How is Scribe & Stem different from other wedding planning apps?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Scribe & Stem focuses on an elegant, organized workspace that connects your planning data across budgets, vendors, guests, and timelines.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does Scribe & Stem sell my data?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. Scribe & Stem never sells your data to vendors or advertisers. Your wedding planning information stays private.',
                  },
                },
              ],
            }),
          }}
        />

      </head>
      <body className={`min-h-screen antialiased ${bodoni.variable} ${manrope.variable} font-sans`}>
        <Providers>
          <RedditPixelTracker />
          <StemPixelTracker />
          {children}
        </Providers>
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}
