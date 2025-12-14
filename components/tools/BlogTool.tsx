"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Loader2,
  ExternalLink,
  BookOpen,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { BlogPost, BlogCategory } from "@/lib/blog/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/blog/types";

type FilterTab = BlogCategory | "all" | "saved";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All Articles" },
  { value: "saved", label: "Saved" },
  { value: "budget-finance", label: "Budget & Finance" },
  { value: "planning-tips", label: "Planning Tips" },
  { value: "vendor-guides", label: "Vendor Guides" },
];

export default function BlogTool() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  // Fetch posts based on active tab
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "saved") {
        // Fetch saved posts
        const response = await fetch("/api/blog/saved");
        if (response.ok) {
          const data = await response.json();
          setPosts(data.savedPosts || []);
          setSavedSlugs(new Set(data.savedSlugs || []));
        }
      } else {
        // Fetch all or filtered by category
        const url =
          activeTab === "all"
            ? "/api/blog"
            : `/api/blog?category=${activeTab}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
        }

        // Also fetch saved slugs to show which are saved
        const savedResponse = await fetch("/api/blog/saved");
        if (savedResponse.ok) {
          const savedData = await savedResponse.json();
          setSavedSlugs(new Set(savedData.savedSlugs || []));
        }
      }
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSaveToggle = async (slug: string, currentlySaved: boolean) => {
    setSavingSlug(slug);
    try {
      const response = await fetch("/api/blog/saved", {
        method: currentlySaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (response.ok) {
        // Update local state
        setSavedSlugs((prev) => {
          const newSet = new Set(prev);
          if (currentlySaved) {
            newSet.delete(slug);
          } else {
            newSet.add(slug);
          }
          return newSet;
        });

        // If on saved tab and unsaving, remove from list
        if (activeTab === "saved" && currentlySaved) {
          setPosts((prev) => prev.filter((p) => p.slug !== slug));
        }

        toast.success(currentlySaved ? "Article removed from saved" : "Article saved");
      } else {
        toast.error("Failed to update saved status");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to update saved status");
    } finally {
      setSavingSlug(null);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Learn
          </h1>
          <p className="text-muted-foreground mt-2">
            Expert advice and tips for your wedding planning journey
          </p>
        </div>
        <Link href="/blog" target="_blank">
          <Button variant="outline" className="rounded-full px-4 h-9">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Blog
          </Button>
        </Link>
      </div>

      {/* Tab Filter */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.value}
            variant="ghost"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "rounded-full px-4 h-9 text-sm transition-all",
              activeTab === tab.value
                ? tab.value === "saved"
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.value === "saved" && (
              <BookmarkCheck className="h-4 w-4 mr-1.5" />
            )}
            {tab.label}
            {tab.value === "saved" && savedSlugs.size > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-white/20">
                {savedSlugs.size}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogPostCard
              key={post.slug}
              post={post}
              isSaved={savedSlugs.has(post.slug)}
              isSaving={savingSlug === post.slug}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {activeTab === "saved" ? (
            <>
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-serif text-xl text-foreground mb-2">
                No saved articles yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Save articles you want to read later by clicking the bookmark icon.
              </p>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setActiveTab("all")}
              >
                Browse All Articles
              </Button>
            </>
          ) : (
            <>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-serif text-xl text-foreground mb-2">
                No articles found
              </h3>
              <p className="text-muted-foreground">
                Check back soon for new content in this category.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BlogPostCard({
  post,
  isSaved,
  isSaving,
  onSaveToggle,
}: {
  post: BlogPost;
  isSaved: boolean;
  isSaving: boolean;
  onSaveToggle: (slug: string, isSaved: boolean) => void;
}) {
  const categoryStyle = CATEGORY_COLORS[post.category];

  return (
    <article className="group h-full rounded-2xl border border-border bg-card overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lifted hover:-translate-y-1">
      <Link href={`/blog/${post.slug}`} target="_blank" className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={post.featuredImage}
            alt={post.featuredImageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-stone-700">
              <ExternalLink className="h-3 w-3" />
              Opens in new tab
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={cn(
              "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border",
              categoryStyle.bg,
              categoryStyle.text,
              categoryStyle.border
            )}
          >
            {CATEGORY_LABELS[post.category]}
          </span>

          {/* Save Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onSaveToggle(post.slug, isSaved);
            }}
            disabled={isSaving}
            className={cn(
              "p-1.5 rounded-full transition-all",
              isSaved
                ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                : "text-stone-400 hover:text-amber-500 hover:bg-amber-50"
            )}
            title={isSaved ? "Remove from saved" : "Save for later"}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        </div>

        <Link href={`/blog/${post.slug}`} target="_blank" className="block">
          <h3 className="font-serif text-xl leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">
            {post.description}
          </p>
        </Link>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readingTime} min read
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </article>
  );
}
