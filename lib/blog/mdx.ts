import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { BlogPost, BlogPostWithContent, BlogCategory } from './types';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

function getPostFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }
  return fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith('.mdx'));
}

function parsePost(slug: string, fileContent: string): BlogPostWithContent {
  const { data, content } = matter(fileContent);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title || '',
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    author: data.author || { name: 'Scribe Team' },
    category: data.category || 'planning-tips',
    tags: data.tags || [],
    featuredImage: data.featuredImage || '/blog/default-hero.jpg',
    featuredImageAlt: data.featuredImageAlt || data.title || '',
    readingTime: Math.ceil(stats.minutes),
    featured: data.featured || false,
    draft: data.draft || false,
    content,
  };
}

export function getAllPosts(): BlogPost[] {
  const files = getPostFiles();

  const posts = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(BLOG_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const post = parsePost(slug, fileContent);

      // Exclude drafts in production
      if (post.draft && process.env.NODE_ENV === 'production') {
        return null;
      }

      // Return without content for listing pages
      const { content: _, ...postWithoutContent } = post;
      return postWithoutContent;
    })
    .filter((post): post is BlogPost => post !== null);

  // Sort by date (newest first), then by featured status
  return posts.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getPostBySlug(slug: string): BlogPostWithContent | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  return parsePost(slug, fileContent);
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter((post) => post.category === category);
}

export function getFeaturedPosts(limit: number = 3): BlogPost[] {
  const posts = getAllPosts();

  // Get featured posts first, then fill with recent posts
  const featured = posts.filter((post) => post.featured);
  const nonFeatured = posts.filter((post) => !post.featured);

  return [...featured, ...nonFeatured].slice(0, limit);
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const currentPost = getPostBySlug(currentSlug);
  if (!currentPost) return [];

  const allPosts = getAllPosts().filter((post) => post.slug !== currentSlug);

  // Score posts by relevance (same category + shared tags)
  const scoredPosts = allPosts.map((post) => {
    let score = 0;
    if (post.category === currentPost.category) score += 2;
    const sharedTags = post.tags.filter((tag) => currentPost.tags.includes(tag));
    score += sharedTags.length;
    return { post, score };
  });

  // Sort by score and return top posts
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

export function getAllCategories(): BlogCategory[] {
  return ['budget-finance', 'planning-tips', 'vendor-guides'];
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}
