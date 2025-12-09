import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stem | The intelligent wedding planner that actually plans.',
  description: 'Stem isn\'t just a checklist. It\'s an intelligent operating system for your wedding that manages your budget, guests, and sanity.',
  keywords: ['wedding planner', 'AI wedding planner', 'wedding planning app', 'budget planner', 'guest list manager', 'vendor management', 'wedding organizer'],
  openGraph: {
    title: 'Stem | The intelligent wedding planner that actually plans.',
    description: 'Stem isn\'t just a checklist. It\'s an intelligent operating system for your wedding that manages your budget, guests, and sanity.',
    url: 'https://aisleboard.com', // Replace with actual domain
    siteName: 'Stem',
    images: [
      {
        url: 'https://aisleboard.com/og-image.jpg', // Replace with actual OG image
        width: 1200,
        height: 630,
        alt: 'Stem - Your AI-powered wedding planner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stem | The intelligent wedding planner that actually plans.',
    description: 'Stem isn\'t just a checklist. It\'s an intelligent operating system for your wedding that manages your budget, guests, and sanity.',
    creator: '@yourtwitterhandle', // Replace with actual Twitter handle
    images: ['https://aisleboard.com/twitter-image.jpg'], // Replace with actual Twitter image
  },
  alternates: {
    canonical: 'https://aisleboard.com', // Replace with actual domain
  },
};
