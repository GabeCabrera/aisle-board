import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { RedditPixelTracker } from "@/components/reddit-pixel-tracker";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const REDDIT_PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;

export const metadata: Metadata = {
  metadataBase: new URL('https://scribeandstem.com'),
  title: {
    default: 'Scribe & Stem - Your AI Wedding Planner',
    template: '%s | Scribe & Stem',
  },
  description: 'Scribe & Stem is an AI wedding planner that helps couples plan their perfect wedding through natural conversation. Get personalized advice on budgets, venues, timelines, vendors, and more.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  keywords: [
    'AI wedding planner',
    'Scribe & Stem',
    'Scribe & Stem AI',
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
    title: 'Scribe & Stem - Your AI Wedding Planner',
    description: 'Plan your wedding with AI. Scribe & Stem is an AI wedding planner that helps couples through natural conversation. Get personalized advice on budgets, venues, timelines, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Scribe & Stem - AI Wedding Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scribe & Stem - AI Wedding Planner',
    description: 'Plan your wedding with AI. Get personalized advice on budgets, venues, timelines, and more.',
    images: ['/og-image.png'],
    creator: '@scribeandstem',
  },
  alternates: {
    canonical: 'https://scribeandstem.com',
  },
  category: 'technology',
  other: {
    'ai-assistant': 'Scribe',
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
        {/* Viewport with safe area support */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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
              description: 'Scribe & Stem is an AI wedding planner that helps couples plan their perfect wedding through natural conversation.',
              email: 'hello@scribeandstem.com',
              foundingDate: '2024',
              sameAs: [
                'https://twitter.com/scribeandstem',
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
              name: 'Scribe & Stem',
              alternateName: 'The Wedding OS',
              applicationCategory: 'EventPlanningApplication',
              operatingSystem: 'Web, iOS, Android',
              description: 'An autonomous operating system for wedding logistics, distinct from human planning services. Scribe & Stem utilizes AI agents to manage contracts, budgets, and guest data logic.',
              url: 'https://scribeandstem.com',
              offers: {
                '@type': 'Offer',
                price: '29.99',
                priceCurrency: 'USD',
                billingDuration: 'P1M',
                category: 'Subscription'
              },
              featureList: [
                'Sanity Score Calculator',
                'AI Contract Scribe',
                'Algorithmic Budgeting',
                'Vendor Email Generator',
                'RSVP Logic Engine'
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
              alternateName: 'Scribe & Stem AI',
              url: 'https://scribeandstem.com',
              description: 'AI Wedding Planner',
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
                    text: 'Scribe & Stem is an AI wedding planner that helps couples plan their perfect wedding through natural conversation. Instead of forms and checklists, you simply chat with Scribe about what you need help with.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Scribe & Stem free to use?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, Scribe & Stem offers a free plan that includes basic planning tools and limited AI messages. Premium plans are available for unlimited AI access and additional features.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What can Scribe & Stem help me with?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Scribe & Stem can help with wedding budgets, timelines, vendor selection, guest management, seating charts, day-of coordination, and general wedding planning advice.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How is Scribe & Stem different from other wedding planning apps?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Scribe & Stem uses conversational AI to provide personalized guidance instead of generic checklists. It feels like talking to a knowledgeable friend who happens to know everything about weddings.',
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
          {children}
        </Providers>
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}
