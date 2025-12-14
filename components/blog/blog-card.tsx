import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
import type { BlogPost } from "@/lib/blog/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/blog/types";

interface BlogCardProps {
  post: BlogPost;
  variant?: "default" | "featured";
}

export function BlogCard({ post, variant = "default" }: BlogCardProps) {
  const categoryStyle = CATEGORY_COLORS[post.category];

  if (variant === "featured") {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lifted hover:-translate-y-1">
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
              >
                {CATEGORY_LABELS[post.category]}
              </span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-serif text-2xl md:text-3xl leading-tight mb-3 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-2">
              {post.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readingTime} min read
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft transition-all duration-300 hover:shadow-lifted hover:-translate-y-1">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={post.featuredImage}
            alt={post.featuredImageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-5">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border mb-3 ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
          >
            {CATEGORY_LABELS[post.category]}
          </span>
          <h3 className="font-serif text-xl leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">
            {post.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{post.readingTime} min read</span>
            <span>·</span>
            <span>
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
