"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Building2,
  Shirt,
  Flower2,
  Cake,
  Camera,
  Mail,
  CircleDot,
  Sparkles,
  Palette,
  LayoutGrid,
} from "lucide-react";

export type BoardCategory =
  | "all"
  | "venues"
  | "dresses"
  | "decor"
  | "flowers"
  | "cakes"
  | "photography"
  | "invitations"
  | "rings"
  | "hair-makeup";

interface CategoryTabsProps {
  activeCategory: BoardCategory;
  onCategoryChange: (category: BoardCategory) => void;
  className?: string;
}

const categories: Array<{
  id: BoardCategory;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "venues", label: "Venues", icon: Building2 },
  { id: "dresses", label: "Dresses", icon: Shirt },
  { id: "decor", label: "Decor", icon: Palette },
  { id: "flowers", label: "Flowers", icon: Flower2 },
  { id: "cakes", label: "Cakes", icon: Cake },
  { id: "photography", label: "Photos", icon: Camera },
  { id: "invitations", label: "Invites", icon: Mail },
  { id: "rings", label: "Rings", icon: CircleDot },
  { id: "hair-makeup", label: "Beauty", icon: Sparkles },
];

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryTabsProps) {
  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryTabsCompact({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryTabsProps) {
  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors min-w-[52px]",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span className="truncate">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
