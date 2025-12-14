"use client";

import { cn } from "@/lib/utils";
import type { BlogCategory } from "@/lib/blog/types";
import { CATEGORY_LABELS } from "@/lib/blog/types";

interface CategoryFilterProps {
  selected: BlogCategory | "all";
  onChange: (category: BlogCategory | "all") => void;
}

const categories: (BlogCategory | "all")[] = [
  "all",
  "budget-finance",
  "planning-tips",
  "vendor-guides",
];

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            selected === category
              ? "bg-primary text-white"
              : "bg-white border border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
          )}
        >
          {category === "all" ? "All Posts" : CATEGORY_LABELS[category]}
        </button>
      ))}
    </div>
  );
}
