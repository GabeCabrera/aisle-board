import { NextResponse } from 'next/server';
import { getAllPosts, getPostsByCategory } from '@/lib/blog/mdx';
import type { BlogCategory } from '@/lib/blog/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as BlogCategory | null;

    const posts = category ? getPostsByCategory(category) : getAllPosts();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
