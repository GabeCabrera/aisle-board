"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Card } from "@/components/ui/card";
import type { Board, Idea } from '@/lib/db/schema'; // Import directly from schema

interface BoardDetailProps {
  board: Board & { tenant: { displayName: string } | null; }; // Extend Board type for tenant displayName
  ideas: Idea[];
  isOwner: boolean;
}

export function BoardDetail({ board, ideas, isOwner }: BoardDetailProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-up">
      {/* Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="pl-0 hover:pl-2 transition-all"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-8">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl md:text-7xl text-foreground tracking-tight">
            {board.name}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1 rounded-full">
              {board.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {board.isPublic ? "Public Board" : "Private Board"}
            </div>
            <span className="text-sm">by {board.tenant?.displayName || "Unknown"}</span>
            <span className="text-sm">• {ideas.length} Ideas</span>
          </div>
          {board.description && (
            <p className="text-lg text-foreground/80 max-w-2xl leading-relaxed">
              {board.description}
            </p>
          )}
        </div>

        {isOwner && (
          <Button size="lg" className="rounded-full shadow-soft hover:shadow-lifted">
            <Plus className="mr-2 h-4 w-4" /> Add Idea
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="min-h-[500px]">
        {ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/10">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-2xl text-foreground mb-2">This board is empty</h3>
            <p className="text-muted-foreground max-w-md">
              Start collecting ideas by uploading images or saving them from the Explore feed.
            </p>
          </div>
        ) : (
          <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
            <Masonry gutter="24px">
              {ideas.map((idea) => (
                <div key={idea.id} className="group relative break-inside-avoid mb-6">
                  <div className="relative overflow-hidden rounded-2xl bg-muted transition-all duration-300 hover:shadow-lifted">
                    {/* Image */}
                    <img
                      src={idea.imageUrl || "/placeholder.jpg"}
                      alt={idea.description || "Idea"}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    
                    {/* Actions (Hover) */}
                    <div className="absolute inset-0 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Placeholder for future actions like 'Save', 'Like' */}
                    </div>
                  </div>
                  {idea.description && (
                    <p className="mt-3 text-sm text-foreground/80 font-medium leading-snug">
                      {idea.description}
                    </p>
                  )}
                </div>
              ))}
            </Masonry>
          </ResponsiveMasonry>
        )}
      </div>
    </div>
  );
}
