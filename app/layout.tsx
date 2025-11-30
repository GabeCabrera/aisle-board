import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { RedditPixelTracker } from "@/components/reddit-pixel-tracker";
import "./globals.css";

const REDDIT_PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;

export const metadata: Metadata = {
  metadataBase: new URL('https://aisleboard.com'),
  title: {
    default: 'Aisle - Free Wedding Planner App | Plan Your Wedding Online',
    template: '%s | Aisle Wedding Planner',
  },
  description: 'Plan your wedding stress-free with Aisle. Free online wedding planner with budget tracker, guest list manager, seating charts, day-of timeline, and more. Start planning today.',
  keywords: [
    'wedding planner',
    'wedding planning app',
    'free wedding planner',
    'online wedding planner',
    'wedding budget tracker',
    'wedding guest list',
    'wedding checklist',
    'wedding timeline',
    'wedding seating chart',
    'wedding organizer',
    'plan my wedding',
    'wedding planning tool',
    'wedding planning website',
    'bride planner',
    'engaged couple',
    'wedding day planner',
    'wedding planning checklist',
    'wedding vendor tracker',
    'DIY wedding planner',
    'simple wedding planner',
  ],
  authors: [{ name: 'Aisle', url: 'https://aisleboard.com' }],
  creator: 'Aisle',
  publisher: 'Aisle',
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
    url: 'https://aisleboard.com',
    siteName: 'Aisle Wedding Planner',
    title: 'Aisle - Free Wedding Planner App | Plan Your Wedding Online',
    description: 'A calm, beautiful space to plan your wedding together. Free online wedding planner with budget tracker, guest list, seating charts, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Aisle - Wedding Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aisle - Free Wedding Planner App',
    description: 'A calm, beautiful space to plan your wedding together. Budget tracker, guest list, seating charts & more.',
    images: ['/og-image.png'],
    creator: '@aaborded',
  },
  alternates: {
    canonical: 'https://aisleboard.com',
  },
  category: 'wedding planning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data for SEO and AI */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Aisle Wedding Planner',
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'AggregateOffer',
                lowPrice: '0',
                highPrice: '29',
                priceCurrency: 'USD',
                offerCount: '2',
                offers: [
                  {
                    '@type': 'Offer',
                    name: 'Essentials',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free wedding planner with budget tracker, guest list, and day-of schedule',
                  },
                  {
                    '@type': 'Offer',
                    name: 'Complete',
                    price: '29',
                    priceCurrency: 'USD',
                    description: 'Full wedding planner with all templates, seating charts, vendor tracking, and lifetime access',
                  },
                ],
              },
              description: 'A calm, beautiful online wedding planner. Plan your wedding stress-free with budget tracker, guest list manager, seating charts, day-of timeline, vendor tracking, and more.',
              url: 'https://aisleboard.com',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '5',
                ratingCount: '1',
              },
              featureList: [
                'Wedding Budget Tracker',
                'Guest List Management',
                'RSVP Tracking',
                'Seating Chart Builder',
                'Day-of Timeline',
                'Vendor Contact Management',
                'Wedding Party Management',
                'Planning Checklists',
                'PDF Export',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Aisle',
              url: 'https://aisleboard.com',
              logo: 'https://aisleboard.com/logo.png',
              description: 'Wedding planning made simple and beautiful',
              foundingDate: '2024',
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'hello@aisleboard.com',
                contactType: 'customer support',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Aisle Wedding Planner',
              url: 'https://aisleboard.com',
              description: 'Free online wedding planner app',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://aisleboard.com/?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Is Aisle wedding planner free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! Aisle offers a free Essentials plan that includes a budget tracker, guest list manager, and day-of schedule. The Complete plan is a one-time $29 payment for lifetime access to all features.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What features does Aisle wedding planner include?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Aisle includes budget tracking, guest list management, RSVP tracking, seating chart builder, day-of timeline, vendor contact management, wedding party management, planning checklists, and PDF export.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Do I need to download an app to use Aisle?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No, Aisle is a web-based wedding planner that works in your browser. No app download required - access your wedding plans from any device.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is there a subscription fee for Aisle?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No subscriptions! The free plan is free forever, and the Complete plan is a one-time $29 payment with lifetime access.',
                  },
                },
              ],
            }),
          }}
        />
        {REDDIT_PIXEL_ID && (
          <Script
            id="reddit-pixel"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
rdt('init','${REDDIT_PIXEL_ID}', {"optOut":false,"useDecimalCurrencyValues":true});
rdt('track', 'PageVisit');
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <RedditPixelTracker />
          {children}
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 300,
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
