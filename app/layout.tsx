import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { RedditPixelTracker } from "@/components/reddit-pixel-tracker";
import "./globals.css";

const REDDIT_PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;

export const metadata: Metadata = {
  metadataBase: new URL('https://aisleboard.com'),
  title: {
    default: 'Aisle - AI Wedding Planner | Plan Your Wedding with AI',
    template: '%s | Aisle',
  },
  description: 'Aisle is an AI wedding planner that helps couples plan their perfect wedding through natural conversation. Get personalized advice on budgets, venues, timelines, vendors, and more.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  keywords: [
    'AI wedding planner',
    'Aisle AI',
    'Aisle wedding planner',
    'wedding planning AI',
    'AI wedding assistant',
    'wedding planner chatbot',
    'conversational wedding planner',
    'smart wedding planner',
    'wedding planning app',
    'free wedding planner',
    'online wedding planner',
    'wedding budget calculator',
    'wedding guest list',
    'wedding checklist',
    'wedding timeline',
    'wedding seating chart',
    'wedding vendor management',
    'AI for weddings',
    'wedding planning help',
    'plan my wedding AI',
  ],
  authors: [{ name: 'Aisle', url: 'https://aisleboard.com' }],
  creator: 'Aisle',
  publisher: 'Aisle',
  applicationName: 'Aisle',
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
    siteName: 'Aisle',
    title: 'Aisle - AI Wedding Planner',
    description: 'Plan your wedding with AI. Aisle is an AI wedding planner that helps couples through natural conversation. Get personalized advice on budgets, venues, timelines, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Aisle - AI Wedding Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aisle - AI Wedding Planner',
    description: 'Plan your wedding with AI. Get personalized advice on budgets, venues, timelines, and more.',
    images: ['/og-image.png'],
    creator: '@aisleboard',
  },
  alternates: {
    canonical: 'https://aisleboard.com',
  },
  category: 'technology',
  other: {
    'ai-assistant': 'Aisle',
    'ai-type': 'Wedding Planning Assistant',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Aisle',
              url: 'https://aisleboard.com',
              logo: 'https://aisleboard.com/logo.png',
              description: 'Aisle is an AI wedding planner that helps couples plan their perfect wedding through natural conversation.',
              email: 'hello@aisleboard.com',
              foundingDate: '2024',
              sameAs: [
                'https://twitter.com/aisleboard',
              ],
            }),
          }}
        />
        {/* JSON-LD: Software Application (AI Assistant) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Aisle',
              alternateName: 'Aisle AI Wedding Planner',
              applicationCategory: 'LifestyleApplication',
              applicationSubCategory: 'AI Assistant',
              operatingSystem: 'Web',
              description: 'Aisle is an AI wedding planner that helps couples plan their perfect wedding through natural conversation. Get personalized advice on budgets, venues, timelines, vendors, and more.',
              url: 'https://aisleboard.com',
              author: {
                '@type': 'Organization',
                name: 'Aisle',
              },
              offers: {
                '@type': 'AggregateOffer',
                lowPrice: '0',
                highPrice: '99',
                priceCurrency: 'USD',
                offerCount: '2',
              },
              featureList: [
                'AI Wedding Planning Assistant',
                'Natural Language Conversation',
                'Personalized Budget Advice',
                'Timeline Recommendations',
                'Vendor Selection Guidance',
                'Guest List Management',
                'Seating Chart Builder',
                'Day-of Coordination',
              ],
              screenshot: 'https://aisleboard.com/screenshot.png',
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
              name: 'Aisle',
              alternateName: 'Aisle AI',
              url: 'https://aisleboard.com',
              description: 'AI Wedding Planner',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://aisleboard.com/?q={search_term_string}',
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
                  name: 'What is Aisle?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Aisle is an AI wedding planner that helps couples plan their perfect wedding through natural conversation. Instead of forms and checklists, you simply chat with Aisle about what you need help with.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Aisle free to use?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, Aisle offers a free plan that includes basic planning tools and limited AI messages. Premium plans are available for unlimited AI access and additional features.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What can Aisle help me with?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Aisle can help with wedding budgets, timelines, vendor selection, guest management, seating charts, day-of coordination, and general wedding planning advice.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How is Aisle different from other wedding planning apps?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Aisle uses conversational AI to provide personalized guidance instead of generic checklists. It feels like talking to a knowledgeable friend who happens to know everything about weddings.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does Aisle sell my data?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. Aisle never sells your data to vendors or advertisers. Your wedding planning information stays private.',
                  },
                },
              ],
            }),
          }}
        />
        {/* Reddit Pixel */}
        {REDDIT_PIXEL_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','${REDDIT_PIXEL_ID}',{"optOut":false,"useDecimalCurrencyValues":true});rdt('track','PageVisit');`,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://alb.reddit.com/snoo.gif?q=CAAHAAABAAoACQAAAAA2t-YnAA==&s=${REDDIT_PIXEL_ID}`}
                alt=""
              />
            </noscript>
          </>
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
