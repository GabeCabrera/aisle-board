import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog/mdx';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://scribeandstem.com';
  const now = new Date();

  // Get all blog posts
  const posts = getAllPosts();
  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    // Landing page - highest priority
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    // Marketing/Feature pages
    {
      url: `${baseUrl}/scribe`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/logic`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Blog
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...blogPages,
    // Auth pages
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Legal pages
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
