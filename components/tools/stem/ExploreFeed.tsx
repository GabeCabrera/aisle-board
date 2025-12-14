"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { PublicBoardCard } from "./PublicBoardCard";
import { CategoryTabs, type BoardCategory } from "./CategoryTabs";
import { SuggestionsCard } from "./SuggestionsCard";
import { Search, Loader2, TrendingUp, Clock, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Board, Idea } from '@/lib/db/schema';

// Define PublicBoard by extending Board and adding tenant info and ideas
interface PublicBoard extends Board {
  tenant: {
    id: string;
    displayName: string;
    profileImage?: string | null;
  } | null;
  ideas?: { id: string; imageUrl: string }[];
  ideaCount?: number;
}

interface IdeaWithBoard extends Idea {
  board: PublicBoard;
}

interface ExploreFeedProps {
  initialBoards: PublicBoard[];
}

type SortOption = "trending" | "recent" | "popular";

const sortOptions: Array<{ id: SortOption; label: string; icon: React.ElementType }> = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "popular", label: "Popular", icon: Heart },
];

export function ExploreFeed({ initialBoards }: ExploreFeedProps) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IdeaWithBoard[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // New state for enhanced explore
  const [activeCategory, setActiveCategory] = useState<BoardCategory>("all");
  const [sortBy, setSortBy] = useState<SortOption>("trending");
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Fetch boards with filters
  const fetchBoards = useCallback(async (reset: boolean = false) => {
    setIsLoadingBoards(true);
    try {
      const newOffset = reset ? 0 : offset;
      const response = await fetch(
        `/api/stem/explore?category=${activeCategory}&sortBy=${sortBy}&limit=20&offset=${newOffset}`
      );
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setBoards(data.boards);
          setOffset(20);
        } else {
          setBoards((prev) => [...prev, ...data.boards]);
          setOffset((prev) => prev + 20);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error fetching explore feed:", error);
    } finally {
      setIsLoadingBoards(false);
    }
  }, [activeCategory, sortBy, offset]);

  // Refetch when category or sort changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchBoards(true);
    }
  }, [activeCategory, sortBy]);

  // Search effect
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/ideas/search?query=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        } else {
          console.error("Failed to fetch search results");
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search API error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const handler = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (!isLoadingBoards && hasMore) {
      fetchBoards(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight">
            Explore
          </h1>
          <p className="text-lg text-muted-foreground mt-2 font-light max-w-lg">
            Discover wedding inspiration from the community
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vibes, styles..."
            className="pl-10 h-11 rounded-full bg-muted/30 border-transparent focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters Row - Only show when not searching */}
      {!searchQuery.trim() && (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Category Tabs */}
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            className="flex-1"
          />

          {/* Sort Options */}
          <div className="flex gap-1 flex-shrink-0">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isActive = sortBy === option.id;
              return (
                <Button
                  key={option.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy(option.id)}
                  className="h-8"
                >
                  <Icon className="h-3.5 w-3.5 mr-1" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Boards Grid */}
        <div className="flex-1 min-w-0">
          {searchQuery.trim() ? (
            // Display Search Results
            <div className="min-h-[400px]">
              {isSearching ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground">
                  <p>No ideas found matching &quot;{searchQuery}&quot;.</p>
                </div>
              ) : (
                <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
                  <Masonry gutter="20px">
                    {searchResults.map((idea) => (
                      <div key={idea.id} className="mb-4">
                        <Card onClick={() => router.push(`/planner/stem/board/${idea.board.id}`)} className="cursor-pointer rounded-2xl h-full shadow-soft transition-all duration-200 hover:translate-y-[-2px] hover:shadow-medium">
                            <img
                              src={idea.imageUrl}
                              alt={idea.title || idea.description || "Idea"}
                              className="w-full h-auto object-cover rounded-t-2xl"
                              loading="lazy"
                            />
                            <CardContent className="p-3">
                                <h3 className="font-medium text-sm leading-tight mb-1">{idea.title || idea.description?.substring(0, 50) + '...' || 'Untitled Idea'}</h3>
                                <p className="text-xs text-muted-foreground">
                                    by {idea.board.tenant?.displayName || "Unknown"}
                                </p>
                            </CardContent>
                        </Card>
                      </div>
                    ))}
                  </Masonry>
                </ResponsiveMasonry>
              )}
            </div>
          ) : (
            // Display Filtered Boards
            <div className="min-h-[400px]">
              {isLoadingBoards && boards.length === 0 ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : boards.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground">
                  <p>No boards found in this category.</p>
                </div>
              ) : (
                <>
                  <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
                    <Masonry gutter="20px">
                      {boards.map((board) => (
                        <div key={board.id} className="mb-4">
                          <PublicBoardCard
                            board={board}
                            onClick={() => router.push(`/planner/stem/board/${board.id}`)}
                          />
                        </div>
                      ))}
                    </Masonry>
                  </ResponsiveMasonry>

                  {/* Load More */}
                  {hasMore && (
                    <div className="flex justify-center pt-8">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoadingBoards}
                      >
                        {isLoadingBoards ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Suggestions Sidebar - Desktop Only */}
        {!searchQuery.trim() && (
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              <SuggestionsCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}