import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllPosts } from "@/lib/blog/mdx";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogListClient } from "./blog-list-client";

export const metadata: Metadata = {
  title: "Wedding Planning Blog | Scribe & Stem",
  description:
    "Expert advice on wedding budgets, vendor selection, and planning timelines. Real insights from couples who've been there.",
  openGraph: {
    title: "Wedding Planning Blog | Scribe & Stem",
    description:
      "Expert advice on wedding budgets, vendor selection, and planning timelines.",
    type: "website",
    url: "https://scribeandstem.com/blog",
  },
  alternates: {
    canonical: "https://scribeandstem.com/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
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
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-6xl tracking-tight mb-4">
              The Wedding Planning Edit
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Expert insights on budgets, vendors, and timelines. Real advice
              from couples who&apos;ve navigated the journey.
            </p>
          </div>

          {/* Blog List with Client-side filtering */}
          <BlogListClient initialPosts={posts} />
        </div>
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
  );
}
