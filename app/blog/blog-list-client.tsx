"use client";

import { useState, useMemo } from "react";
import { BlogCard } from "@/components/blog/blog-card";
import { CategoryFilter } from "@/components/blog/category-filter";
import type { BlogPost, BlogCategory } from "@/lib/blog/types";

interface BlogListClientProps {
  initialPosts: BlogPost[];
}

export function BlogListClient({ initialPosts }: BlogListClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | "all">("all");

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") {
      return initialPosts;
    }
    return initialPosts.filter((post) => post.category === selectedCategory);
  }, [initialPosts, selectedCategory]);

  return (
    <>
      {/* Category Filter */}
      <div className="mb-10">
        <CategoryFilter
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            No posts found in this category yet.
          </p>
          <p className="text-muted-foreground mt-2">
            Check back soon for new content!
          </p>
        </div>
      )}
    </>
  );
}
