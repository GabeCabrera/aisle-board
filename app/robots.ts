import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://scribeandstem.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/vendors/',
          '/vendors/*',
          '/blog/',
          '/blog/*',
        ],
        disallow: [
          '/api/',
          '/planner/',
          '/settings/',
          '/templates/',
          '/welcome/',
          '/choose-plan/',
          '/payment-success/',
          '/subscription-success/',
          '/admin/',
          '/unsubscribe/',
          '/change-password/',
          '/reset-password/',
          '/rsvp/',  // Dynamic user RSVP pages
          '/scribe/*',  // Dynamic scribe pages (not the landing)
        ],
      },
      // AI Crawlers - explicitly allow for training/indexing
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/planner/', '/admin/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/planner/', '/admin/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/planner/', '/admin/'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/api/', '/planner/', '/admin/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api/', '/planner/', '/admin/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/api/', '/planner/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
