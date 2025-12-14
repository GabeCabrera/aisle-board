import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFeaturedPosts } from "@/lib/blog/mdx";
import { BlogCard } from "@/components/blog/blog-card";

export function BlogSection() {
  const posts = getFeaturedPosts(3);

  // Don't render if no posts
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">
            The Wedding Planning Edit
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert insights for your planning journey. Real advice from couples
            who&apos;ve navigated the chaos.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/blog">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-2 hover:bg-muted/50 gap-2"
            >
              Browse All Articles
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
