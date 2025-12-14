import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { getPostBySlug, getAllPosts, getRelatedPosts } from "@/lib/blog/mdx";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/blog/types";
import { ShareButtons } from "@/components/blog/share-buttons";
import { BlogCard } from "@/components/blog/blog-card";
import ReactMarkdown from "react-markdown";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | Scribe & Stem",
    };
  }

  const url = `https://scribeandstem.com/blog/${post.slug}`;

  return {
    title: `${post.title} | Scribe & Stem`,
    description: post.description,
    authors: [{ name: post.author.name }],
    keywords: [post.category, ...post.tags],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      authors: [post.author.name],
      images: [
        {
          url: post.featuredImage,
          width: 1200,
          height: 630,
          alt: post.featuredImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.featuredImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 3);
  const categoryStyle = CATEGORY_COLORS[post.category];
  const postUrl = `https://scribeandstem.com/blog/${post.slug}`;

  // Article structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `https://scribeandstem.com${post.featuredImage}`,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Scribe & Stem",
      logo: {
        "@type": "ImageObject",
        url: "https://scribeandstem.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link
              href="/"
              className="font-serif text-2xl font-medium tracking-tight"
            >
              Scribe & Stem
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Articles
            </Link>
          </div>
        </header>

        <main className="pt-24 pb-16">
          <article className="max-w-3xl mx-auto px-6">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                >
                  {CATEGORY_LABELS[post.category]}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readingTime} min read
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight mb-6">
                {post.title}
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                {post.description}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-sm">
                      {post.author.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{post.author.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <ShareButtons url={postUrl} title={post.title} />
              </div>
            </header>

            {/* Featured Image */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10">
              <Image
                src={post.featuredImage}
                alt={post.featuredImageAlt}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Content */}
            <div className="prose prose-lg prose-stone max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="font-serif text-3xl mt-12 mb-4">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="font-serif text-2xl mt-8 mb-3">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-6">
                      {children}
                    </ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-6">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 mt-16">
              <h2 className="font-serif text-3xl text-center mb-8">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost.slug} post={relatedPost} />
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <Link
              href="/"
              className="font-serif text-xl font-medium tracking-tight"
            >
              Scribe & Stem
            </Link>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Scribe & Stem. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
