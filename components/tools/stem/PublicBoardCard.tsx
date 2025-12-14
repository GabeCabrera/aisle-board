"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Heart } from "lucide-react";

import type { Board } from "@/lib/db/schema";

// --- Types ---
interface BoardWithMeta extends Board {
  tenant: {
    displayName: string;
    profileImage?: string | null;
  } | null;
  ideas?: { id: string; imageUrl: string }[];
}

interface PublicBoardCardProps {
  board: BoardWithMeta;
  onClick: (b: BoardWithMeta) => void;
}

export function PublicBoardCard({ board, onClick }: PublicBoardCardProps) {
  const ideas = board.ideas || [];
  const ideaCount = ideas.length;
  const displayName = board.tenant?.displayName || "Unknown";
  const profileImage = board.tenant?.profileImage;

  // Get initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className="cursor-pointer rounded-3xl h-full shadow-soft transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lifted overflow-hidden group"
      onClick={() => onClick(board)}
    >
      {/* Cover Image Mosaic */}
      <div className="h-48 relative bg-muted">
        {ideas.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
            {ideas.slice(0, 4).map((idea, i) => (
              <div key={idea.id} className="relative overflow-hidden">
                <Image
                  src={idea.imageUrl}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
              </div>
            ))}
            {[...Array(Math.max(0, 4 - ideas.length))].map((_, i) => (
              <div key={`empty-${i}`} className="bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <ImageIcon className="h-12 w-12 text-primary/30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Idea count badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium text-foreground shadow-sm">
          <ImageIcon className="h-3 w-3" />
          {ideaCount}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Board name */}
        <h3 className="font-serif text-xl leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">
          {board.name}
        </h3>

        {/* Description */}
        {board.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {board.description}
          </p>
        )}

        {/* Author info */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary overflow-hidden relative shrink-0">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={displayName}
                fill
                className="object-cover"
                sizes="28px"
              />
            ) : (
              initials
            )}
          </div>
          <span className="text-sm text-muted-foreground truncate">
            {displayName}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
